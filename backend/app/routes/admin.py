# ----- FILE: backend/app/routes/admin.py -----
from flask import Blueprint, request, jsonify, Response, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from sqlalchemy import func, or_, and_, text
import base64
import csv
import io
import os
import sqlite3
import time
import json
import hashlib
import hmac
from uuid import uuid4
from ..extensions import db, redis_cache, limiter
from ..db_safety import compute_audit_integrity_hash, strip_audit_integrity
from ..models import (
    User, Worker, Employer, Job, Application, Payment, 
    Review, Verification, Skill, WorkerSkill, Message
)
from ..models.login_log import AuditLog
from ..utils.helpers import get_current_user_id
from ..models.user import UserRole, AdminRole
from ..models.job import JobStatus
from ..models.payment import PaymentStatus
from ..utils.permissions import admin_required
from ..utils.admin_permissions import get_user_permissions

admin_bp = Blueprint("admin", __name__)


ACTION_APPROVAL_POLICY = {
    "delete_user": {
        "request_roles": {AdminRole.SUPER_ADMIN, AdminRole.OPS_ADMIN},
        "approve_roles": {AdminRole.SUPER_ADMIN},
        "execute_roles": {AdminRole.SUPER_ADMIN, AdminRole.OPS_ADMIN},
    },
    "bulk_delete_users": {
        "request_roles": {AdminRole.SUPER_ADMIN, AdminRole.OPS_ADMIN},
        "approve_roles": {AdminRole.SUPER_ADMIN},
        "execute_roles": {AdminRole.SUPER_ADMIN, AdminRole.OPS_ADMIN},
    },
}


ACTION_PERMISSION_POLICY = {
    "delete_user": {
        "request_permission": "users:suspend",
        "approve_permission": "users:suspend",
        "execute_permission": "users:suspend",
    },
    "bulk_delete_users": {
        "request_permission": "users:suspend",
        "approve_permission": "users:suspend",
        "execute_permission": "users:suspend",
    },
}


def _is_super_admin(user):
    return (
        user
        and user.role == UserRole.ADMIN
        and user.admin_role == AdminRole.SUPER_ADMIN
    )


def _get_admin_user(user_id):
    user = User.query.get(int(user_id))
    if not user or user.role != UserRole.ADMIN:
        return None
    return user


def _get_admin_role(user):
    return user.admin_role if user and user.admin_role else AdminRole.OPS_ADMIN


def _approval_rate_limit_key():
    try:
        admin_id = get_jwt_identity()
        if admin_id:
            return f"approval:{admin_id}"
    except Exception:
        pass
    return f"approval_ip:{request.remote_addr}"


def _security_events_rate_limit_key():
    try:
        admin_id = get_jwt_identity()
        if admin_id:
            return f"security_events:{admin_id}"
    except Exception:
        pass
    return f"security_events_ip:{request.remote_addr}"


def _safe_parse_policy_overrides(raw):
    if not raw:
        return {}
    try:
        parsed = json.loads(raw)
        return parsed if isinstance(parsed, dict) else {}
    except Exception:
        return {}


def _resolve_action_approval_policy(action_name):
    base = ACTION_APPROVAL_POLICY.get(action_name, {})
    policy = {
        "request_roles": set(base.get("request_roles", set())),
        "approve_roles": set(base.get("approve_roles", set())),
        "execute_roles": set(base.get("execute_roles", set())),
    }
    overrides = _safe_parse_policy_overrides(
        current_app.config.get("ADMIN_APPROVAL_POLICY_OVERRIDES", "")
    )
    action_override = overrides.get(action_name, {}) if isinstance(overrides, dict) else {}
    if isinstance(action_override, dict):
        for key in ("request_roles", "approve_roles", "execute_roles"):
            if key in action_override and isinstance(action_override[key], list):
                policy[key] = set(str(role).strip() for role in action_override[key] if str(role).strip())
    return policy


def _resolve_action_permission_policy(action_name):
    policy = ACTION_PERMISSION_POLICY.get(action_name, {}).copy()
    overrides = _safe_parse_policy_overrides(
        current_app.config.get("ADMIN_APPROVAL_PERMISSION_OVERRIDES", "")
    )
    action_override = overrides.get(action_name, {}) if isinstance(overrides, dict) else {}
    if isinstance(action_override, dict):
        for key in ("request_permission", "approve_permission", "execute_permission"):
            if key in action_override and isinstance(action_override[key], str):
                policy[key] = action_override[key]
    return policy


def _has_admin_permission(user, permission_name):
    if not permission_name:
        return True
    return permission_name in get_user_permissions(user)


def _check_approval_permission(action_name, user, stage):
    policy = _resolve_action_permission_policy(action_name)
    if not policy:
        return None

    permission_name = policy.get(f"{stage}_permission")
    if permission_name and not _has_admin_permission(user, permission_name):
        return jsonify({
            "error": "Insufficient approval permission",
            "action": action_name,
            "stage": stage,
            "required_permission": permission_name,
            "your_permissions": get_user_permissions(user),
        }), 403
    return None


def _check_approval_policy(action_name, user, stage):
    policy = _resolve_action_approval_policy(action_name)
    if not policy:
        return None

    allowed_roles = policy.get(f"{stage}_roles")
    user_role = _get_admin_role(user)
    user_role_value = user_role.value if hasattr(user_role, "value") else str(user_role)
    normalized_allowed = {
        role.value if hasattr(role, "value") else str(role)
        for role in (allowed_roles or set())
    }
    if normalized_allowed and user_role_value not in normalized_allowed:
        return jsonify({
            "error": "Insufficient approval role",
            "action": action_name,
            "stage": stage,
            "required_roles": sorted(list(normalized_allowed)),
            "your_role": user_role_value,
        }), 403
    return None


def _require_admin_confirmation(action_name):
    if not current_app.config.get("REQUIRE_ADMIN_CONFIRMATION", True):
        return None

    expected = current_app.config.get("ADMIN_ACTION_CONFIRMATION_TOKEN")
    if not expected:
        return None

    provided = request.headers.get("X-Admin-Confirm")
    if provided != expected:
        return jsonify({
            "error": "Admin confirmation required",
            "message": f"Missing or invalid X-Admin-Confirm for action '{action_name}'"
        }), 403
    return None


