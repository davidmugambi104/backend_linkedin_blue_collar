"""
Admin Operations - Release 2: Operations Core
- User management (suspend, reactivate, reset verification)
- Job/application moderation
- Verification queue management
- Dispute workflow
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from sqlalchemy import func, or_, and_
from app.extensions import db
from app.models import User, Worker, Employer, Job, Application, Verification, Dispute
from app.models.user import UserRole, AdminRole
from app.models.job import JobStatus
from app.models.verification import VerificationStatus
from app.models.dispute import DisputeStatus
from app.utils.admin_permissions import require_permission, log_admin_action, get_current_admin
from app.models.login_log import AuditLog

admin_ops_bp = Blueprint("admin_ops", __name__)


# ============================================
# USER MANAGEMENT
# ============================================

@admin_ops_bp.route("/users/<int:user_id>/suspend", methods=["POST"])
@jwt_required()
@require_permission("users:suspend")
def suspend_user(user_id):
    """Suspend a user account"""
    admin = get_current_admin()
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    if user.role == UserRole.ADMIN:
        return jsonify({"error": "Cannot suspend admin users"}), 403
    
    data = request.json or {}
    reason = data.get("reason", "No reason provided")
    
    # Store old state
    old_values = {"is_active": user.is_active}
    
    user.is_active = False
    db.session.commit()
    
    # Audit log
    log_admin_action(
        admin, 
        "user_suspended", 
        "user", 
        user_id,
        old_values=old_values,
        new_values={"is_active": False, "reason": reason}
    )
    
    return jsonify({
        "message": "User suspended successfully",
        "user": user.to_dict()
    })


@admin_ops_bp.route("/users/<int:user_id>/reactivate", methods=["POST"])
@jwt_required()
@require_permission("users:suspend")
def reactivate_user(user_id):
    """Reactivate a suspended user account"""
    admin = get_current_admin()
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    old_values = {"is_active": user.is_active}
    
    user.is_active = True
    db.session.commit()
    
    log_admin_action(
        admin,
        "user_reactivated",
        "user",
        user_id,
        old_values=old_values,
        new_values={"is_active": True}
    )
    
    return jsonify({
        "message": "User reactivated successfully",
        "user": user.to_dict()
    })


@admin_ops_bp.route("/users/<int:user_id>/reset-verification", methods=["POST"])
@jwt_required()
@require_permission("users:reset_verification")
def reset_verification(user_id):
    """Reset verification status for a user"""
    admin = get_current_admin()
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    # Reset based on role
    if user.role == UserRole.WORKER:
        worker = Worker.query.filter_by(user_id=user_id).first()
        if worker:
            old_values = {"is_verified": worker.is_verified, "verification_level": worker.verification_level}
            worker.is_verified = False
            worker.verification_level = 0
            log_admin_action(
                admin,
                "worker_verification_reset",
                "worker",
                worker.id,
                old_values=old_values,
                new_values={"is_verified": False, "verification_level": 0}
            )
    
    elif user.role == UserRole.EMPLOYER:
        employer = Employer.query.filter_by(user_id=user_id).first()
        if employer:
            old_values = {"is_verified": employer.is_verified}
            employer.is_verified = False
            log_admin_action(
                admin,
                "employer_verification_reset",
                "employer",
                employer.id,
                old_values=old_values,
                new_values={"is_verified": False}
            )
    
    user.is_phone_verified = False
    db.session.commit()
    
    return jsonify({
        "message": "Verification reset successfully",
        "user": user.to_dict()
    })


# ============================================
# JOB MODERATION
# ============================================

@admin_ops_bp.route("/jobs/<int:job_id>/flag", methods=["POST"])
@jwt_required()
@require_permission("jobs:moderate")
def flag_job(job_id):
    """Flag a job for review"""
    admin = get_current_admin()
    
    job = Job.query.get(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404
    
    data = request.json or {}
    reason = data.get("reason", "No reason provided")
    
    old_values = {"is_flagged": getattr(job, 'is_flagged', False)}
    job.is_flagged = True
    job.flag_reason = reason
    db.session.commit()
    
    log_admin_action(
        admin,
        "job_flagged",
        "job",
        job_id,
        old_values=old_values,
        new_values={"is_flagged": True, "reason": reason}
    )
    
    return jsonify({"message": "Job flagged for review", "job": {"id": job.id, "is_flagged": True}})


@admin_ops_bp.route("/jobs/<int:job_id>/unpublish", methods=["POST"])
@jwt_required()
@require_permission("jobs:unpublish")
def unpublish_job(job_id):
    """Unpublish a job"""
    admin = get_current_admin()
    
    job = Job.query.get(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404
    
    data = request.json or {}
    reason = data.get("reason", "No reason provided")
    
    old_values = {"status": job.status.value}
    job.status = JobStatus.CANCELLED
    db.session.commit()
    
    log_admin_action(
        admin,
        "job_unpublished",
        "job",
        job_id,
        old_values=old_values,
        new_values={"status": "cancelled", "reason": reason}
    )
    
    return jsonify({"message": "Job unpublished", "job": {"id": job.id, "status": job.status.value}})


@admin_ops_bp.route("/jobs/<int:job_id>/restore", methods=["POST"])
@jwt_required()
@require_permission("jobs:moderate")
def restore_job(job_id):
    """Restore a previously unpublished job"""
    admin = get_current_admin()
    
    job = Job.query.get(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404
    
    old_values = {"status": job.status.value, "is_flagged": getattr(job, 'is_flagged', False)}
    job.status = JobStatus.OPEN
    job.is_flagged = False
    job.flag_reason = None
    db.session.commit()
    
    log_admin_action(
        admin,
        "job_restored",
        "job",
        job_id,
        old_values=old_values,
        new_values={"status": "open", "is_flagged": False}
    )
    
    return jsonify({"message": "Job restored", "job": {"id": job.id, "status": job.status.value}})


# ============================================
# VERIFICATION QUEUE
# ============================================

@admin_ops_bp.route("/verifications/queue", methods=["GET"])
@jwt_required()
@require_permission("verifications:view")
def get_verification_queue():
    """Get pending verifications"""
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    verification_type = request.args.get("type")
    
    query = Verification.query.filter_by(status=VerificationStatus.PENDING)
    
    if verification_type:
        query = query.filter_by(verification_type=verification_type)
    
    query = query.order_by(Verification.created_at.asc())
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        "verifications": [{
            "id": v.id,
            "user_id": v.user_id,
            "verification_type": v.verification_type,
            "status": v.status.value,
            "created_at": v.created_at.isoformat() if v.created_at else None,
            "user": {
                "id": v.user.id,
                "username": v.user.username,
                "email": v.user.email,
                "role": v.user.role.value,
            }
        } for v in pagination.items],
        "pagination": {
            "page": page,
            "per_page": per_page,
            "total": pagination.total,
            "pages": pagination.pages,
        }
    })


@admin_ops_bp.route("/verifications/<int:verification_id>/approve", methods=["POST"])
@jwt_required()
@require_permission("verifications:approve")
def approve_verification(verification_id):
    """Approve a verification"""
    admin = get_current_admin()
    
    verification = Verification.query.get(verification_id)
    if not verification:
        return jsonify({"error": "Verification not found"}), 404
    
    data = request.json or {}
    notes = data.get("notes", "")
    
    old_values = {"status": verification.status.value}
    verification.status = VerificationStatus.APPROVED
    verification.reviewed_at = datetime.utcnow()
    verification.review_notes = notes
    
    # Update user verification status
    user = verification.user
    if user.role == UserRole.WORKER:
        worker = Worker.query.filter_by(user_id=user.id).first()
        if worker:
            worker.is_verified = True
            worker.verification_level = min((worker.verification_level or 0) + 1, 3)
    
    elif user.role == UserRole.EMPLOYER:
        employer = Employer.query.filter_by(user_id=user.id).first()
        if employer:
            employer.is_verified = True
    
    user.is_phone_verified = True
    db.session.commit()
    
    log_admin_action(
        admin,
        "verification_approved",
        "verification",
        verification_id,
        old_values=old_values,
        new_values={"status": "approved", "notes": notes}
    )
    
    return jsonify({
        "message": "Verification approved",
        "verification": {"id": verification.id, "status": "approved"}
    })


@admin_ops_bp.route("/verifications/<int:verification_id>/reject", methods=["POST"])
@jwt_required()
@require_permission("verifications:reject")
def reject_verification(verification_id):
    """Reject a verification"""
    admin = get_current_admin()
    
    verification = Verification.query.get(verification_id)
    if not verification:
        return jsonify({"error": "Verification not found"}), 404
    
    data = request.json or {}
    reason = data.get("reason", "Verification rejected")
    
    old_values = {"status": verification.status.value}
    verification.status = VerificationStatus.REJECTED
    verification.reviewed_at = datetime.utcnow()
    verification.review_notes = reason
    
    db.session.commit()
    
    log_admin_action(
        admin,
        "verification_rejected",
        "verification",
        verification_id,
        old_values=old_values,
        new_values={"status": "rejected", "reason": reason}
    )
    
    return jsonify({
        "message": "Verification rejected",
        "verification": {"id": verification.id, "status": "rejected"}
    })


@admin_ops_bp.route("/verifications/bulk", methods=["POST"])
@jwt_required()
@require_permission("verifications:bulk")
def bulk_verification():
    """Bulk approve or reject verifications"""
    admin = get_current_admin()
    
    data = request.json or {}
    verification_ids = data.get("ids", [])
    action = data.get("action", "approve")  # approve or reject
    reason = data.get("reason", "")
    
    if not verification_ids:
        return jsonify({"error": "No verification IDs provided"}), 400
    
    results = {"approved": 0, "rejected": 0, "failed": 0}
    
    for vid in verification_ids:
        verification = Verification.query.get(vid)
        if not verification:
            results["failed"] += 1
            continue
        
        if action == "approve":
            verification.status = VerificationStatus.APPROVED
            results["approved"] += 1
        else:
            verification.status = VerificationStatus.REJECTED
            results["rejected"] += 1
        
        verification.reviewed_at = datetime.utcnow()
        verification.review_notes = reason
    
    db.session.commit()
    
    log_admin_action(
        admin,
        f"verifications_bulk_{action}",
        "verification",
        None,
        new_values={"ids": verification_ids, "action": action, "results": results}
    )
    
    return jsonify({
        "message": f"Bulk {action} completed",
        "results": results
    })


# ============================================
# DISPUTE MANAGEMENT
# ============================================

@admin_ops_bp.route("/disputes/queue", methods=["GET"])
@jwt_required()
@require_permission("disputes:view")
def get_dispute_queue():
    """Get disputes by status"""
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    status = request.args.get("status")
    priority = request.args.get("priority")
    
    query = Dispute.query
    
    if status:
        query = query.filter_by(status=DisputeStatus[status.upper()])
    
    if priority:
        query = query.filter_by(priority=priority)
    
    # Default: show open disputes first
    query = query.order_by(
        Dispute.status.asc(),
        Dispute.priority.desc(),
        Dispute.created_at.asc()
    )
    
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        "disputes": [{
            "id": d.id,
            "contract_id": d.contract_id,
            "dispute_type": d.dispute_type,
            "status": d.status.value,
            "priority": d.priority,
            "created_at": d.created_at.isoformat() if d.created_at else None,
        } for d in pagination.items],
        "pagination": {
            "page": page,
            "per_page": per_page,
            "total": pagination.total,
            "pages": pagination.pages,
        }
    })


@admin_ops_bp.route("/disputes/<int:dispute_id>/assign", methods=["POST"])
@jwt_required()
@require_permission("disputes:assign")
def assign_dispute(dispute_id):
    """Assign dispute to an admin"""
    admin = get_current_admin()
    
    dispute = Dispute.query.get(dispute_id)
    if not dispute:
        return jsonify({"error": "Dispute not found"}), 404
    
    data = request.json or {}
    assigned_to = data.get("assigned_to")  # Admin user ID
    
    old_values = {"assigned_to": dispute.assigned_to}
    dispute.assigned_to = assigned_to
    db.session.commit()
    
    log_admin_action(
        admin,
        "dispute_assigned",
        "dispute",
        dispute_id,
        old_values=old_values,
        new_values={"assigned_to": assigned_to}
    )
    
    return jsonify({"message": "Dispute assigned", "dispute": {"id": dispute.id, "assigned_to": assigned_to}})


@admin_ops_bp.route("/disputes/<int:dispute_id>/resolve", methods=["POST"])
@jwt_required()
@require_permission("disputes:resolve")
def resolve_dispute(dispute_id):
    """Resolve a dispute"""
    admin = get_current_admin()
    
    dispute = Dispute.query.get(dispute_id)
    if not dispute:
        return jsonify({"error": "Dispute not found"}), 404
    
    data = request.json or {}
    resolution = data.get("resolution", {})
    resolution_notes = data.get("notes", "")
    
    old_values = {"status": dispute.status.value}
    dispute.status = DisputeStatus.RESOLVED
    dispute.resolution = resolution
    dispute.resolved_at = datetime.utcnow()
    db.session.commit()
    
    log_admin_action(
        admin,
        "dispute_resolved",
        "dispute",
        dispute_id,
        old_values=old_values,
        new_values={"status": "resolved", "resolution": resolution, "notes": resolution_notes}
    )
    
    return jsonify({"message": "Dispute resolved", "dispute": {"id": dispute.id, "status": "resolved"}})
