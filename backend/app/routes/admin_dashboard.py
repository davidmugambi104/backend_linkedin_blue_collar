"""
Admin Dashboard API Routes
- KPI endpoints for dashboard
- Platform analytics
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from sqlalchemy import func, or_, and_
from app.extensions import db
from app.models import User, Worker, Employer, Job, Application, Payment, Verification, Dispute
from app.models.user import UserRole, AdminRole
from app.models.job import JobStatus
from app.models.payment import PaymentStatus
from app.models.verification import VerificationStatus
from app.models.dispute import DisputeStatus
from app.utils.admin_permissions import require_permission, get_user_permissions, log_admin_action
from app.models.login_log import AuditLog
from decimal import Decimal

admin_dashboard_bp = Blueprint("admin_dashboard", __name__)


def get_current_admin():
    """Get current admin user"""
    user_id = get_jwt_identity()
    return User.query.get(int(user_id))


@admin_dashboard_bp.route("/kpis", methods=["GET"])
@jwt_required()
@require_permission("admin:view")
def get_kpis():
    """Get core KPIs for dashboard"""
    admin = get_current_admin()
    
    # Date filters
    today = datetime.utcnow().date()
    today_start = datetime.combine(today, datetime.min.time())
    week_ago = datetime.utcnow() - timedelta(days=7)
    month_ago = datetime.utcnow() - timedelta(days=30)
    
    # === USER METRICS ===
    total_users = User.query.count()
    active_users = User.query.filter_by(is_active=True).count()
    workers_count = Worker.query.count()
    employers_count = Employer.query.count()
    verified_workers = Worker.query.filter_by(is_verified=True).count()
    
    new_users_today = User.query.filter(User.created_at >= today_start).count()
    new_users_week = User.query.filter(User.created_at >= week_ago).count()
    new_users_month = User.query.filter(User.created_at >= month_ago).count()
    
    # === JOB METRICS ===
    total_jobs = Job.query.count()
    active_jobs = Job.query.filter(
        or_(Job.status == JobStatus.OPEN, Job.status == JobStatus.IN_PROGRESS)
    ).count()
    completed_jobs = Job.query.filter_by(status=JobStatus.COMPLETED).count()
    jobs_today = Job.query.filter(Job.created_at >= today_start).count()
    
    # === APPLICATION METRICS ===
    total_applications = Application.query.count()
    applications_today = Application.query.filter(Application.created_at >= today_start).count()
    
    # === VERIFICATION METRICS ===
    pending_verifications = Verification.query.filter_by(status=VerificationStatus.PENDING).count()
    verifications_week = Verification.query.filter(Verification.created_at >= week_ago).count()
    
    # === DISPUTE METRICS ===
    open_disputes = Dispute.query.filter(
        or_(Dispute.status == DisputeStatus.PENDING, Dispute.status == DisputeStatus.INVESTIGATING)
    ).count()
    disputes_week = Dispute.query.filter(Dispute.created_at >= week_ago).count()
    
    # === PAYMENT METRICS ===
    # Total payment volume
    total_payment_volume = db.session.query(func.sum(Payment.amount)).scalar() or 0
    payments_today = db.session.query(func.sum(Payment.amount)).filter(
        Payment.created_at >= today_start
    ).scalar() or 0
    payments_week = db.session.query(func.sum(Payment.amount)).filter(
        Payment.created_at >= week_ago
    ).scalar() or 0
    
    # Completed payments
    completed_payments = Payment.query.filter_by(status=PaymentStatus.COMPLETED).count()
    pending_payments = Payment.query.filter_by(status=PaymentStatus.PENDING).count()
    failed_payments = Payment.query.filter_by(status=PaymentStatus.FAILED).count()
    
    return jsonify({
        # Users
        "users": {
            "total": total_users,
            "active": active_users,
            "workers": workers_count,
            "employers": employers_count,
            "verified_workers": verified_workers,
            "new_today": new_users_today,
            "new_week": new_users_week,
            "new_month": new_users_month,
        },
        # Jobs
        "jobs": {
            "total": total_jobs,
            "active": active_jobs,
            "completed": completed_jobs,
            "new_today": jobs_today,
        },
        # Applications
        "applications": {
            "total": total_applications,
            "new_today": applications_today,
        },
        # Verifications
        "verifications": {
            "pending": pending_verifications,
            "this_week": verifications_week,
        },
        # Disputes
        "disputes": {
            "open": open_disputes,
            "this_week": disputes_week,
        },
        # Payments
        "payments": {
            "total_volume": float(total_payment_volume),
            "volume_today": float(payments_today),
            "volume_week": float(payments_week),
            "completed": completed_payments,
            "pending": pending_payments,
            "failed": failed_payments,
        },
        # Platform health
        "platform_health": {
            "verification_rate": round((verified_workers / workers_count * 100), 1) if workers_count > 0 else 0,
            "job_completion_rate": round((completed_jobs / total_jobs * 100), 1) if total_jobs > 0 else 0,
            "application_success_rate": 0,  # Would need more complex query
        },
        "generated_at": datetime.utcnow().isoformat(),
    })


@admin_dashboard_bp.route("/activity-feed", methods=["GET"])
@jwt_required()
@require_permission("admin:view")
def get_activity_feed():
    """Get recent activity across platform"""
    limit = request.args.get("limit", 20, type=int)
    
    # Recent signups
    recent_users = User.query.order_by(User.created_at.desc()).limit(5).all()
    
    # Recent jobs
    recent_jobs = Job.query.order_by(Job.created_at.desc()).limit(5).all()
    
    # Recent applications
    recent_applications = Application.query.order_by(Application.created_at.desc()).limit(5).all()
    
    # Recent verifications
    recent_verifications = Verification.query.order_by(Verification.created_at.desc()).limit(5).all()
    
    # Recent disputes
    recent_disputes = Dispute.query.order_by(Dispute.created_at.desc()).limit(5).all()
    
    return jsonify({
        "users": [u.to_dict() for u in recent_users],
        "jobs": [{
            "id": j.id,
            "title": j.title,
            "employer_id": j.employer_id,
            "status": j.status.value,
            "created_at": j.created_at.isoformat() if j.created_at else None,
        } for j in recent_jobs],
        "applications": [{
            "id": a.id,
            "job_id": a.job_id,
            "worker_id": a.worker_id,
            "status": a.status,
            "created_at": a.created_at.isoformat() if a.created_at else None,
        } for a in recent_applications],
        "verifications": [{
            "id": v.id,
            "user_id": v.user_id,
            "verification_type": v.verification_type,
            "status": v.status.value if hasattr(v.status, 'value') else v.status,
            "created_at": v.created_at.isoformat() if v.created_at else None,
        } for v in recent_verifications],
        "disputes": [{
            "id": d.id,
            "contract_id": d.contract_id,
            "dispute_type": d.dispute_type,
            "status": d.status.value if hasattr(d.status, 'value') else d.status,
            "created_at": d.created_at.isoformat() if d.created_at else None,
        } for d in recent_disputes],
    })


@admin_dashboard_bp.route("/audit-log", methods=["GET"])
@jwt_required()
@require_permission("audit:view")
def get_audit_log():
    """Get audit log entries"""
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 50, type=int)
    action = request.args.get("action")
    user_id = request.args.get("user_id", type=int)
    
    query = AuditLog.query
    
    if action:
        query = query.filter(AuditLog.action.like(f"%{action}%"))
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)
    
    # Order by most recent
    query = query.order_by(AuditLog.timestamp.desc())
    
    # Paginate
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        "audit_logs": [log.to_dict() for log in pagination.items],
        "pagination": {
            "page": page,
            "per_page": per_page,
            "total": pagination.total,
            "pages": pagination.pages,
            "has_next": pagination.has_next,
            "has_prev": pagination.has_prev,
        }
    })


@admin_dashboard_bp.route("/permissions", methods=["GET"])
@jwt_required()
@require_permission("admin:view")
def get_my_permissions():
    """Get current admin's permissions"""
    admin = get_current_admin()
    permissions = get_user_permissions(admin)
    
    return jsonify({
        "user_id": admin.id,
        "username": admin.username,
        "admin_role": admin.admin_role.value if admin.admin_role else None,
        "permissions": permissions,
        "all_permissions": [
            "users:view", "users:edit", "users:suspend", "users:reset_verification",
            "jobs:view", "jobs:moderate", "jobs:unpublish",
            "applications:view", "applications:moderate",
            "verifications:view", "verifications:approve", "verifications:reject", "verifications:bulk",
            "disputes:view", "disputes:resolve", "disputes:assign",
            "payments:view", "payments:refund", "payments:reconcile",
            "finance:view", "finance:export",
            "fraud:view", "fraud:investigate", "fraud:block",
            "admin:view", "admin:edit",
            "audit:view", "audit:export",
            "settings:view", "settings:edit",
        ]
    })


@admin_dashboard_bp.route("/permissions/check", methods=["POST"])
@jwt_required()
def check_permissions():
    """Check if current admin has required permissions"""
    admin = get_current_admin()
    permissions = get_user_permissions(admin)
    
    required = request.json.get("permissions", [])
    
    missing = [p for p in required if p not in permissions]
    
    return jsonify({
        "has_permissions": len(missing) == 0,
        "missing": missing,
    })