def _canonical_payload_hash(payload):
    canonical = json.dumps(payload or {}, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def _new_security_event_id(action_name):
    normalized = str(action_name or "event").replace(" ", "_").lower()
    return f"sec_{normalized}_{uuid4().hex[:16]}"


def _idempotency_store_key(action_name, provided_key, payload_hash):
    digest = hashlib.sha256(
        f"{action_name}:{provided_key}:{payload_hash}".encode("utf-8")
    ).hexdigest()
    return f"admin:idempotency:{digest}"


def _require_idempotency(action_name, payload):
    if not current_app.config.get("ADMIN_IDEMPOTENCY_ENABLED", True):
        return None, None

    provided_key = request.headers.get("Idempotency-Key") or request.headers.get("X-Idempotency-Key")
    if not provided_key:
        return jsonify({
            "error": "Idempotency key required",
            "message": "Provide Idempotency-Key header for this action",
            "action": action_name,
        }), None

    payload_hash = _canonical_payload_hash(payload)
    store_key = _idempotency_store_key(action_name, provided_key, payload_hash)
    existing = redis_cache.get(store_key)
    if existing:
        if isinstance(existing, bytes):
            existing = existing.decode("utf-8")
        if isinstance(existing, str):
            existing = json.loads(existing)

        if existing.get("status") == "completed":
            body = existing.get("response") or {"message": "Replay detected"}
            body["idempotent_replay"] = True
            status_code = int(existing.get("status_code", 200))
            return jsonify(body), None

        return jsonify({"error": "Duplicate request in progress"}), None

    ttl = current_app.config.get("ADMIN_IDEMPOTENCY_TTL_SECONDS", 3600)
    redis_cache.setex(
        store_key,
        ttl,
        json.dumps({
            "status": "in_progress",
            "action": action_name,
            "started_at": datetime.utcnow().isoformat(),
        }),
    )
    return None, store_key


def _finalize_idempotency(store_key, response_body, status_code):
    if not store_key:
        return
    ttl = current_app.config.get("ADMIN_IDEMPOTENCY_TTL_SECONDS", 3600)
    redis_cache.setex(
        store_key,
        ttl,
        json.dumps({
            "status": "completed",
            "status_code": int(status_code),
            "response": response_body,
            "completed_at": datetime.utcnow().isoformat(),
        }),
    )


def _clear_idempotency(store_key):
    if store_key:
        redis_cache.delete(store_key)


def _approval_key(approval_id):
    return f"admin:approval:{approval_id}"


def _approval_index_key():
    return "admin:approvals:index"


def _store_approval(record, ttl):
    redis_cache.setex(_approval_key(record["id"]), ttl, json.dumps(record))
    redis_cache.sadd(_approval_index_key(), record["id"])


def _load_approval(approval_id):
    raw = redis_cache.get(_approval_key(approval_id))
    if not raw:
        return None
    if isinstance(raw, bytes):
        raw = raw.decode("utf-8")
    if isinstance(raw, str):
        return json.loads(raw)
    return raw


def _list_approvals(status=None, requested_by=None, limit=100):
    approval_ids = list(redis_cache.smembers(_approval_index_key()) or set())
    approvals = []
    for approval_id in approval_ids:
        approval = _load_approval(str(approval_id))
        if not approval:
            redis_cache.srem(_approval_index_key(), str(approval_id))
            continue

        if status and approval.get("status") != status:
            continue
        if requested_by is not None and int(approval.get("requested_by")) != int(requested_by):
            continue
        approvals.append(approval)

    approvals.sort(key=lambda item: item.get("requested_at", ""), reverse=True)
    return approvals[: max(1, min(limit, 500))]


def _require_two_person_approval(action_name, payload, executor_id):
    if not current_app.config.get("TWO_PERSON_APPROVAL_ENABLED", True):
        return None

    approval_id = request.headers.get("X-Approval-ID")
    if not approval_id:
        return jsonify({
            "error": "Approval required",
            "message": "X-Approval-ID header is required for this action",
            "action": action_name,
        }), 403

    approval = _load_approval(approval_id)
    if not approval:
        return jsonify({"error": "Approval not found or expired"}), 403

    if approval.get("status") != "approved":
        return jsonify({"error": "Approval is not in approved state"}), 403

    if approval.get("action") != action_name:
        return jsonify({"error": "Approval action mismatch"}), 403

    executor_user = _get_admin_user(executor_id)
    if not executor_user:
        return jsonify({"error": "Admin user not found"}), 404

    policy_error = _check_approval_policy(action_name, executor_user, "execute")
    if policy_error:
        return policy_error

    permission_error = _check_approval_permission(action_name, executor_user, "execute")
    if permission_error:
        return permission_error

    if approval.get("payload_hash") != _canonical_payload_hash(payload):
        return jsonify({"error": "Approval payload mismatch"}), 403

    requester_id = int(approval.get("requested_by"))
    approved_by = int(approval.get("approved_by"))
    if requester_id == approved_by:
        return jsonify({"error": "Approval invalid: requester and approver must differ"}), 403
    if approved_by == int(executor_id):
        return jsonify({"error": "Approver cannot execute the approved action"}), 403

    approval["status"] = "consumed"
    approval["consumed_at"] = datetime.utcnow().isoformat()
    approval["consumed_by"] = int(executor_id)
    _store_approval(approval, current_app.config.get("ADMIN_APPROVAL_TTL_SECONDS", 1800))
    return None


def _sign_audit_export(payload_bytes):
    digest = hashlib.sha256(payload_bytes).hexdigest()
    signing_key = (
        current_app.config.get("AUDIT_EXPORT_SIGNING_KEY")
        or current_app.config.get("SECRET_KEY")
        or "change-me"
    )
    signature = hmac.new(
        signing_key.encode("utf-8"),
        payload_bytes,
        hashlib.sha256,
    ).hexdigest()
    return digest, signature


def _security_feed_signing_key():
    return (
        current_app.config.get("AUDIT_EXPORT_SIGNING_KEY")
        or current_app.config.get("SECRET_KEY")
        or "change-me"
    )


def _encode_security_feed_cursor(payload):
    canonical = json.dumps(payload, sort_keys=True, separators=(",", ":")).encode("utf-8")
    signature = hmac.new(
        _security_feed_signing_key().encode("utf-8"),
        canonical,
        hashlib.sha256,
    ).hexdigest().encode("utf-8")
    return (
        base64.urlsafe_b64encode(canonical).decode("utf-8").rstrip("=")
        + "."
        + base64.urlsafe_b64encode(signature).decode("utf-8").rstrip("=")
    )


def _decode_security_feed_cursor(token):
    try:
        data_b64, sig_b64 = token.split(".", 1)
    except ValueError:
        raise ValueError("Invalid cursor format")

    def _b64decode(value):
        padding = "=" * (-len(value) % 4)
        return base64.urlsafe_b64decode((value + padding).encode("utf-8"))

    try:
        canonical = _b64decode(data_b64)
        provided_sig = _b64decode(sig_b64).decode("utf-8")
    except Exception as exc:
        raise ValueError("Invalid cursor encoding") from exc

    expected_sig = hmac.new(
        _security_feed_signing_key().encode("utf-8"),
        canonical,
        hashlib.sha256,
    ).hexdigest()
    if not hmac.compare_digest(provided_sig, expected_sig):
        raise ValueError("Invalid cursor signature")

    try:
        payload = json.loads(canonical.decode("utf-8"))
    except Exception as exc:
        raise ValueError("Invalid cursor payload") from exc

    exp = payload.get("exp")
    if exp and int(exp) < int(time.time()):
        raise ValueError("Cursor expired")

    return payload


def _security_feed_signature(payload):
    canonical = json.dumps(payload, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return hmac.new(
        _security_feed_signing_key().encode("utf-8"),
        canonical,
        hashlib.sha256,
    ).hexdigest()


def _file_sha256(path):
    digest = hashlib.sha256()
    with open(path, "rb") as file_handle:
        for chunk in iter(lambda: file_handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _sign_manifest_payload(payload_dict):
    canonical = json.dumps(payload_dict, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return hmac.new(
        _security_feed_signing_key().encode("utf-8"),
        canonical,
        hashlib.sha256,
    ).hexdigest()


def _safe_backup_path(backup_dir, provided_name):
    if not provided_name:
        return None
    safe_name = os.path.basename(str(provided_name).strip())
    if not safe_name:
        return None
    candidate = os.path.abspath(os.path.join(backup_dir, safe_name))
    backup_dir_abs = os.path.abspath(backup_dir)
    if not candidate.startswith(backup_dir_abs + os.sep):
        return None
    return candidate


def log_admin_action(user_id, action, entity_type=None, entity_id=None, new_values=None):
    try:
        audit = AuditLog(
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            new_values=new_values,
            ip_address=request.remote_addr,
            user_agent=request.headers.get("User-Agent"),
        )
        db.session.add(audit)
        db.session.commit()
    except Exception:
        db.session.rollback()


# ============================================
# PLATFORM STATS & ANALYTICS
# ============================================

@admin_bp.route("/stats", methods=["GET"])
@jwt_required()
@admin_required
def get_platform_stats():
    """Get comprehensive platform statistics for admin dashboard."""
    try:
        # User counts
        total_users = User.query.count()
        active_users = User.query.filter_by(is_active=True).count()
        workers_count = Worker.query.count()
        employers_count = Employer.query.count()
        verified_workers = Worker.query.filter_by(is_verified=True).count()
        
        # Today's date for filtering
        today = datetime.utcnow().date()
        today_start = datetime.combine(today, datetime.min.time())
        
        # New users today
        new_users_today = User.query.filter(
            func.date(User.created_at) == today
        ).count()
        
        # Last 7 days for growth rate
        week_ago = datetime.utcnow() - timedelta(days=7)
        new_users_week = User.query.filter(
            User.created_at >= week_ago
        ).count()
        user_growth_rate = round((new_users_week / total_users * 100), 1) if total_users > 0 else 0
        
        # Job statistics
        total_jobs = Job.query.count()
        active_jobs = Job.query.filter(
            or_(Job.status == JobStatus.OPEN, Job.status == JobStatus.IN_PROGRESS)
        ).count()
        completed_jobs = Job.query.filter_by(status=JobStatus.COMPLETED).count()
        jobs_today = Job.query.filter(
            func.date(Job.created_at) == today
        ).count()
        
        # Average job value
        avg_job_value = db.session.query(
            func.avg((Job.pay_min + Job.pay_max) / 2)
        ).filter(Job.pay_min.isnot(None), Job.pay_max.isnot(None)).scalar() or 0
        
        # Payment statistics
        total_revenue = db.session.query(
            func.sum(Payment.amount)
        ).filter_by(status=PaymentStatus.COMPLETED).scalar() or 0
        
        platform_fees_total = db.session.query(
            func.sum(Payment.platform_fee)
        ).filter_by(status=PaymentStatus.COMPLETED).scalar() or 0
        
        pending_payments = Payment.query.filter_by(status=PaymentStatus.PENDING).count()
        completed_payments = Payment.query.filter_by(status=PaymentStatus.COMPLETED).count()
        
        avg_transaction = (total_revenue / completed_payments) if completed_payments > 0 else 0
        
        # Review statistics
        total_reviews = Review.query.count()
        avg_rating = db.session.query(func.avg(Review.rating)).scalar() or 0
        
        # Verification statistics
        pending_verifications = Verification.query.filter_by(
            status="pending"
        ).count()
        
        return jsonify({
            "total_users": total_users,
            "active_users": active_users,
            "workers_count": workers_count,
            "employers_count": employers_count,
            "verified_users": verified_workers,
            "new_users_today": new_users_today,
            "user_growth_rate": user_growth_rate,
            "total_jobs": total_jobs,
            "active_jobs": active_jobs,
            "completed_jobs": completed_jobs,
            "jobs_today": jobs_today,
            "average_job_value": float(avg_job_value),
            "total_revenue": float(total_revenue),
            "platform_fees_total": float(platform_fees_total),
            "pending_payments": pending_payments,
            "completed_payments": completed_payments,
            "average_transaction": float(avg_transaction),
            "total_reviews": total_reviews,
            "average_rating": float(avg_rating),
            "pending_reviews": 0,  # Not implemented yet
            "pending_verifications": pending_verifications,
            "verified_workers": verified_workers,
            "verified_employers": 0,  # Not implemented yet
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@admin_bp.route("/system/health", methods=["GET"])
@jwt_required()
@admin_required
def get_system_health():
    """Get system health metrics."""
    try:
        started = time.perf_counter()
        db.session.execute(text("SELECT 1"))
        db_query_ms = round((time.perf_counter() - started) * 1000, 2)

        redis_status = "disconnected"
        redis_latency_ms = None
        try:
            if redis_cache and getattr(redis_cache, "_client", None):
                redis_started = time.perf_counter()
                redis_cache._client.ping()
                redis_latency_ms = round((time.perf_counter() - redis_started) * 1000, 2)
                redis_status = "connected"
        except Exception:
            redis_status = "degraded"

        limiter_storage = current_app.config.get("RATELIMIT_STORAGE_URI", "memory://")
        overall_status = "healthy" if redis_status in {"connected", "disconnected"} else "degraded"
        
        return jsonify({
            "status": overall_status,
            "uptime": 0,  # Would need to track this separately
            "response_time": 10,  # Placeholder
            "active_connections": 0,
            "api_requests": {
                "total": 0,
                "successful": 0,
                "failed": 0,
                "avg_response": 0
            },
            "database": {
                "status": "connected",
                "query_time": db_query_ms,
                "connections": 0
            },
            "redis": {
                "status": redis_status,
                "latency_ms": redis_latency_ms,
                "memory_usage": 0
            },
            "rate_limiter": {
                "storage_uri": limiter_storage
            },
            "storage": {
                "total": 0,
                "used": 0,
                "free": 0
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            "status": "degraded",
            "error": str(e)
        }), 200


# ============================================
# USER MANAGEMENT
# ============================================

@admin_bp.route("/users", methods=["GET"])
@jwt_required()
@admin_required
def get_users():
    """Get all users with filters and pagination."""
    try:
        role = request.args.get("role")
        status = request.args.get("status")
        search = request.args.get("search")
        page = int(request.args.get("page", 1))
        limit = int(request.args.get("limit", 20))
        sort = request.args.get("sort", "-created_at")
        
        query = User.query
        
        # Apply filters
        if role:
            try:
                query = query.filter_by(role=UserRole(role))
            except ValueError:
                return jsonify({"error": "Invalid role"}), 400

        if status:
            normalized_status = status.strip().lower()
            if normalized_status in {"active"}:
                query = query.filter(User.is_active.is_(True))
            elif normalized_status in {"inactive", "banned", "suspended"}:
                query = query.filter(User.is_active.is_(False))
            else:
                return jsonify({"error": "Invalid status"}), 400
        
        if search:
            query = query.filter(
                or_(
                    User.username.ilike(f"%{search}%"),
                    User.email.ilike(f"%{search}%")
                )
            )
        
        # Apply sorting
        sort_field = sort[1:] if sort.startswith("-") else sort
        allowed_sort_fields = {"created_at", "updated_at", "username", "email", "role"}
        if sort_field not in allowed_sort_fields:
            sort_field = "created_at"

        if sort.startswith("-"):
            query = query.order_by(getattr(User, sort_field).desc())
        else:
            query = query.order_by(getattr(User, sort_field).asc())
        
        # Paginate
        total = query.count()
        users = query.offset((page - 1) * limit).limit(limit).all()
        
        users_data = []
        for user in users:
            user_dict = user.to_dict()
            
            # Add related profile data
            if user.role == UserRole.WORKER:
                worker = Worker.query.filter_by(user_id=user.id).first()
                if worker:
                    user_dict["worker_profile"] = worker.to_dict()
            elif user.role == UserRole.EMPLOYER:
                employer = Employer.query.filter_by(user_id=user.id).first()
                if employer:
                    user_dict["employer_profile"] = employer.to_dict()
            
            users_data.append(user_dict)
        
        return jsonify({
            "users": users_data,
            "total": total,
            "pages": (total + limit - 1) // limit,
            "current_page": page
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@admin_bp.route("/users/<int:user_id>", methods=["GET"])
@jwt_required()
@admin_required
def get_user_details(user_id):
    """Get detailed information about a specific user."""
    try:
        user = User.query.get_or_404(user_id)
        user_dict = user.to_dict()
        
        # Add profile data
        if user.role == UserRole.WORKER:
            worker = Worker.query.filter_by(user_id=user.id).first()
            if worker:
                user_dict["worker_profile"] = worker.to_dict()
                
                # Add statistics
                user_dict["stats"] = {
                    "total_applications": Application.query.filter_by(worker_id=worker.id).count(),
                    "completed_jobs": Application.query.filter_by(
                        worker_id=worker.id, status="accepted"
                    ).count(),
                    "total_reviews": Review.query.filter_by(worker_id=worker.id).count(),
                    "avg_rating": db.session.query(func.avg(Review.rating)).filter_by(
                        worker_id=worker.id
                    ).scalar() or 0
                }
                
        elif user.role == UserRole.EMPLOYER:
            employer = Employer.query.filter_by(user_id=user.id).first()
            if employer:
                user_dict["employer_profile"] = employer.to_dict()
                
                # Add statistics
                user_dict["stats"] = {
                    "total_jobs": Job.query.filter_by(employer_id=employer.id).count(),
                    "active_jobs": Job.query.filter_by(
                        employer_id=employer.id, status=JobStatus.OPEN
                    ).count(),
                    "completed_jobs": Job.query.filter_by(
                        employer_id=employer.id, status=JobStatus.COMPLETED
                    ).count()
                }
        
        return jsonify(user_dict), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@admin_bp.route("/users/<int:user_id>/ban", methods=["POST"])
@jwt_required()
@admin_required
def ban_user(user_id):
    """Ban a user."""
    idempotency_key = None
    try:
        data = request.get_json(silent=True) or {}
        reason = data.get("reason", "No reason provided")
        duration = data.get("duration")  # In days, None for permanent
        security_event_id = _new_security_event_id("user_ban")

        idempotency_error, idempotency_key = _require_idempotency(
            "ban_user",
            {"user_id": user_id, "reason": reason, "duration": duration},
        )
        if idempotency_error:
            return idempotency_error

        user = User.query.get_or_404(user_id)
        
        # In a real implementation, you'd have a ban table
        # For now, we'll just mark the user as inactive
        user.is_active = False
        db.session.commit()

        admin_id = int(get_jwt_identity())
        log_admin_action(
            user_id=admin_id,
            action="user_suspended",
            entity_type="user",
            entity_id=user.id,
            new_values={
                "is_active": False,
                "reason": reason,
                "duration": duration,
                "security_event_id": security_event_id,
                "event_type": "admin.user.ban",
            },
        )

        response_body = {
            "message": "User banned successfully",
            "security_event_id": security_event_id,
            "event_type": "admin.user.ban",
        }
        _finalize_idempotency(idempotency_key, response_body, 200)
        return jsonify(response_body), 200
        
    except Exception as e:
        _clear_idempotency(idempotency_key)
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@admin_bp.route("/users/<int:user_id>/unban", methods=["POST"])
@jwt_required()
@admin_required
def unban_user(user_id):
    """Unban a user."""
    idempotency_key = None
    try:
        security_event_id = _new_security_event_id("user_unban")
        idempotency_error, idempotency_key = _require_idempotency(
            "unban_user",
            {"user_id": user_id},
        )
        if idempotency_error:
            return idempotency_error

        user = User.query.get_or_404(user_id)
        user.is_active = True
        db.session.commit()

        admin_id = int(get_jwt_identity())
        log_admin_action(
            user_id=admin_id,
            action="user_reactivated",
            entity_type="user",
            entity_id=user.id,
            new_values={
                "is_active": True,
                "security_event_id": security_event_id,
                "event_type": "admin.user.unban",
            },
        )

        response_body = {
            "message": "User unbanned successfully",
            "security_event_id": security_event_id,
            "event_type": "admin.user.unban",
        }
        _finalize_idempotency(idempotency_key, response_body, 200)
        return jsonify(response_body), 200
        
    except Exception as e:
        _clear_idempotency(idempotency_key)
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@admin_bp.route("/users/<int:user_id>", methods=["DELETE"])
@jwt_required()
@admin_required
def delete_user(user_id):
    """Delete a user (soft delete recommended)."""
    idempotency_key = None
    try:
        security_event_id = _new_security_event_id("delete_user")
        confirmation_error = _require_admin_confirmation("delete_user")
        if confirmation_error:
            return confirmation_error

        idempotency_error, idempotency_key = _require_idempotency(
            "delete_user",
            {"user_id": user_id},
        )
        if idempotency_error:
            return idempotency_error

        current_admin_id = int(get_jwt_identity())
        approval_error = _require_two_person_approval(
            "delete_user",
            {"user_id": user_id},
            current_admin_id,
        )
        if approval_error:
            return approval_error

        if not current_app.config.get("ALLOW_DESTRUCTIVE_OPERATIONS", False):
            return jsonify({
                "error": "Destructive operations are disabled in this environment"
            }), 403

        user = User.query.get_or_404(user_id)
        
        # Don't allow deleting other admins
        if user.role == UserRole.ADMIN:
            return jsonify({"error": "Cannot delete admin users"}), 403
        
        # Soft delete - mark as inactive
        user.is_active = False
        db.session.commit()

        admin_id = int(get_jwt_identity())
        log_admin_action(
            user_id=admin_id,
            action="user_soft_deleted",
            entity_type="user",
            entity_id=user.id,
            new_values={"is_active": False, "security_event_id": security_event_id},
        )

        response_body = {
            "message": "User deleted successfully",
            "security_event_id": security_event_id,
        }
        _finalize_idempotency(idempotency_key, response_body, 200)
        return jsonify(response_body), 200
        
    except Exception as e:
        _clear_idempotency(idempotency_key)
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# ============================================
# JOB MODERATION
# ============================================

@admin_bp.route("/jobs", methods=["GET"])
@jwt_required()
@admin_required
def get_all_jobs():
    """Get all jobs with filters (admin view)."""
    try:
        status = request.args.get("status")
        search = request.args.get("search")
        page = int(request.args.get("page", 1))
        limit = int(request.args.get("limit", 20))
        
        query = Job.query
        
        if status:
            try:
                query = query.filter_by(status=JobStatus(status))
            except ValueError:
                return jsonify({"error": "Invalid status"}), 400
        
        if search:
            query = query.filter(
                or_(
                    Job.title.ilike(f"%{search}%"),
                    Job.description.ilike(f"%{search}%")
                )
            )
        
        query = query.order_by(Job.created_at.desc())
        
        total = query.count()
        jobs = query.offset((page - 1) * limit).limit(limit).all()
        
        jobs_data = []
        for job in jobs:
            job_dict = job.to_dict()
            employer = Employer.query.get(job.employer_id)
            if employer:
                employer_user = User.query.get(employer.user_id)
                job_dict["employer"] = {
                    "id": employer.id,
                    "company_name": employer.company_name,
                    "username": employer_user.username if employer_user else None
                }
            jobs_data.append(job_dict)
        
        return jsonify({
            "jobs": jobs_data,
            "total": total,
            "pages": (total + limit - 1) // limit
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@admin_bp.route("/jobs/<int:job_id>/moderate", methods=["POST"])
@jwt_required()
@admin_required
def moderate_job(job_id):
    """Moderate a job (approve, reject, flag)."""
    idempotency_key = None
    try:
        data = request.get_json(silent=True) or {}
        action = data.get("action")  # approve, reject, flag
        reason = data.get("reason")
        security_event_id = _new_security_event_id("job_moderate")

        idempotency_error, idempotency_key = _require_idempotency(
            "moderate_job",
            {"job_id": job_id, "action": action, "reason": reason},
        )
        if idempotency_error:
            return idempotency_error

        job = Job.query.get_or_404(job_id)
        
        if action == "reject":
            job.status = JobStatus.CANCELLED
        elif action == "approve":
            job.status = JobStatus.OPEN
        # Add more moderation actions as needed
        
        db.session.commit()

        admin_id = int(get_jwt_identity())
        log_admin_action(
            user_id=admin_id,
            action="job_moderated",
            entity_type="job",
            entity_id=job.id,
            new_values={
                "action": action,
                "reason": reason,
                "security_event_id": security_event_id,
                "event_type": "admin.job.moderate",
            },
        )
        
        response_body = {
            "message": f"Job {action}ed successfully",
            "security_event_id": security_event_id,
            "event_type": "admin.job.moderate",
        }
        _finalize_idempotency(idempotency_key, response_body, 200)
        return jsonify(response_body), 200
        
    except Exception as e:
        _clear_idempotency(idempotency_key)
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@admin_bp.route("/jobs/<int:job_id>/feature", methods=["POST"])
@jwt_required()
@admin_required
def feature_job(job_id):
    """Mark job as featured."""
    idempotency_key = None
    try:
        security_event_id = _new_security_event_id("job_feature")
        idempotency_error, idempotency_key = _require_idempotency(
            "feature_job",
            {"job_id": job_id},
        )
        if idempotency_error:
            return idempotency_error

        job = Job.query.get_or_404(job_id)
        # Note: Would need to add is_featured column to Job model
        # For now, just return success
        # job.is_featured = True
        # db.session.commit()
        
        admin_id = int(get_jwt_identity())
        log_admin_action(
            user_id=admin_id,
            action="job_featured",
            entity_type="job",
            entity_id=job.id,
            new_values={
                "security_event_id": security_event_id,
                "event_type": "admin.job.feature",
            },
        )

        response_body = {
            "message": "Job featured successfully",
            "security_event_id": security_event_id,
            "event_type": "admin.job.feature",
        }
        _finalize_idempotency(idempotency_key, response_body, 200)
        return jsonify(response_body), 200
        
    except Exception as e:
        _clear_idempotency(idempotency_key)
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@admin_bp.route("/jobs/<int:job_id>/unfeature", methods=["POST"])
@jwt_required()
@admin_required
def unfeature_job(job_id):
    """Remove featured status from job."""
    idempotency_key = None
    try:
        security_event_id = _new_security_event_id("job_unfeature")
        idempotency_error, idempotency_key = _require_idempotency(
            "unfeature_job",
            {"job_id": job_id},
        )
        if idempotency_error:
            return idempotency_error

        job = Job.query.get_or_404(job_id)
        # Note: Would need to add is_featured column to Job model
        # For now, just return success
        # job.is_featured = False
        # db.session.commit()
        
        admin_id = int(get_jwt_identity())
        log_admin_action(
            user_id=admin_id,
            action="job_unfeatured",
            entity_type="job",
            entity_id=job.id,
            new_values={
                "security_event_id": security_event_id,
                "event_type": "admin.job.unfeature",
            },
        )

        response_body = {
            "message": "Job unfeatured successfully",
            "security_event_id": security_event_id,
            "event_type": "admin.job.unfeature",
        }
        _finalize_idempotency(idempotency_key, response_body, 200)
        return jsonify(response_body), 200
        
    except Exception as e:
        _clear_idempotency(idempotency_key)
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# ============================================
# VERIFICATION MANAGEMENT
# ============================================

@admin_bp.route("/verifications", methods=["GET"])
@jwt_required()
@admin_required
def get_verification_queue():
    """Get verification queue with filters."""
    try:
        status = request.args.get("status", "pending")
        verification_type = request.args.get("type")
        page = int(request.args.get("page", 1))
        limit = int(request.args.get("limit", 20))
        
        query = Verification.query
        
        if status:
            try:
                query = query.filter_by(status=VerificationStatus(status))
            except ValueError:
                return jsonify({"error": "Invalid status"}), 400
        
        if verification_type:
            query = query.filter_by(verification_type=verification_type)
        
        query = query.order_by(Verification.created_at.asc())
        
        total = query.count()
        verifications = query.offset((page - 1) * limit).limit(limit).all()
        
        verification_data = []
        for ver in verifications:
            ver_dict = ver.to_dict()
            worker = Worker.query.get(ver.worker_id)
            if worker:
                user = User.query.get(worker.user_id)
                ver_dict["worker"] = {
                    "id": worker.id,
                    "user_id": worker.user_id,
                    "username": user.username if user else None,
                    "email": user.email if user else None
                }
            verification_data.append(ver_dict)
        
        return jsonify({
            "requests": verification_data,
            "total": total,
            "pages": (total + limit - 1) // limit
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@admin_bp.route("/verifications/<int:verification_id>", methods=["PUT"])
@jwt_required()
@admin_required
def review_verification(verification_id):
    """Approve or reject a verification request."""
    idempotency_key = None
    try:
        current_user_id = get_current_user_id()
        data = request.get_json(silent=True) or {}
        status = data.get("status")  # "approved" or "rejected"
        notes = data.get("notes")
        security_event_id = _new_security_event_id("verification_review")

        idempotency_error, idempotency_key = _require_idempotency(
            "review_verification",
            {"verification_id": verification_id, "status": status, "notes": notes},
        )
        if idempotency_error:
            return idempotency_error

        verification = Verification.query.get_or_404(verification_id)
        
        if status not in ["approved", "rejected"]:
            return jsonify({"error": "Invalid status"}), 400
        
        verification.status = VerificationStatus(status.upper())
        verification.reviewed_by = current_user_id
        verification.review_notes = notes
        
        if status == "approved":
            worker = Worker.query.get(verification.worker_id)
            if worker:
                worker.verification_score = min(100, worker.verification_score + 25)
                if worker.verification_score >= 75:
                    worker.is_verified = True
        
        db.session.commit()

        admin_id = int(get_jwt_identity())
        log_admin_action(
            user_id=admin_id,
            action="verification_reviewed",
            entity_type="verification",
            entity_id=verification.id,
            new_values={
                "status": status,
                "security_event_id": security_event_id,
                "event_type": "admin.verification.review",
            },
        )
        
        response_body = {
            "message": "Verification reviewed successfully",
            "security_event_id": security_event_id,
            "event_type": "admin.verification.review",
        }
        _finalize_idempotency(idempotency_key, response_body, 200)
        return jsonify(response_body), 200
        
    except Exception as e:
        _clear_idempotency(idempotency_key)
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# ============================================
# PLATFORM SETTINGS
# ============================================

@admin_bp.route("/settings", methods=["GET"])
@jwt_required()
@admin_required
def get_platform_settings():
    """Get platform settings."""
    # In a real app, these would be stored in a settings table
    return jsonify({
        "platform_name": "WorkForge",
        "platform_fee_percentage": 10,
        "max_applications_per_job": 50,
        "verification_required_for_jobs": False,
        "auto_approve_jobs": False,
        "maintenance_mode": False
    }), 200


@admin_bp.route("/settings", methods=["PUT"])
@jwt_required()
@admin_required
def update_platform_settings():
    """Update platform settings."""
    idempotency_key = None
    try:
        data = request.get_json(silent=True) or {}
        security_event_id = _new_security_event_id("platform_settings_update")

        idempotency_error, idempotency_key = _require_idempotency(
            "update_platform_settings",
            {"data": data},
        )
        if idempotency_error:
            return idempotency_error

        # In a real app, save to settings table

        admin_id = int(get_jwt_identity())
        log_admin_action(
            user_id=admin_id,
            action="platform_settings_updated",
            entity_type="settings",
            entity_id=None,
            new_values={
                "changed_keys": sorted(list(data.keys())),
                "security_event_id": security_event_id,
                "event_type": "admin.settings.update",
            },
        )

        response_body = {
            "message": "Settings updated successfully",
            "security_event_id": security_event_id,
            "event_type": "admin.settings.update",
        }
        _finalize_idempotency(idempotency_key, response_body, 200)
        return jsonify(response_body), 200
        
    except Exception as e:
        _clear_idempotency(idempotency_key)
        return jsonify({"error": str(e)}), 500


# ============================================
# TWO-PERSON APPROVAL WORKFLOW
# ============================================

@admin_bp.route("/approvals/request", methods=["POST"])
@jwt_required()
@admin_required
@limiter.limit(lambda: current_app.config.get("ADMIN_APPROVAL_RATE_LIMIT", "30 per minute"), key_func=_approval_rate_limit_key)
def request_approval():
    idempotency_key = None
    try:
        security_event_id = _new_security_event_id("approval_request")
        if not current_app.config.get("TWO_PERSON_APPROVAL_ENABLED", True):
            return jsonify({"error": "Two-person approval is disabled"}), 403

        data = request.get_json(silent=True) or {}
        action = data.get("action")
        payload = data.get("payload") or {}
        reason = data.get("reason", "")

        idempotency_error, idempotency_key = _require_idempotency(
            "approval_request",
            {"action": action, "payload": payload, "reason": reason},
        )
        if idempotency_error:
            return idempotency_error

        allowed_actions = {"delete_user", "bulk_delete_users"}
        if action not in allowed_actions:
            return jsonify({"error": "Unsupported approval action"}), 400

        requester_id = int(get_jwt_identity())
        requester_user = _get_admin_user(requester_id)
        if not requester_user:
            return jsonify({"error": "Admin user not found"}), 404

        policy_error = _check_approval_policy(action, requester_user, "request")
        if policy_error:
            return policy_error

        permission_error = _check_approval_permission(action, requester_user, "request")
        if permission_error:
            return permission_error

        approval_id = str(uuid4())
        ttl = current_app.config.get("ADMIN_APPROVAL_TTL_SECONDS", 1800)
        now = datetime.utcnow()
        record = {
            "id": approval_id,
            "action": action,
            "payload_hash": _canonical_payload_hash(payload),
            "payload_preview": payload,
            "reason": reason,
            "status": "pending",
            "requested_by": requester_id,
            "requested_by_role": _get_admin_role(requester_user).value,
            "requested_at": now.isoformat(),
            "expires_at": (now + timedelta(seconds=ttl)).isoformat(),
            "approved_by": None,
            "approved_at": None,
        }
        _store_approval(record, ttl)

        log_admin_action(
            user_id=requester_id,
            action="approval_requested",
            entity_type="approval",
            entity_id=None,
            new_values={
                "approval_id": approval_id,
                "action": action,
                "security_event_id": security_event_id,
            },
        )

        response_body = {
            "approval_id": approval_id,
            "status": "pending",
            "expires_in_seconds": ttl,
            "action": action,
            "security_event_id": security_event_id,
        }
        _finalize_idempotency(idempotency_key, response_body, 201)
        return jsonify(response_body), 201
    except Exception as e:
        _clear_idempotency(idempotency_key)
        return jsonify({"error": str(e)}), 500


@admin_bp.route("/approvals/<string:approval_id>", methods=["GET"])
@jwt_required()
@admin_required
@limiter.limit(lambda: current_app.config.get("ADMIN_APPROVAL_REVIEW_RATE_LIMIT", "20 per minute"), key_func=_approval_rate_limit_key)
def get_approval(approval_id):
    approval = _load_approval(approval_id)
    if not approval:
        return jsonify({"error": "Approval not found or expired"}), 404
    return jsonify(approval), 200


@admin_bp.route("/approvals/pending", methods=["GET"])
@jwt_required()
@admin_required
@limiter.limit(lambda: current_app.config.get("ADMIN_APPROVAL_REVIEW_RATE_LIMIT", "20 per minute"), key_func=_approval_rate_limit_key)
def list_pending_approvals():
    try:
        limit = int(request.args.get("limit", 100))
        pending = _list_approvals(status="pending", limit=limit)
        return jsonify({"approvals": pending, "count": len(pending)}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@admin_bp.route("/approvals/mine", methods=["GET"])
@jwt_required()
@admin_required
@limiter.limit(lambda: current_app.config.get("ADMIN_APPROVAL_REVIEW_RATE_LIMIT", "20 per minute"), key_func=_approval_rate_limit_key)
def list_my_approvals():
    try:
        limit = int(request.args.get("limit", 100))
        current_admin_id = int(get_jwt_identity())
        mine = _list_approvals(requested_by=current_admin_id, limit=limit)
        return jsonify({"approvals": mine, "count": len(mine)}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@admin_bp.route("/approvals/<string:approval_id>/approve", methods=["POST"])
@jwt_required()
@admin_required
@limiter.limit(lambda: current_app.config.get("ADMIN_APPROVAL_REVIEW_RATE_LIMIT", "20 per minute"), key_func=_approval_rate_limit_key)
def approve_approval(approval_id):
    idempotency_key = None
    try:
        security_event_id = _new_security_event_id("approval_approve")
        idempotency_error, idempotency_key = _require_idempotency(
            "approval_approve",
            {"approval_id": approval_id},
        )
        if idempotency_error:
            return idempotency_error

        approval = _load_approval(approval_id)
        if not approval:
            return jsonify({"error": "Approval not found or expired"}), 404

        if approval.get("status") != "pending":
            return jsonify({"error": "Approval is not pending"}), 400

        approver_id = int(get_jwt_identity())
        if int(approval.get("requested_by")) == approver_id:
            return jsonify({"error": "Requester cannot approve their own request"}), 403

        approver_user = _get_admin_user(approver_id)
        if not approver_user:
            return jsonify({"error": "Admin user not found"}), 404

        action_name = approval.get("action")
        policy_error = _check_approval_policy(action_name, approver_user, "approve")
        if policy_error:
            return policy_error

        permission_error = _check_approval_permission(action_name, approver_user, "approve")
        if permission_error:
            return permission_error

        approval["status"] = "approved"
        approval["approved_by"] = approver_id
        approval["approved_by_role"] = _get_admin_role(approver_user).value
        approval["approved_at"] = datetime.utcnow().isoformat()
        _store_approval(approval, current_app.config.get("ADMIN_APPROVAL_TTL_SECONDS", 1800))

        log_admin_action(
            user_id=approver_id,
            action="approval_approved",
            entity_type="approval",
            entity_id=None,
            new_values={
                "approval_id": approval_id,
                "action": approval.get("action"),
                "security_event_id": security_event_id,
            },
        )

        response_body = {
            "approval_id": approval_id,
            "status": "approved",
            "security_event_id": security_event_id,
        }
        _finalize_idempotency(idempotency_key, response_body, 200)
        return jsonify(response_body), 200
    except Exception as e:
        _clear_idempotency(idempotency_key)
        return jsonify({"error": str(e)}), 500


@admin_bp.route("/approvals/<string:approval_id>/reject", methods=["POST"])
@jwt_required()
@admin_required
@limiter.limit(lambda: current_app.config.get("ADMIN_APPROVAL_REVIEW_RATE_LIMIT", "20 per minute"), key_func=_approval_rate_limit_key)
def reject_approval(approval_id):
    idempotency_key = None
    try:
        security_event_id = _new_security_event_id("approval_reject")
        idempotency_error, idempotency_key = _require_idempotency(
            "approval_reject",
            {"approval_id": approval_id},
        )
        if idempotency_error:
            return idempotency_error

        approval = _load_approval(approval_id)
        if not approval:
            return jsonify({"error": "Approval not found or expired"}), 404

        if approval.get("status") != "pending":
            return jsonify({"error": "Approval is not pending"}), 400

        approver_id = int(get_jwt_identity())
        if int(approval.get("requested_by")) == approver_id:
            return jsonify({"error": "Requester cannot reject their own request"}), 403

        approver_user = _get_admin_user(approver_id)
        if not approver_user:
            return jsonify({"error": "Admin user not found"}), 404

        action_name = approval.get("action")
        policy_error = _check_approval_policy(action_name, approver_user, "approve")
        if policy_error:
            return policy_error

        permission_error = _check_approval_permission(action_name, approver_user, "approve")
        if permission_error:
            return permission_error

        approval["status"] = "rejected"
        approval["approved_by"] = approver_id
        approval["approved_by_role"] = _get_admin_role(approver_user).value
        approval["approved_at"] = datetime.utcnow().isoformat()
        _store_approval(approval, current_app.config.get("ADMIN_APPROVAL_TTL_SECONDS", 1800))

        log_admin_action(
            user_id=approver_id,
            action="approval_rejected",
            entity_type="approval",
            entity_id=None,
            new_values={
                "approval_id": approval_id,
                "action": approval.get("action"),
                "security_event_id": security_event_id,
            },
        )

        response_body = {
            "approval_id": approval_id,
            "status": "rejected",
            "security_event_id": security_event_id,
        }
        _finalize_idempotency(idempotency_key, response_body, 200)
        return jsonify(response_body), 200
    except Exception as e:
        _clear_idempotency(idempotency_key)
        return jsonify({"error": str(e)}), 500


@admin_bp.route("/approvals/<string:approval_id>/cancel", methods=["POST"])
@jwt_required()
@admin_required
@limiter.limit(lambda: current_app.config.get("ADMIN_APPROVAL_REVIEW_RATE_LIMIT", "20 per minute"), key_func=_approval_rate_limit_key)
def cancel_approval(approval_id):
    idempotency_key = None
    try:
        security_event_id = _new_security_event_id("approval_cancel")
        idempotency_error, idempotency_key = _require_idempotency(
            "approval_cancel",
            {"approval_id": approval_id},
        )
        if idempotency_error:
            return idempotency_error

        approval = _load_approval(approval_id)
        if not approval:
            return jsonify({"error": "Approval not found or expired"}), 404

        if approval.get("status") != "pending":
            return jsonify({"error": "Only pending approvals can be cancelled"}), 400

        actor_id = int(get_jwt_identity())
        actor_user = _get_admin_user(actor_id)
        if not actor_user:
            return jsonify({"error": "Admin user not found"}), 404

        requester_id = int(approval.get("requested_by"))
        if actor_id != requester_id and not _is_super_admin(actor_user):
            return jsonify({"error": "Only requester or super admin can cancel this approval"}), 403

        approval["status"] = "cancelled"
        approval["cancelled_by"] = actor_id
        approval["cancelled_by_role"] = _get_admin_role(actor_user).value
        approval["cancelled_at"] = datetime.utcnow().isoformat()
        _store_approval(approval, current_app.config.get("ADMIN_APPROVAL_TTL_SECONDS", 1800))

        log_admin_action(
            user_id=actor_id,
            action="approval_cancelled",
            entity_type="approval",
            entity_id=None,
            new_values={
                "approval_id": approval_id,
                "action": approval.get("action"),
                "security_event_id": security_event_id,
            },
        )

        response_body = {
            "approval_id": approval_id,
            "status": "cancelled",
            "security_event_id": security_event_id,
        }
        _finalize_idempotency(idempotency_key, response_body, 200)
        return jsonify(response_body), 200
    except Exception as e:
        _clear_idempotency(idempotency_key)
        return jsonify({"error": str(e)}), 500


# ============================================
# AUDIT LOG
# ============================================

@admin_bp.route("/audit-log", methods=["GET"])
@jwt_required()
@admin_required
def get_audit_log():
    """Get audit log entries."""
    try:
        current_user = User.query.get(int(get_jwt_identity()))
        page = int(request.args.get("page", 1))
        limit = int(request.args.get("limit", 20))
        limit = min(max(limit, 1), current_app.config.get("AUDIT_LOG_MAX_PAGE_SIZE", 200))
        admin_id = request.args.get("admin_id", type=int)
        entity_type = request.args.get("entity_type")
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")
        sort_by = request.args.get("sort_by", "created_at")
        sort_order = request.args.get("sort_order", "desc").lower()
        response_format = request.args.get("format", "json").lower()
        include_sensitive = request.args.get("include_sensitive", "false").lower() == "true"
        download = request.args.get("download", "false").lower() == "true"

        if include_sensitive and not _is_super_admin(current_user):
            return jsonify({"error": "Sensitive audit fields require super admin role"}), 403

        if (response_format == "csv" or download) and not _has_admin_permission(current_user, "audit:export"):
            return jsonify({"error": "Audit export permission required"}), 403

        if response_format not in {"json", "csv"}:
            return jsonify({"error": "Invalid format. Use json or csv."}), 400

        query = AuditLog.query

        if admin_id:
            query = query.filter(AuditLog.user_id == admin_id)

        if entity_type:
            query = query.filter(AuditLog.entity_type == entity_type)

        if start_date:
            try:
                start_dt = datetime.fromisoformat(start_date)
                query = query.filter(AuditLog.timestamp >= start_dt)
            except ValueError:
                return jsonify({"error": "Invalid start_date format. Use ISO format."}), 400

        if end_date:
            try:
                end_dt = datetime.fromisoformat(end_date)
                query = query.filter(AuditLog.timestamp <= end_dt)
            except ValueError:
                return jsonify({"error": "Invalid end_date format. Use ISO format."}), 400

        sortable_fields = {
            "created_at": AuditLog.timestamp,
            "action": AuditLog.action,
            "entity_type": AuditLog.entity_type,
            "admin_id": AuditLog.user_id,
        }
        sort_column = sortable_fields.get(sort_by, AuditLog.timestamp)
        if sort_order == "asc":
            query = query.order_by(sort_column.asc())
        else:
            query = query.order_by(sort_column.desc())

        total = query.count()
        export_max = current_app.config.get("AUDIT_LOG_MAX_EXPORT_ROWS", 5000)
        if response_format == "csv" or (response_format == "json" and download):
            entries = query.limit(min(total, export_max)).all()
        else:
            entries = query.offset((page - 1) * limit).limit(limit).all()

        audit_entries = []
        for entry in entries:
            admin_user = User.query.get(entry.user_id) if entry.user_id else None
            audit_entries.append({
                "id": int(entry.id) if entry.id is not None else None,
                "admin_id": entry.user_id,
                "admin_name": (
                    admin_user.username if admin_user else "System"
                ),
                "action": entry.action,
                "entity_type": entry.entity_type or "user",
                "entity_id": entry.entity_id,
                "changes": entry.new_values or {},
                "ip_address": entry.ip_address if include_sensitive else None,
                "user_agent": entry.user_agent if include_sensitive else None,
                "created_at": (
                    entry.timestamp.isoformat() if entry.timestamp else None
                ),
            })

        if response_format == "csv":
            security_event_id = _new_security_event_id("audit_export_csv")
            output = io.StringIO()
            writer = csv.writer(output)
            writer.writerow([
                "id",
                "admin_id",
                "admin_name",
                "action",
                "entity_type",
                "entity_id",
                "changes",
                "ip_address",
                "user_agent",
                "created_at",
            ])
            for row in audit_entries:
                writer.writerow([
                    row.get("id"),
                    row.get("admin_id"),
                    row.get("admin_name"),
                    row.get("action"),
                    row.get("entity_type"),
                    row.get("entity_id"),
                    row.get("changes"),
                    row.get("ip_address"),
                    row.get("user_agent"),
                    row.get("created_at"),
                ])

            csv_data = output.getvalue()
            output.close()
            filename = f"audit-log-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}.csv"
            digest, signature = _sign_audit_export(csv_data.encode("utf-8"))
            return Response(
                csv_data,
                mimetype="text/csv",
                headers={
                    "Content-Disposition": f"attachment; filename={filename}",
                    "X-Audit-Content-SHA256": digest,
                    "X-Audit-Signature": signature,
                    "X-Security-Event-ID": security_event_id,
                },
            )

        if response_format == "json" and download:
            security_event_id = _new_security_event_id("audit_export_json")
            json_data = json.dumps(audit_entries, separators=(",", ":"))
            digest, signature = _sign_audit_export(json_data.encode("utf-8"))
            filename = f"audit-log-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}.json"
            return Response(
                json_data,
                mimetype="application/json",
                headers={
                    "Content-Disposition": f"attachment; filename={filename}",
                    "X-Audit-Content-SHA256": digest,
                    "X-Audit-Signature": signature,
                    "X-Security-Event-ID": security_event_id,
                },
            )

        return jsonify({
            "entries": audit_entries,
            "total": total,
            "pages": (total + limit - 1) // limit if limit > 0 else 0,
            "current_page": page,
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ============================================
# SECURITY EVENTS (SIEM / SOC)
# ============================================

@admin_bp.route("/security/events", methods=["GET"])
@limiter.limit(
    lambda: current_app.config.get("SECURITY_EVENTS_RATE_LIMIT", "60 per minute"),
    key_func=_security_events_rate_limit_key,
)
@jwt_required()
@admin_required
def get_security_events():
    """Get security-focused event stream derived from audit logs."""
    try:
        current_user = User.query.get(int(get_jwt_identity()))
        limit = int(request.args.get("limit", 50))
        limit = min(max(limit, 1), 200)
        event_type = request.args.get("event_type")
        action = request.args.get("action")
        since_hours = int(request.args.get("since_hours", 24))
        max_since_hours = int(current_app.config.get("SECURITY_EVENTS_MAX_SINCE_HOURS", 24 * 30))
        max_since_hours = max(1, min(max_since_hours, 24 * 365))
        since_hours = max(1, min(since_hours, max_since_hours))
        cursor_token = request.args.get("cursor")
        include_sensitive = request.args.get("include_sensitive", "false").lower() == "true"

        if include_sensitive and not _is_super_admin(current_user):
            return jsonify({"error": "Sensitive fields require super admin role"}), 403

        if cursor_token:
            try:
                cursor_payload = _decode_security_feed_cursor(cursor_token)
            except ValueError as exc:
                return jsonify({"error": str(exc)}), 400

            if (cursor_payload.get("event_type") or None) != event_type:
                return jsonify({"error": "Cursor does not match event_type filter"}), 400
            if (cursor_payload.get("action") or None) != action:
                return jsonify({"error": "Cursor does not match action filter"}), 400
            if int(cursor_payload.get("since_hours", since_hours)) != since_hours:
                return jsonify({"error": "Cursor does not match since_hours filter"}), 400

            try:
                cursor_ts = datetime.fromisoformat(cursor_payload.get("last_ts"))
                cursor_id = int(cursor_payload.get("last_id"))
            except Exception:
                return jsonify({"error": "Cursor is missing required position fields"}), 400
        else:
            cursor_payload = None
            cursor_ts = None
            cursor_id = None

        window_start = datetime.utcnow() - timedelta(hours=since_hours)
        query = AuditLog.query.filter(AuditLog.timestamp >= window_start)

        if action:
            query = query.filter(AuditLog.action == action)

        if cursor_payload:
            query = query.filter(
                or_(
                    AuditLog.timestamp > cursor_ts,
                    and_(AuditLog.timestamp == cursor_ts, AuditLog.id > cursor_id),
                )
            )

        query = query.order_by(AuditLog.timestamp.asc(), AuditLog.id.asc())

        candidate_cap = min(max(limit * 50, 1000), 10000)
        candidates = query.limit(candidate_cap).all()

        events = []
        for entry in candidates:
            payload = entry.new_values or {}
            security_event_id = payload.get("security_event_id")
            security_event_type = payload.get("event_type")
            if not security_event_id and not security_event_type:
                continue
            if event_type and security_event_type != event_type:
                continue

            admin_user = User.query.get(entry.user_id) if entry.user_id else None
            events.append({
                "id": int(entry.id) if entry.id is not None else None,
                "security_event_id": security_event_id,
                "event_type": security_event_type,
                "action": entry.action,
                "entity_type": entry.entity_type,
                "entity_id": entry.entity_id,
                "admin_id": entry.user_id,
                "admin_name": admin_user.username if admin_user else "System",
                "ip_address": entry.ip_address if include_sensitive else None,
                "user_agent": entry.user_agent if include_sensitive else None,
                "changes": payload,
                "created_at": entry.timestamp.isoformat() if entry.timestamp else None,
            })

            if len(events) > limit:
                break

        has_more = len(events) > limit
        paged_events = events[:limit]
        next_cursor = None
        if has_more and paged_events:
            cursor_ttl = int(current_app.config.get("SECURITY_EVENTS_CURSOR_TTL_SECONDS", 60 * 60 * 24))
            cursor_ttl = max(300, min(cursor_ttl, 60 * 60 * 24 * 7))
            tail = paged_events[-1]
            next_cursor = _encode_security_feed_cursor({
                "v": 1,
                "last_ts": tail.get("created_at"),
                "last_id": tail.get("id"),
                "event_type": event_type,
                "action": action,
                "since_hours": since_hours,
                "exp": int(time.time()) + cursor_ttl,
            })

        response_body = {
            "events": paged_events,
            "count": len(paged_events),
            "limit": limit,
            "since_hours": since_hours,
            "has_more": has_more,
            "next_cursor": next_cursor,
        }
        response = jsonify(response_body)
        response.headers["X-Security-Feed-Signature"] = _security_feed_signature(response_body)
        return response, 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@admin_bp.route("/security/events/verify", methods=["GET"])
@limiter.limit(
    lambda: current_app.config.get("SECURITY_EVENTS_RATE_LIMIT", "60 per minute"),
    key_func=_security_events_rate_limit_key,
)
@jwt_required()
@admin_required
def verify_security_event_chain():
    """Verify tamper-evident audit integrity chain over a bounded time window."""
    try:
        limit = int(request.args.get("limit", 1000))
        limit = max(1, min(limit, 5000))
        since_hours = int(request.args.get("since_hours", 24))
        max_since_hours = int(current_app.config.get("SECURITY_EVENTS_MAX_SINCE_HOURS", 24 * 30))
        max_since_hours = max(1, min(max_since_hours, 24 * 365))
        since_hours = max(1, min(since_hours, max_since_hours))
        include_samples = request.args.get("include_samples", "false").lower() == "true"

        signing_key = (
            current_app.config.get("AUDIT_EXPORT_SIGNING_KEY")
            or current_app.config.get("SECRET_KEY")
            or "change-me"
        )

        window_start = datetime.utcnow() - timedelta(hours=since_hours)
        entries = (
            AuditLog.query
            .filter(AuditLog.timestamp >= window_start)
            .order_by(AuditLog.timestamp.asc(), AuditLog.id.asc())
            .limit(limit)
            .all()
        )

        previous_hash = None
        mismatches = []
        verified_count = 0

        for entry in entries:
            payload = entry.new_values if isinstance(entry.new_values, dict) else {}
            integrity = payload.get("_integrity") if isinstance(payload, dict) else None
            stored_hash = (integrity or {}).get("hash") if isinstance(integrity, dict) else None
            stored_prev_hash = (integrity or {}).get("prev_hash") if isinstance(integrity, dict) else None

            expected_hash = compute_audit_integrity_hash(
                signing_key,
                audit_id=entry.id,
                user_id=entry.user_id,
                action=entry.action,
                entity_type=entry.entity_type,
                entity_id=entry.entity_id,
                timestamp=entry.timestamp,
                old_values=entry.old_values,
                new_values=strip_audit_integrity(payload),
                prev_hash=previous_hash,
            )

            entry_valid = bool(stored_hash) and hmac.compare_digest(str(stored_hash), str(expected_hash))
            chain_valid = (stored_prev_hash == previous_hash)
            if not entry_valid or not chain_valid:
                mismatch = {
                    "id": int(entry.id) if entry.id is not None else None,
                    "created_at": entry.timestamp.isoformat() if entry.timestamp else None,
                    "reason": "hash_mismatch" if not entry_valid else "prev_hash_mismatch",
                }
                if include_samples:
                    mismatch["stored_hash"] = stored_hash
                    mismatch["expected_hash"] = expected_hash
                    mismatch["stored_prev_hash"] = stored_prev_hash
                    mismatch["expected_prev_hash"] = previous_hash
                mismatches.append(mismatch)

            previous_hash = stored_hash or expected_hash
            verified_count += 1

        response = {
            "valid": len(mismatches) == 0,
            "verified_entries": verified_count,
            "mismatch_count": len(mismatches),
            "since_hours": since_hours,
            "limit": limit,
            "mismatches": mismatches[:50],
            "has_more_mismatches": len(mismatches) > 50,
            "last_verified_hash": previous_hash,
        }
        return jsonify(response), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ============================================
# BULK OPERATIONS
# ============================================

@admin_bp.route("/users/bulk-delete", methods=["POST"])
@jwt_required()
@admin_required
def bulk_delete_users():
    """Bulk delete (soft delete) users."""
    idempotency_key = None
    try:
        security_event_id = _new_security_event_id("bulk_delete_users")
        confirmation_error = _require_admin_confirmation("bulk_delete_users")
        if confirmation_error:
            return confirmation_error

        data = request.get_json(silent=True) or {}
        user_ids = sorted(data.get("user_ids", []))

        idempotency_error, idempotency_key = _require_idempotency(
            "bulk_delete_users",
            {"user_ids": user_ids},
        )
        if idempotency_error:
            return idempotency_error

        current_admin_id = int(get_jwt_identity())
        approval_error = _require_two_person_approval(
            "bulk_delete_users",
            {"user_ids": user_ids},
            current_admin_id,
        )
        if approval_error:
            return approval_error

        if not current_app.config.get("ALLOW_DESTRUCTIVE_OPERATIONS", False):
            return jsonify({
                "error": "Destructive operations are disabled in this environment"
            }), 403

        data = request.get_json(silent=True) or {}
        user_ids = data.get("user_ids", [])
        
        if not user_ids:
            return jsonify({"error": "No user IDs provided"}), 400
        
        # Soft delete
        User.query.filter(User.id.in_(user_ids)).update(
            {"is_active": False},
            synchronize_session=False
        )
        db.session.commit()

        admin_id = int(get_jwt_identity())
        log_admin_action(
            user_id=admin_id,
            action="users_bulk_soft_deleted",
            entity_type="user",
            entity_id=None,
            new_values={"count": len(user_ids), "security_event_id": security_event_id},
        )

        response_body = {
            "message": f"Deleted {len(user_ids)} users",
            "security_event_id": security_event_id,
        }
        _finalize_idempotency(idempotency_key, response_body, 200)
        return jsonify(response_body), 200
        
    except Exception as e:
        _clear_idempotency(idempotency_key)
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@admin_bp.route("/users/bulk-verify", methods=["POST"])
@jwt_required()
@admin_required
def bulk_verify_users():
    """Bulk verify workers."""
    idempotency_key = None
    try:
        data = request.get_json(silent=True) or {}
        user_ids = data.get("user_ids", [])
        security_event_id = _new_security_event_id("bulk_verify_users")

        idempotency_error, idempotency_key = _require_idempotency(
            "bulk_verify_users",
            {"user_ids": sorted(user_ids)},
        )
        if idempotency_error:
            return idempotency_error
        
        if not user_ids:
            return jsonify({"error": "No user IDs provided"}), 400
        
        # Update workers
        workers = Worker.query.filter(Worker.user_id.in_(user_ids)).all()
        for worker in workers:
            worker.is_verified = True
            worker.verification_score = 100
        
        db.session.commit()

        admin_id = int(get_jwt_identity())
        log_admin_action(
            user_id=admin_id,
            action="users_bulk_verified",
            entity_type="user",
            entity_id=None,
            new_values={
                "count": len(workers),
                "security_event_id": security_event_id,
                "event_type": "admin.user.bulk_verify",
            },
        )
        
        response_body = {
            "message": f"Verified {len(workers)} workers",
            "security_event_id": security_event_id,
            "event_type": "admin.user.bulk_verify",
        }
        _finalize_idempotency(idempotency_key, response_body, 200)
        return jsonify(response_body), 200
        
    except Exception as e:
        _clear_idempotency(idempotency_key)
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@admin_bp.route("/system/database/integrity", methods=["GET"])
@jwt_required()
@admin_required
def get_database_integrity():
    """Run database integrity checks and return diagnostics."""
    try:
        engine = db.engine
        db_uri = str(engine.url)

        if not db_uri.startswith("sqlite"):
            return jsonify({
                "engine": engine.name,
                "status": "healthy",
                "message": "Integrity endpoint currently provides detailed checks for SQLite.",
            }), 200

        integrity_result = db.session.execute(text("PRAGMA integrity_check;")).scalar()
        fk_enabled = db.session.execute(text("PRAGMA foreign_keys;")).scalar()
        journal_mode = db.session.execute(text("PRAGMA journal_mode;")).scalar()
        busy_timeout = db.session.execute(text("PRAGMA busy_timeout;")).scalar()

        tables = {
            "users": User.query.count(),
            "workers": Worker.query.count(),
            "employers": Employer.query.count(),
            "jobs": Job.query.count(),
            "applications": Application.query.count(),
            "payments": Payment.query.count(),
            "audit_logs": AuditLog.query.count(),
        }

        return jsonify({
            "engine": engine.name,
            "status": "healthy" if integrity_result == "ok" else "degraded",
            "integrity_check": integrity_result,
            "foreign_keys_enabled": bool(fk_enabled),
            "journal_mode": journal_mode,
            "busy_timeout_ms": busy_timeout,
            "protect_mode": current_app.config.get("DB_PROTECT_MODE", True),
            "destructive_operations_allowed": current_app.config.get(
                "ALLOW_DESTRUCTIVE_OPERATIONS", False
            ),
            "table_counts": tables,
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@admin_bp.route("/system/database/backup", methods=["POST"])
@limiter.limit(lambda: current_app.config.get("DB_BACKUP_RATE_LIMIT", "5 per hour"))
@jwt_required()
@admin_required
def create_database_backup():
    """Create a point-in-time backup for SQLite database."""
    try:
        db_uri = str(db.engine.url)
        if not db_uri.startswith("sqlite"):
            return jsonify({
                "error": "Automated backup endpoint is currently implemented for SQLite only"
            }), 400

        db_path = db.engine.url.database
        if not db_path or not os.path.exists(db_path):
            return jsonify({"error": "Database file not found"}), 404

        backup_dir = current_app.config.get("DB_BACKUP_DIR", "instance/backups")
        os.makedirs(backup_dir, exist_ok=True)

        timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        backup_path = os.path.join(backup_dir, f"dev-backup-{timestamp}.db")

        with sqlite3.connect(db_path) as source_conn:
            with sqlite3.connect(backup_path) as target_conn:
                source_conn.backup(target_conn)

        backup_size = os.path.getsize(backup_path)
        backup_sha256 = _file_sha256(backup_path)
        security_event_id = _new_security_event_id("database_backup_create")
        created_at = datetime.utcnow().isoformat()

        manifest_payload = {
            "version": 1,
            "backup_file": os.path.basename(backup_path),
            "backup_size_bytes": int(backup_size),
            "backup_sha256": backup_sha256,
            "created_at": created_at,
            "source_db": os.path.basename(db_path),
            "engine": db.engine.name,
            "security_event_id": security_event_id,
        }
        manifest_signature = _sign_manifest_payload(manifest_payload)
        manifest_document = {**manifest_payload, "signature": manifest_signature}
        manifest_path = f"{backup_path}.manifest.json"
        with open(manifest_path, "w", encoding="utf-8") as manifest_file:
            json.dump(manifest_document, manifest_file, separators=(",", ":"), sort_keys=True)

        admin_id = int(get_jwt_identity())
        log_admin_action(
            user_id=admin_id,
            action="database_backup_created",
            entity_type="database_backup",
            entity_id=None,
            new_values={
                "backup_file": os.path.basename(backup_path),
                "manifest_file": os.path.basename(manifest_path),
                "backup_size_bytes": int(backup_size),
                "backup_sha256": backup_sha256,
                "security_event_id": security_event_id,
                "event_type": "admin.db.backup.create",
            },
        )

        return jsonify({
            "message": "Database backup created successfully",
            "backup_file": backup_path,
            "manifest_file": manifest_path,
            "backup_size_bytes": backup_size,
            "backup_sha256": backup_sha256,
            "manifest_signature": manifest_signature,
            "security_event_id": security_event_id,
            "event_type": "admin.db.backup.create",
            "created_at": created_at,
        }), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@admin_bp.route("/system/database/backup/verify", methods=["GET"])
@limiter.limit(lambda: current_app.config.get("DB_BACKUP_VERIFY_RATE_LIMIT", "30 per minute"))
@jwt_required()
@admin_required
def verify_database_backup():
    """Verify backup integrity from signed manifest and current file checksum."""
    try:
        backup_dir = current_app.config.get("DB_BACKUP_DIR", "instance/backups")
        os.makedirs(backup_dir, exist_ok=True)

        backup_file = request.args.get("backup_file")
        if not backup_file:
            return jsonify({"error": "backup_file query parameter is required"}), 400

        backup_path = _safe_backup_path(backup_dir, backup_file)
        if not backup_path:
            return jsonify({"error": "Invalid backup_file"}), 400
        if not os.path.exists(backup_path):
            return jsonify({"error": "Backup file not found"}), 404

        manifest_file = request.args.get("manifest_file")
        if manifest_file:
            manifest_path = _safe_backup_path(backup_dir, manifest_file)
        else:
            manifest_path = f"{backup_path}.manifest.json"

        if not manifest_path:
            return jsonify({"error": "Invalid manifest_file"}), 400
        if not os.path.exists(manifest_path):
            return jsonify({"error": "Manifest file not found"}), 404

        with open(manifest_path, "r", encoding="utf-8") as manifest_handle:
            manifest = json.load(manifest_handle)

        stored_signature = manifest.get("signature")
        if not stored_signature:
            return jsonify({"error": "Manifest missing signature"}), 400

        manifest_payload = dict(manifest)
        manifest_payload.pop("signature", None)
        expected_signature = _sign_manifest_payload(manifest_payload)
        signature_valid = hmac.compare_digest(str(stored_signature), str(expected_signature))

        computed_sha256 = _file_sha256(backup_path)
        declared_sha256 = manifest_payload.get("backup_sha256")
        hash_valid = bool(declared_sha256) and hmac.compare_digest(str(declared_sha256), str(computed_sha256))

        actual_size = os.path.getsize(backup_path)
        declared_size = manifest_payload.get("backup_size_bytes")
        try:
            size_valid = int(declared_size) == int(actual_size)
        except Exception:
            size_valid = False

        verification_security_event_id = _new_security_event_id("database_backup_verify")
        overall_valid = signature_valid and hash_valid and size_valid

        admin_id = int(get_jwt_identity())
        log_admin_action(
            user_id=admin_id,
            action="database_backup_verified",
            entity_type="database_backup",
            entity_id=None,
            new_values={
                "backup_file": os.path.basename(backup_path),
                "manifest_file": os.path.basename(manifest_path),
                "signature_valid": signature_valid,
                "hash_valid": hash_valid,
                "size_valid": size_valid,
                "valid": overall_valid,
                "security_event_id": verification_security_event_id,
                "event_type": "admin.db.backup.verify",
            },
        )

        return jsonify({
            "valid": overall_valid,
            "backup_file": backup_path,
            "manifest_file": manifest_path,
            "signature_valid": signature_valid,
            "hash_valid": hash_valid,
            "size_valid": size_valid,
            "computed_sha256": computed_sha256,
            "declared_sha256": declared_sha256,
            "computed_size_bytes": int(actual_size),
            "declared_size_bytes": declared_size,
            "security_event_id": verification_security_event_id,
            "event_type": "admin.db.backup.verify",
            "verified_at": datetime.utcnow().isoformat(),
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
