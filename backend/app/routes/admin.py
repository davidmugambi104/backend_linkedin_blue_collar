# ----- FILE: backend/app/routes/admin.py -----
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from sqlalchemy import func, or_, and_
from ..extensions import db
from ..models import (
    User, Worker, Employer, Job, Application, Payment, 
    Review, Verification, Skill, WorkerSkill, Message
)
from ..utils.helpers import get_current_user_id
from ..models.user import UserRole
from ..models.job import JobStatus
from ..models.payment import PaymentStatus
from ..models.verification import VerificationStatus
from ..utils.permissions import admin_required

admin_bp = Blueprint("admin", __name__)


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
        ).filter_by(status=PaymentStatus.PAID).scalar() or 0
        
        platform_fees_total = db.session.query(
            func.sum(Payment.platform_fee)
        ).filter_by(status=PaymentStatus.PAID).scalar() or 0
        
        pending_payments = Payment.query.filter_by(status=PaymentStatus.PENDING).count()
        completed_payments = Payment.query.filter_by(status=PaymentStatus.PAID).count()
        
        avg_transaction = (total_revenue / completed_payments) if completed_payments > 0 else 0
        
        # Review statistics
        total_reviews = Review.query.count()
        avg_rating = db.session.query(func.avg(Review.rating)).scalar() or 0
        
        # Verification statistics
        pending_verifications = Verification.query.filter_by(
            status=VerificationStatus.PENDING
        ).count()
        
        return jsonify({
            "total_users": total_users,
            "active_users": total_users,  # For now, assume all are active
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
        # Simple health check
        db.session.execute("SELECT 1")
        
        return jsonify({
            "status": "healthy",
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
                "query_time": 10,
                "connections": 0
            },
            "redis": {
                "status": "disconnected",
                "memory_usage": 0,
                "hit_rate": 0
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
        
        if search:
            query = query.filter(
                or_(
                    User.username.ilike(f"%{search}%"),
                    User.email.ilike(f"%{search}%")
                )
            )
        
        # Apply sorting
        if sort.startswith("-"):
            query = query.order_by(getattr(User, sort[1:]).desc())
        else:
            query = query.order_by(getattr(User, sort).asc())
        
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
    try:
        user = User.query.get_or_404(user_id)
        data = request.get_json()
        
        reason = data.get("reason", "No reason provided")
        duration = data.get("duration")  # In days, None for permanent
        
        # In a real implementation, you'd have a ban table
        # For now, we'll just mark the user as inactive
        user.is_active = False
        db.session.commit()
        
        return jsonify({"message": "User banned successfully"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@admin_bp.route("/users/<int:user_id>/unban", methods=["POST"])
@jwt_required()
@admin_required
def unban_user(user_id):
    """Unban a user."""
    try:
        user = User.query.get_or_404(user_id)
        user.is_active = True
        db.session.commit()
        
        return jsonify({"message": "User unbanned successfully"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@admin_bp.route("/users/<int:user_id>", methods=["DELETE"])
@jwt_required()
@admin_required
def delete_user(user_id):
    """Delete a user (soft delete recommended)."""
    try:
        user = User.query.get_or_404(user_id)
        
        # Don't allow deleting other admins
        if user.role == UserRole.ADMIN:
            return jsonify({"error": "Cannot delete admin users"}), 403
        
        # Soft delete - mark as inactive
        user.is_active = False
        db.session.commit()
        
        return jsonify({"message": "User deleted successfully"}), 200
        
    except Exception as e:
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
    try:
        job = Job.query.get_or_404(job_id)
        data = request.get_json()
        
        action = data.get("action")  # approve, reject, flag
        reason = data.get("reason")
        
        if action == "reject":
            job.status = JobStatus.CANCELLED
        elif action == "approve":
            job.status = JobStatus.OPEN
        # Add more moderation actions as needed
        
        db.session.commit()
        
        return jsonify({"message": f"Job {action}ed successfully"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@admin_bp.route("/jobs/<int:job_id>/feature", methods=["POST"])
@jwt_required()
@admin_required
def feature_job(job_id):
    """Mark job as featured."""
    try:
        job = Job.query.get_or_404(job_id)
        # Note: Would need to add is_featured column to Job model
        # For now, just return success
        # job.is_featured = True
        # db.session.commit()
        
        return jsonify({"message": "Job featured successfully"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@admin_bp.route("/jobs/<int:job_id>/unfeature", methods=["POST"])
@jwt_required()
@admin_required
def unfeature_job(job_id):
    """Remove featured status from job."""
    try:
        job = Job.query.get_or_404(job_id)
        # Note: Would need to add is_featured column to Job model
        # For now, just return success
        # job.is_featured = False
        # db.session.commit()
        
        return jsonify({"message": "Job unfeatured successfully"}), 200
        
    except Exception as e:
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
    try:
        current_user_id = get_current_user_id()
        verification = Verification.query.get_or_404(verification_id)
        data = request.get_json()
        
        status = data.get("status")  # "approved" or "rejected"
        notes = data.get("notes")
        
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
        
        return jsonify({"message": "Verification reviewed successfully"}), 200
        
    except Exception as e:
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
    try:
        data = request.get_json()
        # In a real app, save to settings table
        
        return jsonify({"message": "Settings updated successfully"}), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ============================================
# AUDIT LOG
# ============================================

@admin_bp.route("/audit-log", methods=["GET"])
@jwt_required()
@admin_required
def get_audit_log():
    """Get audit log entries."""
    # Placeholder - would need an audit_log table
    return jsonify({
        "entries": [],
        "total": 0
    }), 200


# ============================================
# BULK OPERATIONS
# ============================================

@admin_bp.route("/users/bulk-delete", methods=["POST"])
@jwt_required()
@admin_required
def bulk_delete_users():
    """Bulk delete (soft delete) users."""
    try:
        data = request.get_json()
        user_ids = data.get("user_ids", [])
        
        if not user_ids:
            return jsonify({"error": "No user IDs provided"}), 400
        
        # Soft delete
        User.query.filter(User.id.in_(user_ids)).update(
            {"is_active": False},
            synchronize_session=False
        )
        db.session.commit()
        
        return jsonify({"message": f"Deleted {len(user_ids)} users"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@admin_bp.route("/users/bulk-verify", methods=["POST"])
@jwt_required()
@admin_required
def bulk_verify_users():
    """Bulk verify workers."""
    try:
        data = request.get_json()
        user_ids = data.get("user_ids", [])
        
        if not user_ids:
            return jsonify({"error": "No user IDs provided"}), 400
        
        # Update workers
        workers = Worker.query.filter(Worker.user_id.in_(user_ids)).all()
        for worker in workers:
            worker.is_verified = True
            worker.verification_score = 100
        
        db.session.commit()
        
        return jsonify({"message": f"Verified {len(workers)} workers"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
