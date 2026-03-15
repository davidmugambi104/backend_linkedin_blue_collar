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
    "database_backup_prune": {
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


SUPPORTED_APPROVAL_ACTIONS = set(ACTION_APPROVAL_POLICY.keys())


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


def _reason_required_for(action_name):
    if not current_app.config.get("ADMIN_REASON_ENFORCEMENT_ENABLED", True):
        return False
    raw = current_app.config.get("ADMIN_REASON_REQUIRED_ACTIONS", "")
    configured = {
        str(item).strip()
        for item in str(raw).split(",")
        if str(item).strip()
    }
    return "*" in configured or action_name in configured


def _extract_reason_from_request(data=None, fallback_fields=None):
    candidate_fields = ["reason"] + list(fallback_fields or [])

    if isinstance(data, dict):
        for field in candidate_fields:
            value = data.get(field)
            if isinstance(value, str) and value.strip():
                return value.strip()

    args_reason = request.args.get("reason")
    if isinstance(args_reason, str) and args_reason.strip():
        return args_reason.strip()

    header_reason = request.headers.get("X-Action-Reason")
    if isinstance(header_reason, str) and header_reason.strip():
        return header_reason.strip()

    return None


def _require_action_reason(action_name, data=None, fallback_fields=None):
    if not _reason_required_for(action_name):
        return None, None

    reason = _extract_reason_from_request(data=data, fallback_fields=fallback_fields)
    if not reason:
        return jsonify({
            "error": "Action reason required",
            "message": "Provide reason in request body, query parameter, or X-Action-Reason header",
            "action": action_name,
        }), None

    min_length = max(1, int(current_app.config.get("ADMIN_REASON_MIN_LENGTH", 8)))
    if len(reason) < min_length:
        return jsonify({
            "error": "Action reason too short",
            "message": f"Reason must be at least {min_length} characters",
            "action": action_name,
        }), None

    return None, reason


def _change_ticket_required_for(action_name):
    if not current_app.config.get("ADMIN_CHANGE_TICKET_ENFORCEMENT_ENABLED", True):
        return False
    raw = current_app.config.get("ADMIN_CHANGE_TICKET_REQUIRED_ACTIONS", "")
    configured = {
        str(item).strip()
        for item in str(raw).split(",")
        if str(item).strip()
    }
    return "*" in configured or action_name in configured


def _extract_change_ticket(data=None):
    if isinstance(data, dict):
        for field in ("change_ticket", "ticket"):
            value = data.get(field)
            if isinstance(value, str) and value.strip():
                return value.strip()

    query_ticket = request.args.get("change_ticket") or request.args.get("ticket")
    if isinstance(query_ticket, str) and query_ticket.strip():
        return query_ticket.strip()

    header_ticket = request.headers.get("X-Change-Ticket")
    if isinstance(header_ticket, str) and header_ticket.strip():
        return header_ticket.strip()

    return None


def _require_change_ticket(action_name, data=None):
    if not _change_ticket_required_for(action_name):
        return None, None

    change_ticket = _extract_change_ticket(data=data)
    if not change_ticket:
        return jsonify({
            "error": "Change ticket required",
            "message": "Provide change ticket in request body, query parameter, or X-Change-Ticket header",
            "action": action_name,
        }), None

    min_length = max(1, int(current_app.config.get("ADMIN_CHANGE_TICKET_MIN_LENGTH", 3)))
    if len(change_ticket) < min_length:
        return jsonify({
            "error": "Change ticket too short",
            "message": f"Change ticket must be at least {min_length} characters",
            "action": action_name,
        }), None

    return None, change_ticket


def _require_action_governance(action_name, data=None, fallback_reason_fields=None):
    reason_error, reason = _require_action_reason(
        action_name,
        data=data,
        fallback_fields=fallback_reason_fields,
    )
    if reason_error:
        return reason_error, None, None

    ticket_error, change_ticket = _require_change_ticket(action_name, data=data)
    if ticket_error:
        return ticket_error, None, None

    return None, reason, change_ticket


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


def _serialize_role(role):
    if hasattr(role, "value"):
        return role.value
    return str(role)


def _sorted_csv_items(raw):
    return sorted(
        [item.strip() for item in str(raw or "").split(",") if item.strip()]
    )


def _build_governance_policy_snapshot():
    action_names = sorted(
        set(ACTION_APPROVAL_POLICY.keys())
        | set(ACTION_PERMISSION_POLICY.keys())
        | set(_sorted_csv_items(current_app.config.get("ADMIN_REASON_REQUIRED_ACTIONS", "")))
        | set(_sorted_csv_items(current_app.config.get("ADMIN_CHANGE_TICKET_REQUIRED_ACTIONS", "")))
    )

    approval_policy = {}
    permission_policy = {}
    for action_name in action_names:
        resolved_roles = _resolve_action_approval_policy(action_name)
        approval_policy[action_name] = {
            "request_roles": sorted([_serialize_role(r) for r in resolved_roles.get("request_roles", set())]),
            "approve_roles": sorted([_serialize_role(r) for r in resolved_roles.get("approve_roles", set())]),
            "execute_roles": sorted([_serialize_role(r) for r in resolved_roles.get("execute_roles", set())]),
        }

        resolved_permissions = _resolve_action_permission_policy(action_name)
        permission_policy[action_name] = {
            "request_permission": resolved_permissions.get("request_permission"),
            "approve_permission": resolved_permissions.get("approve_permission"),
            "execute_permission": resolved_permissions.get("execute_permission"),
        }

    snapshot = {
        "version": 1,
        "generated_at": datetime.utcnow().isoformat(),
        "security_controls": {
            "require_admin_confirmation": bool(current_app.config.get("REQUIRE_ADMIN_CONFIRMATION", True)),
            "allow_destructive_operations": bool(current_app.config.get("ALLOW_DESTRUCTIVE_OPERATIONS", False)),
            "two_person_approval_enabled": bool(current_app.config.get("TWO_PERSON_APPROVAL_ENABLED", True)),
            "admin_idempotency_enabled": bool(current_app.config.get("ADMIN_IDEMPOTENCY_ENABLED", True)),
            "admin_reason_enforcement_enabled": bool(current_app.config.get("ADMIN_REASON_ENFORCEMENT_ENABLED", True)),
            "admin_reason_min_length": int(current_app.config.get("ADMIN_REASON_MIN_LENGTH", 8)),
            "admin_change_ticket_enforcement_enabled": bool(current_app.config.get("ADMIN_CHANGE_TICKET_ENFORCEMENT_ENABLED", True)),
            "admin_change_ticket_min_length": int(current_app.config.get("ADMIN_CHANGE_TICKET_MIN_LENGTH", 3)),
        },
        "required_actions": {
            "reason": _sorted_csv_items(current_app.config.get("ADMIN_REASON_REQUIRED_ACTIONS", "")),
            "change_ticket": _sorted_csv_items(current_app.config.get("ADMIN_CHANGE_TICKET_REQUIRED_ACTIONS", "")),
        },
        "approval_policy": approval_policy,
        "permission_policy": permission_policy,
    }

    canonical = json.dumps(snapshot, sort_keys=True, separators=(",", ":")).encode("utf-8")
    snapshot_hash = hashlib.sha256(canonical).hexdigest()
    snapshot_signature = hmac.new(
        _security_feed_signing_key().encode("utf-8"),
        canonical,
        hashlib.sha256,
    ).hexdigest()
    return snapshot, snapshot_hash, snapshot_signature


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


def _backup_holds_file_path(backup_dir):
    holds_file_name = current_app.config.get("DB_BACKUP_HOLDS_FILE", "backup_holds.json")
    safe_holds_name = os.path.basename(str(holds_file_name).strip())
    if not safe_holds_name:
        safe_holds_name = "backup_holds.json"
    return os.path.join(backup_dir, safe_holds_name)


def _load_backup_holds(backup_dir):
    holds_path = _backup_holds_file_path(backup_dir)
    if not os.path.exists(holds_path):
        return {}, holds_path
    try:
        with open(holds_path, "r", encoding="utf-8") as holds_file:
            payload = json.load(holds_file)
        holds = payload.get("holds") if isinstance(payload, dict) else {}
        if not isinstance(holds, dict):
            holds = {}
        return holds, holds_path
    except Exception:
        return {}, holds_path


def _save_backup_holds(holds_path, holds_dict):
    document = {
        "version": 1,
        "updated_at": datetime.utcnow().isoformat(),
        "holds": holds_dict,
    }
    with open(holds_path, "w", encoding="utf-8") as holds_file:
        json.dump(document, holds_file, separators=(",", ":"), sort_keys=True)


def _list_backup_files(backup_dir):
    files = []
    for entry in os.listdir(backup_dir):
        if not entry.endswith(".db"):
            continue
        full_path = _safe_backup_path(backup_dir, entry)
        if not full_path or not os.path.isfile(full_path):
            continue
        files.append(full_path)
    files.sort(key=lambda path: os.path.getmtime(path), reverse=True)
    return files


def _compute_backup_prune_plan(backup_files, holds, retention_days, max_files):
    now_ts = time.time()
    held_names = set(holds.keys())
    reasons_by_name = {}

    for backup_path in backup_files:
        backup_name = os.path.basename(backup_path)
        if backup_name in held_names:
            continue

        age_days = (now_ts - os.path.getmtime(backup_path)) / 86400
        if age_days > retention_days:
            reasons_by_name.setdefault(backup_name, set()).add("age")

    non_held_files = [
        path for path in backup_files
        if os.path.basename(path) not in held_names
    ]
    if len(non_held_files) > max_files:
        for overflow_path in non_held_files[max_files:]:
            overflow_name = os.path.basename(overflow_path)
            reasons_by_name.setdefault(overflow_name, set()).add("count")

    candidates = [
        path for path in backup_files
        if os.path.basename(path) in reasons_by_name
    ]
    reasons = {
        name: sorted(list(reason_set))
        for name, reason_set in reasons_by_name.items()
    }
    return candidates, reasons


def _load_manifest_with_trust(manifest_path):
    if not os.path.exists(manifest_path):
        return None, False

    with open(manifest_path, "r", encoding="utf-8") as manifest_handle:
        manifest = json.load(manifest_handle)

    stored_signature = manifest.get("signature")
    if not stored_signature:
        return manifest, False

    manifest_payload = dict(manifest)
    manifest_payload.pop("signature", None)
    expected_signature = _sign_manifest_payload(manifest_payload)
    signature_valid = hmac.compare_digest(str(stored_signature), str(expected_signature))
    return manifest, signature_valid


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
        governance_error, reason, change_ticket = _require_action_governance("ban_user", data=data)
        if governance_error:
            return governance_error
        duration = data.get("duration")  # In days, None for permanent
        security_event_id = _new_security_event_id("user_ban")

        idempotency_error, idempotency_key = _require_idempotency(
            "ban_user",
            {
                "user_id": user_id,
                "reason": reason,
                "change_ticket": change_ticket,
                "duration": duration,
            },
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
                "change_ticket": change_ticket,
                "duration": duration,
                "security_event_id": security_event_id,
                "event_type": "admin.user.ban",
            },
        )

        response_body = {
            "message": "User banned successfully",
            "reason": reason,
            "change_ticket": change_ticket,
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
        data = request.get_json(silent=True) or {}
        governance_error, reason, change_ticket = _require_action_governance("unban_user", data=data)
        if governance_error:
            return governance_error

        security_event_id = _new_security_event_id("user_unban")
        idempotency_error, idempotency_key = _require_idempotency(
            "unban_user",
            {"user_id": user_id, "reason": reason, "change_ticket": change_ticket},
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
                "reason": reason,
                "change_ticket": change_ticket,
                "security_event_id": security_event_id,
                "event_type": "admin.user.unban",
            },
        )

        response_body = {
            "message": "User unbanned successfully",
            "reason": reason,
            "change_ticket": change_ticket,
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
        data = request.get_json(silent=True) or {}
        governance_error, reason, change_ticket = _require_action_governance("delete_user", data=data)
        if governance_error:
            return governance_error

        security_event_id = _new_security_event_id("delete_user")
        confirmation_error = _require_admin_confirmation("delete_user")
        if confirmation_error:
            return confirmation_error

        idempotency_error, idempotency_key = _require_idempotency(
            "delete_user",
            {"user_id": user_id, "reason": reason, "change_ticket": change_ticket},
        )
        if idempotency_error:
            return idempotency_error

        current_admin_id = int(get_jwt_identity())
        approval_error = _require_two_person_approval(
            "delete_user",
            {"user_id": user_id, "reason": reason, "change_ticket": change_ticket},
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
            new_values={
                "is_active": False,
                "reason": reason,
                "change_ticket": change_ticket,
                "security_event_id": security_event_id,
                "event_type": "admin.user.delete",
            },
        )

        response_body = {
            "message": "User deleted successfully",
            "reason": reason,
            "change_ticket": change_ticket,
            "security_event_id": security_event_id,
            "event_type": "admin.user.delete",
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


@admin_bp.route("/payments", methods=["GET"])
@jwt_required()
@admin_required
def get_all_payments():
    """Get all platform payments (admin view)."""
    try:
        status = request.args.get("status")
        payment_type = request.args.get("payment_type")
        page = int(request.args.get("page", 1))
        limit = int(request.args.get("limit", 20))

        query = Payment.query

        if status:
            try:
                query = query.filter_by(status=PaymentStatus(status))
            except ValueError:
                return jsonify({"error": "Invalid status"}), 400

        if payment_type:
            query = query.filter_by(payment_type=payment_type)

        query = query.order_by(Payment.created_at.desc())

        total = query.count()
        payments = query.offset((page - 1) * limit).limit(limit).all()

        payments_data = []
        for payment in payments:
            p = payment.to_dict()
            user = User.query.get(payment.user_id) if payment.user_id else None
            p["payer_name"] = user.username if user else None
            p["description"] = payment.payment_type
            payments_data.append(p)

        return jsonify({
            "payments": payments_data,
            "total": total,
            "pages": (total + limit - 1) // limit,
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
        governance_error, reason, change_ticket = _require_action_governance("moderate_job", data=data)
        if governance_error:
            return governance_error
        security_event_id = _new_security_event_id("job_moderate")

        idempotency_error, idempotency_key = _require_idempotency(
            "moderate_job",
            {
                "job_id": job_id,
                "action": action,
                "reason": reason,
                "change_ticket": change_ticket,
            },
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
                "change_ticket": change_ticket,
                "security_event_id": security_event_id,
                "event_type": "admin.job.moderate",
            },
        )
        
        response_body = {
            "message": f"Job {action}ed successfully",
            "reason": reason,
            "change_ticket": change_ticket,
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
        data = request.get_json(silent=True) or {}
        governance_error, reason, change_ticket = _require_action_governance("feature_job", data=data)
        if governance_error:
            return governance_error

        security_event_id = _new_security_event_id("job_feature")
        idempotency_error, idempotency_key = _require_idempotency(
            "feature_job",
            {"job_id": job_id, "reason": reason, "change_ticket": change_ticket},
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
                "reason": reason,
                "change_ticket": change_ticket,
                "security_event_id": security_event_id,
                "event_type": "admin.job.feature",
            },
        )

        response_body = {
            "message": "Job featured successfully",
            "reason": reason,
            "change_ticket": change_ticket,
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
        data = request.get_json(silent=True) or {}
        governance_error, reason, change_ticket = _require_action_governance("unfeature_job", data=data)
        if governance_error:
            return governance_error

        security_event_id = _new_security_event_id("job_unfeature")
        idempotency_error, idempotency_key = _require_idempotency(
            "unfeature_job",
            {"job_id": job_id, "reason": reason, "change_ticket": change_ticket},
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
                "reason": reason,
                "change_ticket": change_ticket,
                "security_event_id": security_event_id,
                "event_type": "admin.job.unfeature",
            },
        )

        response_body = {
            "message": "Job unfeatured successfully",
            "reason": reason,
            "change_ticket": change_ticket,
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
        governance_error, reason, change_ticket = _require_action_governance(
            "review_verification",
            data=data,
            fallback_reason_fields=["notes"],
        )
        if governance_error:
            return governance_error
        notes = data.get("notes")
        security_event_id = _new_security_event_id("verification_review")

        idempotency_error, idempotency_key = _require_idempotency(
            "review_verification",
            {
                "verification_id": verification_id,
                "status": status,
                "notes": notes,
                "reason": reason,
                "change_ticket": change_ticket,
            },
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
                "reason": reason,
                "change_ticket": change_ticket,
                "security_event_id": security_event_id,
                "event_type": "admin.verification.review",
            },
        )
        
        response_body = {
            "message": "Verification reviewed successfully",
            "reason": reason,
            "change_ticket": change_ticket,
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
        governance_error, reason, change_ticket = _require_action_governance("update_platform_settings", data=data)
        if governance_error:
            return governance_error
        security_event_id = _new_security_event_id("platform_settings_update")

        idempotency_error, idempotency_key = _require_idempotency(
            "update_platform_settings",
            {"data": data, "reason": reason, "change_ticket": change_ticket},
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
                "reason": reason,
                "change_ticket": change_ticket,
                "security_event_id": security_event_id,
                "event_type": "admin.settings.update",
            },
        )

        response_body = {
            "message": "Settings updated successfully",
            "reason": reason,
            "change_ticket": change_ticket,
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
        governance_error, reason, change_ticket = _require_action_governance(
            "approval_request",
            data=data,
            fallback_reason_fields=["reason"],
        )
        if governance_error:
            return governance_error

        idempotency_error, idempotency_key = _require_idempotency(
            "approval_request",
            {
                "action": action,
                "payload": payload,
                "reason": reason,
                "change_ticket": change_ticket,
            },
        )
        if idempotency_error:
            return idempotency_error

        if action not in SUPPORTED_APPROVAL_ACTIONS:
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
            "change_ticket": change_ticket,
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
                "reason": reason,
                "change_ticket": change_ticket,
                "security_event_id": security_event_id,
                "event_type": "admin.approval.request",
            },
        )

        response_body = {
            "approval_id": approval_id,
            "status": "pending",
            "expires_in_seconds": ttl,
            "action": action,
            "reason": reason,
            "change_ticket": change_ticket,
            "security_event_id": security_event_id,
            "event_type": "admin.approval.request",
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
        data = request.get_json(silent=True) or {}
        governance_error, reason, change_ticket = _require_action_governance(
            "approval_approve",
            data=data,
            fallback_reason_fields=["reason"],
        )
        if governance_error:
            return governance_error

        security_event_id = _new_security_event_id("approval_approve")
        idempotency_error, idempotency_key = _require_idempotency(
            "approval_approve",
            {
                "approval_id": approval_id,
                "reason": reason,
                "change_ticket": change_ticket,
            },
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
        approval["approval_reason"] = reason
        approval["approval_change_ticket"] = change_ticket
        _store_approval(approval, current_app.config.get("ADMIN_APPROVAL_TTL_SECONDS", 1800))

        log_admin_action(
            user_id=approver_id,
            action="approval_approved",
            entity_type="approval",
            entity_id=None,
            new_values={
                "approval_id": approval_id,
                "action": approval.get("action"),
                "reason": reason,
                "change_ticket": change_ticket,
                "security_event_id": security_event_id,
                "event_type": "admin.approval.approve",
            },
        )

        response_body = {
            "approval_id": approval_id,
            "status": "approved",
            "reason": reason,
            "change_ticket": change_ticket,
            "security_event_id": security_event_id,
            "event_type": "admin.approval.approve",
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
        data = request.get_json(silent=True) or {}
        governance_error, reason, change_ticket = _require_action_governance(
            "approval_reject",
            data=data,
            fallback_reason_fields=["reason"],
        )
        if governance_error:
            return governance_error

        security_event_id = _new_security_event_id("approval_reject")
        idempotency_error, idempotency_key = _require_idempotency(
            "approval_reject",
            {
                "approval_id": approval_id,
                "reason": reason,
                "change_ticket": change_ticket,
            },
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
        approval["rejection_reason"] = reason
        approval["rejection_change_ticket"] = change_ticket
        _store_approval(approval, current_app.config.get("ADMIN_APPROVAL_TTL_SECONDS", 1800))

        log_admin_action(
            user_id=approver_id,
            action="approval_rejected",
            entity_type="approval",
            entity_id=None,
            new_values={
                "approval_id": approval_id,
                "action": approval.get("action"),
                "reason": reason,
                "change_ticket": change_ticket,
                "security_event_id": security_event_id,
                "event_type": "admin.approval.reject",
            },
        )

        response_body = {
            "approval_id": approval_id,
            "status": "rejected",
            "reason": reason,
            "change_ticket": change_ticket,
            "security_event_id": security_event_id,
            "event_type": "admin.approval.reject",
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
        data = request.get_json(silent=True) or {}
        governance_error, reason, change_ticket = _require_action_governance(
            "approval_cancel",
            data=data,
            fallback_reason_fields=["reason"],
        )
        if governance_error:
            return governance_error

        security_event_id = _new_security_event_id("approval_cancel")
        idempotency_error, idempotency_key = _require_idempotency(
            "approval_cancel",
            {
                "approval_id": approval_id,
                "reason": reason,
                "change_ticket": change_ticket,
            },
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
        approval["cancellation_reason"] = reason
        approval["cancellation_change_ticket"] = change_ticket
        _store_approval(approval, current_app.config.get("ADMIN_APPROVAL_TTL_SECONDS", 1800))

        log_admin_action(
            user_id=actor_id,
            action="approval_cancelled",
            entity_type="approval",
            entity_id=None,
            new_values={
                "approval_id": approval_id,
                "action": approval.get("action"),
                "reason": reason,
                "change_ticket": change_ticket,
                "security_event_id": security_event_id,
                "event_type": "admin.approval.cancel",
            },
        )

        response_body = {
            "approval_id": approval_id,
            "status": "cancelled",
            "reason": reason,
            "change_ticket": change_ticket,
            "security_event_id": security_event_id,
            "event_type": "admin.approval.cancel",
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
        is_export = response_format == "csv" or download
        export_reason = None
        export_change_ticket = None

        if is_export:
            governance_error, export_reason, export_change_ticket = _require_action_governance("audit_export")
            if governance_error:
                return governance_error

        if include_sensitive and not _is_super_admin(current_user):
            return jsonify({"error": "Sensitive audit fields require super admin role"}), 403

        if is_export and not _has_admin_permission(current_user, "audit:export"):
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
            log_admin_action(
                user_id=int(get_jwt_identity()),
                action="audit_export_csv",
                entity_type="audit_log",
                entity_id=None,
                new_values={
                    "format": "csv",
                    "row_count": len(audit_entries),
                    "include_sensitive": include_sensitive,
                    "reason": export_reason,
                    "change_ticket": export_change_ticket,
                    "security_event_id": security_event_id,
                    "event_type": "admin.audit.export.csv",
                },
            )
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
            log_admin_action(
                user_id=int(get_jwt_identity()),
                action="audit_export_json",
                entity_type="audit_log",
                entity_id=None,
                new_values={
                    "format": "json",
                    "row_count": len(audit_entries),
                    "include_sensitive": include_sensitive,
                    "reason": export_reason,
                    "change_ticket": export_change_ticket,
                    "security_event_id": security_event_id,
                    "event_type": "admin.audit.export.json",
                },
            )
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


@admin_bp.route("/governance/policy-snapshot", methods=["GET"])
@limiter.limit(lambda: current_app.config.get("GOVERNANCE_SNAPSHOT_RATE_LIMIT", "30 per minute"))
@jwt_required()
@admin_required
def get_governance_policy_snapshot():
    """Get signed snapshot of active governance/security policy controls."""
    try:
        current_user = User.query.get(int(get_jwt_identity()))
        record = request.args.get("record", "true").lower() == "true"

        snapshot, snapshot_hash, snapshot_signature = _build_governance_policy_snapshot()
        security_event_id = _new_security_event_id("governance_policy_snapshot")

        if record:
            log_admin_action(
                user_id=int(get_jwt_identity()),
                action="governance_policy_snapshot",
                entity_type="governance_policy",
                entity_id=None,
                new_values={
                    "snapshot_hash": snapshot_hash,
                    "snapshot_signature": snapshot_signature,
                    "policy_version": snapshot.get("version"),
                    "recorded_by": current_user.username if current_user else None,
                    "security_event_id": security_event_id,
                    "event_type": "admin.governance.policy.snapshot",
                    "snapshot": snapshot,
                },
            )

        response_body = {
            "recorded": record,
            "snapshot": snapshot,
            "snapshot_hash": snapshot_hash,
            "snapshot_signature": snapshot_signature,
            "security_event_id": security_event_id,
            "event_type": "admin.governance.policy.snapshot",
        }
        response = jsonify(response_body)
        response.headers["X-Policy-Snapshot-Hash"] = snapshot_hash
        response.headers["X-Policy-Snapshot-Signature"] = snapshot_signature
        return response, 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@admin_bp.route("/governance/policy-snapshots", methods=["GET"])
@limiter.limit(lambda: current_app.config.get("GOVERNANCE_SNAPSHOT_RATE_LIMIT", "30 per minute"))
@jwt_required()
@admin_required
def list_governance_policy_snapshots():
    """List historical governance policy snapshots recorded in audit logs."""
    try:
        current_user = User.query.get(int(get_jwt_identity()))
        page = int(request.args.get("page", 1))
        limit = int(request.args.get("limit", 20))
        max_page_size = int(current_app.config.get("GOVERNANCE_SNAPSHOT_HISTORY_MAX_PAGE_SIZE", 200))
        limit = min(max(limit, 1), max_page_size)
        include_snapshot = request.args.get("include_snapshot", "false").lower() == "true"

        if include_snapshot and not _is_super_admin(current_user):
            return jsonify({"error": "include_snapshot requires super admin role"}), 403

        query = (
            AuditLog.query
            .filter(AuditLog.action == "governance_policy_snapshot")
            .order_by(AuditLog.timestamp.desc(), AuditLog.id.desc())
        )
        total = query.count()
        entries = query.offset((page - 1) * limit).limit(limit).all()

        snapshots = []
        for entry in entries:
            payload = entry.new_values if isinstance(entry.new_values, dict) else {}
            admin_user = User.query.get(entry.user_id) if entry.user_id else None
            row = {
                "id": int(entry.id) if entry.id is not None else None,
                "admin_id": entry.user_id,
                "admin_name": admin_user.username if admin_user else "System",
                "snapshot_hash": payload.get("snapshot_hash"),
                "snapshot_signature": payload.get("snapshot_signature"),
                "policy_version": payload.get("policy_version"),
                "security_event_id": payload.get("security_event_id"),
                "event_type": payload.get("event_type"),
                "created_at": entry.timestamp.isoformat() if entry.timestamp else None,
            }
            if include_snapshot:
                row["snapshot"] = payload.get("snapshot")
            snapshots.append(row)

        return jsonify({
            "items": snapshots,
            "total": total,
            "pages": (total + limit - 1) // limit if limit > 0 else 0,
            "current_page": page,
            "limit": limit,
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@admin_bp.route("/governance/compliance/report", methods=["GET"])
@limiter.limit(lambda: current_app.config.get("GOVERNANCE_COMPLIANCE_RATE_LIMIT", "30 per minute"))
@jwt_required()
@admin_required
def get_governance_compliance_report():
    """Run governance/compliance checks for enterprise hardening controls."""
    try:
        current_user = User.query.get(int(get_jwt_identity()))
        include_details = request.args.get("include_details", "true").lower() == "true"
        if include_details and not _is_super_admin(current_user):
            include_details = False

        checks = []

        approval_policy_actions = set(ACTION_APPROVAL_POLICY.keys())
        non_requestable_approval_actions = sorted(list(approval_policy_actions - SUPPORTED_APPROVAL_ACTIONS))
        checks.append({
            "id": "approval_request_coverage",
            "severity": "high",
            "status": "pass" if not non_requestable_approval_actions else "fail",
            "message": (
                "All approval-policy actions are requestable"
                if not non_requestable_approval_actions
                else "Some approval-policy actions cannot be requested via approval API"
            ),
            "details": {
                "policy_actions": sorted(list(approval_policy_actions)),
                "requestable_actions": sorted(list(SUPPORTED_APPROVAL_ACTIONS)),
                "missing_requestable_actions": non_requestable_approval_actions,
            } if include_details else None,
        })

        reason_enabled = bool(current_app.config.get("ADMIN_REASON_ENFORCEMENT_ENABLED", True))
        required_reason_actions = set(_sorted_csv_items(current_app.config.get("ADMIN_REASON_REQUIRED_ACTIONS", "")))
        governance_critical_actions = approval_policy_actions | {
            "audit_export",
            "incident_timeline_export",
            "approval_request",
            "approval_approve",
            "approval_reject",
            "approval_cancel",
        }
        missing_reason_actions = sorted(list(governance_critical_actions - required_reason_actions)) if reason_enabled else []
        checks.append({
            "id": "reason_policy_coverage",
            "severity": "medium",
            "status": "pass" if (not reason_enabled or not missing_reason_actions) else "warn",
            "message": (
                "Reason policy covers governance-critical actions"
                if (not reason_enabled or not missing_reason_actions)
                else "Reason policy misses some governance-critical actions"
            ),
            "details": {
                "required_actions": sorted(list(required_reason_actions)),
                "missing_actions": missing_reason_actions,
            } if include_details else None,
        })

        ticket_enabled = bool(current_app.config.get("ADMIN_CHANGE_TICKET_ENFORCEMENT_ENABLED", True))
        required_ticket_actions = set(_sorted_csv_items(current_app.config.get("ADMIN_CHANGE_TICKET_REQUIRED_ACTIONS", "")))
        missing_ticket_actions = sorted(list(governance_critical_actions - required_ticket_actions)) if ticket_enabled else []
        checks.append({
            "id": "change_ticket_policy_coverage",
            "severity": "medium",
            "status": "pass" if (not ticket_enabled or not missing_ticket_actions) else "warn",
            "message": (
                "Change-ticket policy covers governance-critical actions"
                if (not ticket_enabled or not missing_ticket_actions)
                else "Change-ticket policy misses some governance-critical actions"
            ),
            "details": {
                "required_actions": sorted(list(required_ticket_actions)),
                "missing_actions": missing_ticket_actions,
            } if include_details else None,
        })

        default_secret_values = {
            "dev-secret-key-change-in-production",
            "jwt-secret-key-change-in-production",
        }
        secret_key_value = str(current_app.config.get("SECRET_KEY") or "")
        jwt_secret_key_value = str(current_app.config.get("JWT_SECRET_KEY") or "")
        default_secrets_in_use = (
            secret_key_value in default_secret_values
            or jwt_secret_key_value in default_secret_values
        )
        checks.append({
            "id": "default_secrets",
            "severity": "critical",
            "status": "fail" if default_secrets_in_use else "pass",
            "message": (
                "Default security secrets are in use"
                if default_secrets_in_use
                else "Non-default secrets configured"
            ),
            "details": {
                "secret_key_default": secret_key_value in default_secret_values,
                "jwt_secret_key_default": jwt_secret_key_value in default_secret_values,
            } if include_details else None,
        })

        destructive_enabled = bool(current_app.config.get("ALLOW_DESTRUCTIVE_OPERATIONS", False))
        checks.append({
            "id": "destructive_operations",
            "severity": "high",
            "status": "warn" if destructive_enabled else "pass",
            "message": (
                "Destructive operations are enabled"
                if destructive_enabled
                else "Destructive operations are disabled"
            ),
            "details": {
                "allow_destructive_operations": destructive_enabled,
            } if include_details else None,
        })

        soft_delete_enforced = bool(current_app.config.get("DB_ENFORCE_SOFT_DELETE", True))
        hard_delete_enabled = bool(current_app.config.get("ALLOW_HARD_DELETE", False))
        checks.append({
            "id": "database_integrity_guards",
            "severity": "high",
            "status": "pass" if (soft_delete_enforced and not hard_delete_enabled) else "fail",
            "message": (
                "Database integrity guards are enforced"
                if (soft_delete_enforced and not hard_delete_enabled)
                else "Database integrity guards are weakened"
            ),
            "details": {
                "db_enforce_soft_delete": soft_delete_enforced,
                "allow_hard_delete": hard_delete_enabled,
            } if include_details else None,
        })

        severity_rank = {"pass": 0, "warn": 1, "fail": 2}
        max_rank = max((severity_rank.get(check.get("status"), 0) for check in checks), default=0)
        overall_status = "healthy" if max_rank == 0 else "degraded" if max_rank == 1 else "critical"

        security_event_id = _new_security_event_id("governance_compliance_report")
        log_admin_action(
            user_id=int(get_jwt_identity()),
            action="governance_compliance_report_generated",
            entity_type="governance_compliance",
            entity_id=None,
            new_values={
                "overall_status": overall_status,
                "check_count": len(checks),
                "fail_count": len([c for c in checks if c.get("status") == "fail"]),
                "warn_count": len([c for c in checks if c.get("status") == "warn"]),
                "security_event_id": security_event_id,
                "event_type": "admin.governance.compliance.report",
            },
        )

        return jsonify({
            "overall_status": overall_status,
            "checks": checks,
            "generated_at": datetime.utcnow().isoformat(),
            "security_event_id": security_event_id,
            "event_type": "admin.governance.compliance.report",
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@admin_bp.route("/governance/incident-timeline/export", methods=["GET"])
@limiter.limit(lambda: current_app.config.get("INCIDENT_TIMELINE_EXPORT_RATE_LIMIT", "20 per minute"))
@jwt_required()
@admin_required
def export_incident_timeline():
    """Export signed incident timeline bundle for audits and incident response."""
    try:
        current_user = User.query.get(int(get_jwt_identity()))
        include_sensitive = request.args.get("include_sensitive", "false").lower() == "true"
        if include_sensitive and not _is_super_admin(current_user):
            return jsonify({"error": "Sensitive timeline export requires super admin role"}), 403

        if not _has_admin_permission(current_user, "audit:export"):
            return jsonify({"error": "Audit export permission required"}), 403

        governance_error, reason, change_ticket = _require_action_governance("incident_timeline_export")
        if governance_error:
            return governance_error

        since_hours = int(request.args.get("since_hours", 24))
        max_since_hours = int(current_app.config.get("SECURITY_EVENTS_MAX_SINCE_HOURS", 24 * 30))
        max_since_hours = max(1, min(max_since_hours, 24 * 365))
        since_hours = max(1, min(since_hours, max_since_hours))

        max_rows = int(current_app.config.get("INCIDENT_TIMELINE_EXPORT_MAX_ROWS", 5000))
        limit = int(request.args.get("limit", min(1000, max_rows)))
        limit = max(1, min(limit, max_rows))

        start_dt = datetime.utcnow() - timedelta(hours=since_hours)
        entries = (
            AuditLog.query
            .filter(AuditLog.timestamp >= start_dt)
            .order_by(AuditLog.timestamp.asc(), AuditLog.id.asc())
            .limit(max_rows)
            .all()
        )

        timeline = []
        for entry in entries:
            payload = entry.new_values if isinstance(entry.new_values, dict) else {}
            action_name = str(entry.action or "")
            event_type = payload.get("event_type")
            security_event_id = payload.get("security_event_id")
            is_approval = action_name.startswith("approval_")
            is_snapshot = action_name == "governance_policy_snapshot"
            is_security_event = bool(security_event_id or event_type)

            if not (is_security_event or is_approval or is_snapshot):
                continue

            category = "security_event"
            if is_approval:
                category = "approval"
            elif is_snapshot:
                category = "policy_snapshot"

            admin_user = User.query.get(entry.user_id) if entry.user_id else None
            integrity_data = payload.get("_integrity") if isinstance(payload.get("_integrity"), dict) else {}

            timeline.append({
                "id": int(entry.id) if entry.id is not None else None,
                "category": category,
                "action": action_name,
                "event_type": event_type,
                "security_event_id": security_event_id,
                "entity_type": entry.entity_type,
                "entity_id": entry.entity_id,
                "admin_id": entry.user_id,
                "admin_name": admin_user.username if admin_user else "System",
                "reason": payload.get("reason"),
                "change_ticket": payload.get("change_ticket"),
                "changes": payload,
                "integrity_hash": integrity_data.get("hash"),
                "created_at": entry.timestamp.isoformat() if entry.timestamp else None,
                "ip_address": entry.ip_address if include_sensitive else None,
                "user_agent": entry.user_agent if include_sensitive else None,
            })

            if len(timeline) >= limit:
                break

        security_event_id = _new_security_event_id("incident_timeline_export")
        event_type = "admin.governance.incident_timeline.export"
        generated_at = datetime.utcnow().isoformat()
        export_bundle = {
            "version": 1,
            "generated_at": generated_at,
            "generated_by": {
                "admin_id": int(get_jwt_identity()),
                "admin_name": current_user.username if current_user else None,
            },
            "filters": {
                "since_hours": since_hours,
                "limit": limit,
                "include_sensitive": include_sensitive,
            },
            "governance": {
                "reason": reason,
                "change_ticket": change_ticket,
            },
            "security_event_id": security_event_id,
            "event_type": event_type,
            "events": timeline,
            "count": len(timeline),
        }

        json_data = json.dumps(export_bundle, separators=(",", ":"))
        digest, signature = _sign_audit_export(json_data.encode("utf-8"))

        log_admin_action(
            user_id=int(get_jwt_identity()),
            action="incident_timeline_exported",
            entity_type="incident_timeline",
            entity_id=None,
            new_values={
                "since_hours": since_hours,
                "limit": limit,
                "count": len(timeline),
                "include_sensitive": include_sensitive,
                "reason": reason,
                "change_ticket": change_ticket,
                "content_sha256": digest,
                "signature": signature,
                "security_event_id": security_event_id,
                "event_type": event_type,
            },
        )

        filename = f"incident-timeline-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}.json"
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
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@admin_bp.route("/governance/incident-timeline/verify", methods=["POST"])
@limiter.limit(lambda: current_app.config.get("INCIDENT_TIMELINE_VERIFY_RATE_LIMIT", "30 per minute"))
@jwt_required()
@admin_required
def verify_incident_timeline_bundle():
    """Verify signed incident timeline bundle integrity and optional DB authenticity checks."""
    try:
        current_user = User.query.get(int(get_jwt_identity()))
        if not _has_admin_permission(current_user, "audit:export"):
            return jsonify({"error": "Audit export permission required"}), 403

        raw_body = request.get_data(cache=False, as_text=False) or b""
        if not raw_body:
            return jsonify({"error": "Request body must contain incident timeline JSON bundle"}), 400

        provided_digest = (
            request.headers.get("X-Audit-Content-SHA256")
            or request.args.get("content_sha256")
        )
        provided_signature = (
            request.headers.get("X-Audit-Signature")
            or request.args.get("signature")
        )
        if not provided_digest or not provided_signature:
            return jsonify({
                "error": "Missing bundle integrity headers",
                "message": "Provide X-Audit-Content-SHA256 and X-Audit-Signature (or equivalent query parameters)",
            }), 400

        computed_digest = hashlib.sha256(raw_body).hexdigest()
        signing_key = _security_feed_signing_key().encode("utf-8")
        computed_signature = hmac.new(signing_key, raw_body, hashlib.sha256).hexdigest()

        digest_valid = hmac.compare_digest(str(provided_digest), str(computed_digest))
        signature_valid = hmac.compare_digest(str(provided_signature), str(computed_signature))

        try:
            bundle = json.loads(raw_body.decode("utf-8"))
        except Exception:
            return jsonify({"error": "Invalid JSON bundle format"}), 400

        if not isinstance(bundle, dict):
            return jsonify({"error": "Bundle root must be an object"}), 400

        events = bundle.get("events") if isinstance(bundle.get("events"), list) else []
        declared_count = bundle.get("count")
        count_matches = declared_count == len(events)
        event_type_ok = bundle.get("event_type") == "admin.governance.incident_timeline.export"

        check_db = request.args.get("check_db", "false").lower() == "true"
        db_check = {
            "enabled": check_db,
            "checked": 0,
            "matched": 0,
            "mismatches": [],
            "truncated": False,
        }

        if check_db:
            max_events_to_check = int(current_app.config.get("INCIDENT_TIMELINE_VERIFY_MAX_EVENTS", 500))
            max_events_to_check = max(1, min(max_events_to_check, 5000))
            if len(events) > max_events_to_check:
                db_check["truncated"] = True

            for event in events[:max_events_to_check]:
                event_id = event.get("id") if isinstance(event, dict) else None
                if event_id is None:
                    db_check["mismatches"].append({
                        "id": None,
                        "reason": "missing_event_id",
                    })
                    continue

                audit_row = AuditLog.query.get(event_id)
                db_check["checked"] += 1
                if not audit_row:
                    db_check["mismatches"].append({
                        "id": event_id,
                        "reason": "not_found",
                    })
                    continue

                row_payload = audit_row.new_values if isinstance(audit_row.new_values, dict) else {}
                event_action = event.get("action")
                event_security_id = event.get("security_event_id")
                action_match = str(audit_row.action or "") == str(event_action or "")
                security_id_match = True
                if event_security_id is not None:
                    security_id_match = str(row_payload.get("security_event_id")) == str(event_security_id)

                if action_match and security_id_match:
                    db_check["matched"] += 1
                else:
                    db_check["mismatches"].append({
                        "id": event_id,
                        "reason": "content_mismatch",
                        "action_match": action_match,
                        "security_event_id_match": security_id_match,
                    })

            mismatch_count = len(db_check["mismatches"])
            db_check["mismatch_count"] = mismatch_count
            db_check["mismatches"] = db_check["mismatches"][:50]
            db_check["has_more_mismatches"] = mismatch_count > len(db_check["mismatches"])

        cryptographic_valid = digest_valid and signature_valid
        structural_valid = event_type_ok and count_matches
        db_valid = (not check_db) or (db_check.get("mismatch_count", 0) == 0)
        valid = cryptographic_valid and structural_valid and db_valid

        verification_security_event_id = _new_security_event_id("incident_timeline_verify")
        log_admin_action(
            user_id=int(get_jwt_identity()),
            action="incident_timeline_verified",
            entity_type="incident_timeline",
            entity_id=None,
            new_values={
                "valid": valid,
                "cryptographic_valid": cryptographic_valid,
                "digest_valid": digest_valid,
                "signature_valid": signature_valid,
                "structural_valid": structural_valid,
                "db_check_enabled": check_db,
                "db_check_mismatch_count": db_check.get("mismatch_count") if check_db else None,
                "provided_digest": provided_digest,
                "computed_digest": computed_digest,
                "security_event_id": verification_security_event_id,
                "event_type": "admin.governance.incident_timeline.verify",
            },
        )

        return jsonify({
            "valid": valid,
            "cryptographic_valid": cryptographic_valid,
            "digest_valid": digest_valid,
            "signature_valid": signature_valid,
            "structural_valid": structural_valid,
            "event_type_valid": event_type_ok,
            "count_matches": count_matches,
            "declared_count": declared_count,
            "actual_count": len(events),
            "provided_digest": provided_digest,
            "computed_digest": computed_digest,
            "db_check": db_check,
            "security_event_id": verification_security_event_id,
            "event_type": "admin.governance.incident_timeline.verify",
            "verified_at": datetime.utcnow().isoformat(),
        }), 200
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
        governance_error, reason, change_ticket = _require_action_governance("bulk_delete_users", data=data)
        if governance_error:
            return governance_error
        user_ids = sorted(data.get("user_ids", []))

        idempotency_error, idempotency_key = _require_idempotency(
            "bulk_delete_users",
            {"user_ids": user_ids, "reason": reason, "change_ticket": change_ticket},
        )
        if idempotency_error:
            return idempotency_error

        current_admin_id = int(get_jwt_identity())
        approval_error = _require_two_person_approval(
            "bulk_delete_users",
            {"user_ids": user_ids, "reason": reason, "change_ticket": change_ticket},
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
            new_values={
                "count": len(user_ids),
                "reason": reason,
                "change_ticket": change_ticket,
                "security_event_id": security_event_id,
            },
        )

        response_body = {
            "message": f"Deleted {len(user_ids)} users",
            "reason": reason,
            "change_ticket": change_ticket,
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
        governance_error, reason, change_ticket = _require_action_governance("bulk_verify_users", data=data)
        if governance_error:
            return governance_error
        user_ids = data.get("user_ids", [])
        security_event_id = _new_security_event_id("bulk_verify_users")

        idempotency_error, idempotency_key = _require_idempotency(
            "bulk_verify_users",
            {"user_ids": sorted(user_ids), "reason": reason, "change_ticket": change_ticket},
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
                "reason": reason,
                "change_ticket": change_ticket,
                "security_event_id": security_event_id,
                "event_type": "admin.user.bulk_verify",
            },
        )
        
        response_body = {
            "message": f"Verified {len(workers)} workers",
            "reason": reason,
            "change_ticket": change_ticket,
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


@admin_bp.route("/system/database/backups", methods=["GET"])
@limiter.limit(lambda: current_app.config.get("DB_BACKUP_CATALOG_RATE_LIMIT", "60 per minute"))
@jwt_required()
@admin_required
def list_database_backups():
    """List backups with manifest trust and latest verification status."""
    try:
        backup_dir = current_app.config.get("DB_BACKUP_DIR", "instance/backups")
        os.makedirs(backup_dir, exist_ok=True)

        limit = int(request.args.get("limit", 50))
        limit = max(1, min(limit, 200))
        include_runtime_checks = request.args.get("include_runtime_checks", "false").lower() == "true"

        retention_days = max(1, int(current_app.config.get("DB_BACKUP_RETENTION_DAYS", 30)))
        max_files = max(1, int(current_app.config.get("DB_BACKUP_MAX_FILES", 100)))

        holds, _holds_path = _load_backup_holds(backup_dir)
        backup_files = _list_backup_files(backup_dir)

        backup_files.sort(key=lambda path: os.path.getmtime(path), reverse=True)
        backup_files = backup_files[:limit]

        full_backup_list = _list_backup_files(backup_dir)
        prune_candidates, prune_reasons = _compute_backup_prune_plan(
            full_backup_list,
            holds,
            retention_days,
            max_files,
        )
        prune_candidate_names = {os.path.basename(path) for path in prune_candidates}

        names_in_page = {os.path.basename(path) for path in backup_files}
        latest_verification_by_file = {}
        verification_logs = (
            AuditLog.query
            .filter(AuditLog.action == "database_backup_verified")
            .order_by(AuditLog.timestamp.desc(), AuditLog.id.desc())
            .limit(5000)
            .all()
        )
        for log in verification_logs:
            payload = log.new_values if isinstance(log.new_values, dict) else {}
            backup_name = payload.get("backup_file")
            if backup_name not in names_in_page:
                continue
            if backup_name in latest_verification_by_file:
                continue
            latest_verification_by_file[backup_name] = {
                "valid": payload.get("valid"),
                "signature_valid": payload.get("signature_valid"),
                "hash_valid": payload.get("hash_valid"),
                "size_valid": payload.get("size_valid"),
                "verified_at": log.timestamp.isoformat() if log.timestamp else None,
                "security_event_id": payload.get("security_event_id"),
            }

        items = []
        for backup_path in backup_files:
            backup_name = os.path.basename(backup_path)
            manifest_path = f"{backup_path}.manifest.json"
            manifest_name = os.path.basename(manifest_path)

            manifest_exists = os.path.exists(manifest_path)
            manifest_payload = None
            manifest_signature_valid = False
            if manifest_exists:
                try:
                    manifest_payload, manifest_signature_valid = _load_manifest_with_trust(manifest_path)
                except Exception:
                    manifest_payload = None
                    manifest_signature_valid = False

            runtime_sha256 = None
            runtime_hash_matches_manifest = None
            if include_runtime_checks:
                runtime_sha256 = _file_sha256(backup_path)
                declared_sha256 = (manifest_payload or {}).get("backup_sha256")
                runtime_hash_matches_manifest = (
                    bool(declared_sha256)
                    and hmac.compare_digest(str(runtime_sha256), str(declared_sha256))
                )

            latest_verification = latest_verification_by_file.get(backup_name)
            hold_data = holds.get(backup_name) if isinstance(holds, dict) else None

            items.append({
                "backup_file": backup_path,
                "backup_name": backup_name,
                "backup_size_bytes": int(os.path.getsize(backup_path)),
                "created_at": datetime.utcfromtimestamp(os.path.getmtime(backup_path)).isoformat(),
                "manifest_file": manifest_path if manifest_exists else None,
                "manifest_name": manifest_name if manifest_exists else None,
                "manifest_exists": manifest_exists,
                "manifest_trusted": manifest_signature_valid,
                "manifest_backup_sha256": (manifest_payload or {}).get("backup_sha256"),
                "manifest_created_at": (manifest_payload or {}).get("created_at"),
                "is_held": bool(hold_data),
                "hold": hold_data,
                "prune_eligible": backup_name in prune_candidate_names,
                "prune_reasons": prune_reasons.get(backup_name, []),
                "runtime_sha256": runtime_sha256,
                "runtime_hash_matches_manifest": runtime_hash_matches_manifest,
                "latest_verification": latest_verification,
            })

        return jsonify({
            "items": items,
            "count": len(items),
            "limit": limit,
            "backup_dir": os.path.abspath(backup_dir),
            "include_runtime_checks": include_runtime_checks,
            "retention_policy": {
                "retention_days": retention_days,
                "max_files": max_files,
                "held_backups": len(holds) if isinstance(holds, dict) else 0,
                "prune_candidate_count": len(prune_candidate_names),
            },
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@admin_bp.route("/system/database/backups/hold", methods=["POST"])
@limiter.limit(lambda: current_app.config.get("DB_BACKUP_CATALOG_RATE_LIMIT", "60 per minute"))
@jwt_required()
@admin_required
def set_database_backup_hold():
    """Set or remove a protected hold flag for a backup file."""
    try:
        data = request.get_json(silent=True) or {}
        backup_file = data.get("backup_file")
        hold = bool(data.get("hold", True))
        reason = (data.get("reason") or "").strip() or None

        if not backup_file:
            return jsonify({"error": "backup_file is required"}), 400

        backup_dir = current_app.config.get("DB_BACKUP_DIR", "instance/backups")
        os.makedirs(backup_dir, exist_ok=True)

        backup_path = _safe_backup_path(backup_dir, backup_file)
        if not backup_path:
            return jsonify({"error": "Invalid backup_file"}), 400
        if not os.path.exists(backup_path):
            return jsonify({"error": "Backup file not found"}), 404

        holds, holds_path = _load_backup_holds(backup_dir)
        backup_name = os.path.basename(backup_path)
        admin_id = int(get_jwt_identity())

        if hold:
            holds[backup_name] = {
                "held": True,
                "reason": reason,
                "held_by": admin_id,
                "held_at": datetime.utcnow().isoformat(),
            }
            status = "held"
            event_type = "admin.db.backup.hold"
            action = "database_backup_hold_set"
        else:
            holds.pop(backup_name, None)
            status = "released"
            event_type = "admin.db.backup.hold.release"
            action = "database_backup_hold_released"

        _save_backup_holds(holds_path, holds)

        security_event_id = _new_security_event_id("database_backup_hold")
        log_admin_action(
            user_id=admin_id,
            action=action,
            entity_type="database_backup",
            entity_id=None,
            new_values={
                "backup_file": backup_name,
                "status": status,
                "reason": reason,
                "security_event_id": security_event_id,
                "event_type": event_type,
            },
        )

        return jsonify({
            "backup_file": backup_path,
            "status": status,
            "hold": holds.get(backup_name),
            "security_event_id": security_event_id,
            "event_type": event_type,
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@admin_bp.route("/system/database/backups/prune", methods=["POST"])
@limiter.limit(lambda: current_app.config.get("DB_BACKUP_PRUNE_RATE_LIMIT", "10 per hour"))
@jwt_required()
@admin_required
def prune_database_backups():
    """Prune backups by retention policy while preserving held backups."""
    idempotency_key = None
    try:
        confirmation_error = _require_admin_confirmation("database_backup_prune")
        if confirmation_error:
            return confirmation_error

        data = request.get_json(silent=True) or {}
        governance_error, reason, change_ticket = _require_action_governance("database_backup_prune", data=data)
        if governance_error:
            return governance_error
        dry_run = bool(data.get("dry_run", True))

        backup_dir = current_app.config.get("DB_BACKUP_DIR", "instance/backups")
        os.makedirs(backup_dir, exist_ok=True)

        retention_days = max(1, int(current_app.config.get("DB_BACKUP_RETENTION_DAYS", 30)))
        max_files = max(1, int(current_app.config.get("DB_BACKUP_MAX_FILES", 100)))

        holds, _holds_path = _load_backup_holds(backup_dir)
        backup_files = _list_backup_files(backup_dir)
        prune_candidates, prune_reasons = _compute_backup_prune_plan(
            backup_files,
            holds,
            retention_days,
            max_files,
        )

        candidate_names = [os.path.basename(path) for path in prune_candidates]
        action_payload = {
            "dry_run": dry_run,
            "retention_days": retention_days,
            "max_files": max_files,
            "candidates": sorted(candidate_names),
            "reason": reason,
            "change_ticket": change_ticket,
        }

        idempotency_error, idempotency_key = _require_idempotency(
            "database_backup_prune",
            action_payload,
        )
        if idempotency_error:
            return idempotency_error

        current_admin_id = int(get_jwt_identity())
        approval_error = _require_two_person_approval(
            "database_backup_prune",
            action_payload,
            current_admin_id,
        )
        if approval_error:
            return approval_error

        deleted = []
        skipped = []
        errors = []
        for backup_path in prune_candidates:
            backup_name = os.path.basename(backup_path)
            manifest_path = f"{backup_path}.manifest.json"
            if dry_run:
                skipped.append({"backup_file": backup_name, "reason": "dry_run"})
                continue
            try:
                if os.path.exists(backup_path):
                    os.remove(backup_path)
                if os.path.exists(manifest_path):
                    os.remove(manifest_path)
                deleted.append(backup_name)
            except Exception as exc:
                errors.append({"backup_file": backup_name, "error": str(exc)})

        security_event_id = _new_security_event_id("database_backup_prune")
        event_type = "admin.db.backup.prune"
        log_admin_action(
            user_id=current_admin_id,
            action="database_backup_pruned",
            entity_type="database_backup",
            entity_id=None,
            new_values={
                "dry_run": dry_run,
                "retention_days": retention_days,
                "max_files": max_files,
                "candidate_count": len(prune_candidates),
                "deleted_count": len(deleted),
                "error_count": len(errors),
                "reason": reason,
                "change_ticket": change_ticket,
                "security_event_id": security_event_id,
                "event_type": event_type,
            },
        )

        response_body = {
            "dry_run": dry_run,
            "retention_policy": {
                "retention_days": retention_days,
                "max_files": max_files,
            },
            "candidate_count": len(prune_candidates),
            "reason": reason,
            "change_ticket": change_ticket,
            "candidates": [
                {
                    "backup_file": os.path.basename(path),
                    "reasons": prune_reasons.get(os.path.basename(path), []),
                }
                for path in prune_candidates
            ],
            "deleted": deleted,
            "skipped": skipped,
            "errors": errors,
            "security_event_id": security_event_id,
            "event_type": event_type,
        }

        _finalize_idempotency(idempotency_key, response_body, 200)
        return jsonify(response_body), 200
    except Exception as e:
        _clear_idempotency(idempotency_key)
        return jsonify({"error": str(e)}), 500
