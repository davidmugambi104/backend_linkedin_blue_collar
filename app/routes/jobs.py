# ----- FILE: backend/app/routes/jobs.py -----
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import desc
from datetime import datetime
from ..extensions import db
from ..models import User, Job, Application, Skill, Employer, Worker, WorkerSkill
from ..schemas import JobSchema, JobCreateSchema, JobUpdateSchema, JobSearchSchema
from ..utils.permissions import employer_required, worker_required, admin_required
from ..utils.geo import calculate_distance
from ..models.job import JobStatus

jobs_bp = Blueprint('jobs', __name__)


@jobs_bp.route('/', methods=['GET'])
def get_jobs():
    """Get all jobs (with optional filters). Public endpoint."""
    schema = JobSearchSchema()
    filters = schema.load(request.args, partial=True)

    query = Job.query

    # Filter by status (default to open jobs)
    if 'status' in filters:
        query = query.filter(Job.status == JobStatus(filters['status']))
    else:
        query = query.filter(Job.status == JobStatus.OPEN)

    # Filter by title
    if 'title' in filters:
        query = query.filter(Job.title.ilike(f'%{filters["title"]}%'))

    # Filter by skill
    if 'skill_id' in filters:
        query = query.filter(Job.required_skill_id == filters['skill_id'])

    # Filter by employer
    if 'employer_id' in filters:
        query = query.filter(Job.employer_id == filters['employer_id'])

    # Filter by pay
    if 'pay_min' in filters:
        query = query.filter(Job.pay_min >= filters['pay_min'])
    if 'pay_max' in filters:
        query = query.filter(Job.pay_max <= filters['pay_max'])

    # Location filtering
    if 'location_lat' in filters and 'location_lng' in filters and 'radius_km' in filters:
        center_lat = filters['location_lat']
        center_lng = filters['location_lng']
        radius = filters['radius_km']

        jobs = query.all()
        nearby_jobs = []
        for job in jobs:
            if job.location_lat and job.location_lng:
                distance = calculate_distance(center_lat, center_lng, job.location_lat, job.location_lng)
                if distance <= radius:
                    job_dict = job.to_dict()
                    job_dict['distance_km'] = distance
                    job_dict['employer'] = job.employer.to_dict()
                    skill = Skill.query.get(job.required_skill_id)
                    job_dict['required_skill'] = skill.to_dict() if skill else None
                    nearby_jobs.append(job_dict)
        return jsonify(nearby_jobs), 200

    # If no location filter
    jobs = query.order_by(desc(Job.created_at)).all()
    result = []
    for job in jobs:
        job_dict = job.to_dict()
        job_dict['employer'] = job.employer.to_dict()
        skill = Skill.query.get(job.required_skill_id)
        job_dict['required_skill'] = skill.to_dict() if skill else None
        result.append(job_dict)

    return jsonify(result), 200


@jobs_bp.route('/<int:job_id>', methods=['GET'])
def get_job(job_id):
    """Get a specific job by ID. Public endpoint."""
    job = Job.query.get_or_404(job_id)

    job_dict = job.to_dict()
    job_dict['employer'] = job.employer.to_dict()
    skill = Skill.query.get(job.required_skill_id)
    job_dict['required_skill'] = skill.to_dict() if skill else None

    # Count applications
    job_dict['application_count'] = Application.query.filter_by(job_id=job_id).count()

    return jsonify(job_dict), 200


@jobs_bp.route('/<int:job_id>/apply', methods=['POST'])
@jwt_required()
@worker_required
def apply_to_job(job_id):
    """Worker applies to a job."""
    current_user_id = get_jwt_identity()
    worker = Worker.query.filter_by(user_id=current_user_id).first_or_404()
    job = Job.query.get_or_404(job_id)

    if job.status != JobStatus.OPEN:
        return jsonify({'error': 'Job is not open for applications'}), 400

    existing_application = Application.query.filter_by(job_id=job_id, worker_id=worker.id).first()
    if existing_application:
        return jsonify({'error': 'You have already applied to this job'}), 400

    data = request.json
    application = Application(
        job_id=job_id,
        worker_id=worker.id,
        cover_letter=data.get('cover_letter', ''),
        proposed_rate=data.get('proposed_rate')
    )

    db.session.add(application)
    db.session.commit()

    return jsonify(application.to_dict()), 201


@jobs_bp.route('/<int:job_id>/applications', methods=['GET'])
@jwt_required()
def get_job_applications(job_id):
    """Get applications for a job (employer/admin only)."""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    job = Job.query.get_or_404(job_id)

    if current_user.role.value != 'admin' and job.employer.user_id != current_user_id:
        return jsonify({'error': 'You do not have permission to view applications for this job'}), 403

    applications = Application.query.filter_by(job_id=job_id).all()
    result = []
    for app in applications:
        app_dict = app.to_dict()
        worker = Worker.query.get(app.worker_id)
        if worker:
            app_dict['worker'] = worker.to_dict()
            skills = db.session.query(Skill, WorkerSkill.proficiency_level).join(
                WorkerSkill, WorkerSkill.skill_id == Skill.id
            ).filter(WorkerSkill.worker_id == worker.id).all()
            app_dict['worker']['skills'] = [
                {'id': s.id, 'name': s.name, 'category': s.category, 'proficiency_level': prof}
                for s, prof in skills
            ]
        result.append(app_dict)

    return jsonify(result), 200


@jobs_bp.route('/<int:job_id>/complete', methods=['PUT'])
@jwt_required()
@employer_required
def mark_job_completed(job_id):
    """Employer marks a job as completed."""
    current_user_id = get_jwt_identity()
    employer = Employer.query.filter_by(user_id=current_user_id).first_or_404()
    job = Job.query.filter_by(id=job_id, employer_id=employer.id).first_or_404()

    if job.status != JobStatus.IN_PROGRESS:
        return jsonify({'error': 'Job must be in progress to mark as completed'}), 400

    job.status = JobStatus.COMPLETED
    db.session.commit()

    return jsonify(job.to_dict()), 200


@jobs_bp.route('/<int:job_id>/cancel', methods=['PUT'])
@jwt_required()
def cancel_job(job_id):
    """Cancel a job (employer/admin only)."""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    job = Job.query.get_or_404(job_id)

    if current_user.role.value != 'admin' and job.employer.user_id != current_user_id:
        return jsonify({'error': 'You do not have permission to cancel this job'}), 403

    job.status = JobStatus.CANCELLED
    db.session.commit()

    return jsonify(job.to_dict()), 200


@jobs_bp.route('/expired', methods=['GET'])
@jwt_required()
@admin_required
def get_expired_jobs():
    """Get expired jobs (admin only)."""
    expired_jobs = Job.query.filter(
        Job.expiration_date < datetime.utcnow(),
        Job.status == JobStatus.OPEN
    ).all()
    return jsonify([job.to_dict() for job in expired_jobs]), 200


@jobs_bp.route('/expired/close', methods=['POST'])
@jwt_required()
@admin_required
def close_expired_jobs():
    """Close all expired jobs (admin only)."""
    expired_jobs = Job.query.filter(
        Job.expiration_date < datetime.utcnow(),
        Job.status == JobStatus.OPEN
    ).all()

    for job in expired_jobs:
        job.status = JobStatus.EXPIRED

    db.session.commit()
    return jsonify({'message': f'Closed {len(expired_jobs)} expired jobs'}), 200

# ----- END FILE -----
