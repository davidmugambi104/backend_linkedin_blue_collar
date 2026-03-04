# ----- FILE: backend/app/services/analytics_service.py -----
from sqlalchemy import func, and_, or_
from sqlalchemy.sql import expression
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from ..extensions import db
from ..models import User, Worker, Employer, Job, Application, Payment, Review
from ..models.job import JobStatus
from ..models.payment import PaymentStatus


class AnalyticsService:
    """Service for generating analytics and insights."""

    # === Platform Overview ===
    
    @staticmethod
    def get_platform_stats() -> Dict[str, Any]:
        """Get overall platform statistics."""
        now = datetime.utcnow()
        thirty_days_ago = now - timedelta(days=30)
        
        # User counts
        total_users = User.query.count()
        total_workers = Worker.query.count()
        total_employers = Employer.query.count()
        
        # Job counts
        total_jobs = Job.query.count()
        open_jobs = Job.query.filter_by(status=JobStatus.OPEN).count()
        completed_jobs = Job.query.filter_by(status=JobStatus.COMPLETED).count()
        
        # Application stats
        total_applications = Application.query.count()
        pending_applications = Application.query.filter_by(status="pending").count()
        
        # Payment stats
        total_payments = Payment.query.count()
        total_volume = db.session.query(func.sum(Payment.amount)).filter(
            Payment.status == PaymentStatus.COMPLETED
        ).scalar() or 0
        
        # Ratings
        avg_worker_rating = db.session.query(func.avg(Worker.average_rating)).scalar() or 0
        
        return {
            "users": {
                "total": total_users,
                "workers": total_workers,
                "employers": total_employers,
            },
            "jobs": {
                "total": total_jobs,
                "open": open_jobs,
                "completed": completed_jobs,
            },
            "applications": {
                "total": total_applications,
                "pending": pending_applications,
            },
            "payments": {
                "total_transactions": total_payments,
                "total_volume": float(total_volume),
            },
            "ratings": {
                "average_worker_rating": round(float(avg_worker_rating), 2),
            }
        }

    @staticmethod
    def get_growth_metrics(days: int = 30) -> Dict[str, Any]:
        """Get growth metrics for the specified period."""
        now = datetime.utcnow()
        period_start = now - timedelta(days=days)
        
        # New users by day
        users_by_day = db.session.query(
            func.date(User.created_at).label('date'),
            func.count(User.id).label('count')
        ).filter(
            User.created_at >= period_start
        ).group_by(func.date(User.created_at)).all()
        
        # New jobs by day
        jobs_by_day = db.session.query(
            func.date(Job.created_at).label('date'),
            func.count(Job.id).label('count')
        ).filter(
            Job.created_at >= period_start
        ).group_by(func.date(Job.created_at)).all()
        
        # New workers by day
        workers_by_day = db.session.query(
            func.date(Worker.created_at).label('date'),
            func.count(Worker.id).label('count')
        ).filter(
            Worker.created_at >= period_start
        ).group_by(func.date(Worker.created_at)).all()
        
        return {
            "users": [{"date": str(d), "count": c} for d, c in users_by_day],
            "jobs": [{"date": str(d), "count": c} for d, c in jobs_by_day],
            "workers": [{"date": str(d), "count": c} for d, c in workers_by_day],
        }

    # === Worker Analytics ===
    
    @staticmethod
    def get_worker_analytics(worker_id: int) -> Dict[str, Any]:
        """Get analytics for a specific worker."""
        worker = Worker.query.get(worker_id)
        if not worker:
            return {"error": "Worker not found"}
        
        # Job applications
        applications = Application.query.filter_by(worker_id=worker_id).all()
        total_applied = len(applications)
        accepted = len([a for a in applications if a.status == "accepted"])
        rejected = len([a for a in applications if a.status == "rejected"])
        pending = len([a for a in applications if a.status == "pending"])
        
        # Jobs completed
        completed_jobs = Application.query.filter_by(
            worker_id=worker_id, status="completed"
        ).count()
        
        # Earnings
        total_earnings = db.session.query(func.sum(Payment.amount)).join(
            Job, Job.id == Payment.job_id
        ).filter(
            Job.worker_id == worker_id,
            Payment.status == PaymentStatus.COMPLETED
        ).scalar() or 0
        
        # Rating breakdown
        reviews = Review.query.filter_by(worker_id=worker_id).all()
        rating_distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        for review in reviews:
            rating_distribution[review.rating] = rating_distribution.get(review.rating, 0) + 1
        
        return {
            "profile": {
                "full_name": worker.full_name,
                "average_rating": worker.average_rating,
                "total_ratings": worker.total_ratings,
                "is_verified": worker.is_verified,
                "verification_score": worker.verification_score,
                "availability_status": worker.availability_status,
            },
            "applications": {
                "total": total_applied,
                "accepted": accepted,
                "rejected": rejected,
                "pending": pending,
                "acceptance_rate": round(accepted / total_applied * 100, 1) if total_applied > 0 else 0,
            },
            "jobs": {
                "completed": completed_jobs,
            },
            "earnings": {
                "total": float(total_earnings),
            },
            "ratings": {
                "distribution": rating_distribution,
            }
        }

    @staticmethod
    def get_worker_ranking(worker_id: int, skill_id: Optional[int] = None) -> Dict[str, Any]:
        """Get worker's ranking among other workers."""
        query = Worker.query
        
        if skill_id:
            from ..models import WorkerSkill
            worker_ids = [ws.worker_id for ws in WorkerSkill.query.filter_by(skill_id=skill_id).all()]
            query = query.filter(Worker.id.in_(worker_ids))
        
        # Rank by rating
        by_rating = query.order_by(Worker.average_rating.desc()).all()
        rating_rank = next((i + 1 for i, w in enumerate(by_rating) if w.id == worker_id), None)
        
        # Rank by verification score
        by_verification = query.order_by(Worker.verification_score.desc()).all()
        verification_rank = next((i + 1 for i, w in enumerate(by_verification) if w.id == worker_id), None)
        
        # Rank by completed jobs
        by_completed = query.order_by(Worker.total_ratings.desc()).all()
        completed_rank = next((i + 1 for i, w in enumerate(by_completed) if w.id == worker_id), None)
        
        return {
            "rating_rank": rating_rank,
            "verification_rank": verification_rank,
            "completed_jobs_rank": completed_rank,
            "total_workers": query.count(),
        }

    # === Employer Analytics ===
    
    @staticmethod
    def get_employer_analytics(employer_id: int) -> Dict[str, Any]:
        """Get analytics for a specific employer."""
        employer = Employer.query.get(employer_id)
        if not employer:
            return {"error": "Employer not found"}
        
        # Jobs posted
        jobs = Job.query.filter_by(employer_id=employer_id).all()
        total_jobs = len(jobs)
        open_jobs = len([j for j in jobs if j.status == JobStatus.OPEN])
        completed_jobs = len([j for j in jobs if j.status == JobStatus.COMPLETED])
        
        # Applications received
        job_ids = [j.id for j in jobs]
        total_applications = Application.query.filter(
            Application.job_id.in_(job_ids)
        ).count() if job_ids else 0
        
        # Spending
        total_spent = db.session.query(func.sum(Payment.amount)).filter(
            Payment.employer_id == employer_id,
            Payment.status == PaymentStatus.COMPLETED
        ).scalar() or 0
        
        return {
            "profile": {
                "company_name": employer.company_name,
            },
            "jobs": {
                "total": total_jobs,
                "open": open_jobs,
                "completed": completed_jobs,
            },
            "applications": {
                "total": total_applications,
            },
            "spending": {
                "total": float(total_spent),
            }
        }

    # === Job Analytics ===
    
    @staticmethod
    def get_job_analytics(job_id: int) -> Dict[str, Any]:
        """Get analytics for a specific job."""
        job = Job.query.get(job_id)
        if not job:
            return {"error": "Job not found"}
        
        applications = Application.query.filter_by(job_id=job_id).all()
        total_applications = len(applications)
        
        # Application timeline
        app_dates = [a.created_at for a in applications if a.created_at]
        
        # Status breakdown
        status_counts = {}
        for app in applications:
            status_counts[app.status] = status_counts.get(app.status, 0) + 1
        
        return {
            "job": {
                "title": job.title,
                "status": job.status.value,
                "pay_range": f"{job.pay_min}-{job.pay_max}" if job.pay_min and job.pay_max else None,
            },
            "applications": {
                "total": total_applications,
                "by_status": status_counts,
            }
        }

    # === Skills Analytics ===
    
    @staticmethod
    def get_skills_analytics() -> Dict[str, Any]:
        """Get analytics about skills on the platform."""
        from ..models import Skill, WorkerSkill
        
        # Skills by demand (most requested in jobs)
        skills_in_jobs = db.session.query(
            Job.required_skill_id,
            func.count(Job.id).label('job_count')
        ).filter(
            Job.status == JobStatus.OPEN
        ).group_by(Job.required_skill_id).order_by(func.count(Job.id).desc()).limit(10).all()
        
        # Skills by supply (most workers have)
        skills_in_workers = db.session.query(
            WorkerSkill.skill_id,
            func.count(WorkerSkill.worker_id).label('worker_count')
        ).group_by(WorkerSkill.skill_id).order_by(func.count(WorkerSkill.worker_id).desc()).limit(10).all()
        
        # Get skill names
        all_skills = {s.id: s.name for s in Skill.query.all()}
        
        demand = [
            {"skill_id": sid, "skill_name": all_skills.get(sid, "Unknown"), "job_count": count}
            for sid, count in skills_in_jobs
        ]
        
        supply = [
            {"skill_id": sid, "skill_name": all_skills.get(sid, "Unknown"), "worker_count": count}
            for sid, count in skills_in_workers
        ]
        
        return {
            "demand": demand,
            "supply": supply,
        }

    # === Location Analytics ===
    
    @staticmethod
    def get_location_analytics() -> Dict[str, Any]:
        """Get analytics by location."""
        # Workers by county
        workers_by_county = db.session.query(
            Worker.county,
            func.count(Worker.id).label('count')
        ).filter(
            Worker.county.isnot(None)
        ).group_by(Worker.county).all()
        
        # Jobs by county
        jobs_by_county = db.session.query(
            Job.county,
            func.count(Job.id).label('count')
        ).filter(
            Job.county.isnot(None)
        ).group_by(Job.county).all()
        
        return {
            "workers_by_county": [{"county": c or "Unknown", "count": n} for c, n in workers_by_county],
            "jobs_by_county": [{"county": c or "Unknown", "count": n} for c, n in jobs_by_county],
        }


analytics_service = AnalyticsService()
