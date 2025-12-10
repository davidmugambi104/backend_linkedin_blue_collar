# ----- FILE: backend/app/routes/employers.py -----
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func, or_
from ..extensions import db
from ..models import User, Employer, Job, Application, Review, Worker, Skill, WorkerSkill
from ..schemas import EmployerSchema, EmployerUpdateSchema, JobCreateSchema, JobUpdateSchema, JobSearchSchema
from ..utils.permissions import employer_required, user_is_owner_or_admin
from ..utils.geo import calculate_distance
from datetime import datetime

employers_bp = Blueprint('employers', __name__)


@employers_bp.route('/profile', methods=['GET'])
@jwt_required()
@employer_required
def get_employer_profile():
    current_user_id = get_jwt_identity()
    employer = Employer.query.filter_by(user_id=current_user_id).first_or_404()
    return jsonify(employer.to_dict()), 200


@employers_bp.route('/profile', methods=['PUT'])
@jwt_required()
@employer_required
def update_employer_profile():
    current_user_id = get_jwt_identity()
    employer = Employer.query.filter_by(user_id=current_user_id).first_or_404()

    schema = EmployerUpdateSchema()
    data = schema.load(request.json, partial=True)

    for key, value in data.items():
        setattr(employer, key, value)

    db.session.commit()
    return jsonify(employer.to_dict()), 200


@employers_bp.route('/jobs', methods=['GET'])
@jwt_required()
@employer_required
def get_employer_jobs():
    current_user_id = get_jwt_identity()
    employer = Employer.query.filter_by(user_id=current_user_id).first_or_404()

    jobs = Job.query.filter_by(employer_id=employer.id).all()
    return jsonify([job.to_dict() for job in jobs]), 200


@employers_bp.route('/jobs', methods=['POST'])
@jwt_required()
@employer_required
def create_job():
    current_user_id = get_jwt_identity()
    employer = Employer.query.filter_by(user_id=current_user_id).first_or_404()

    schema = JobCreateSchema()
    data = schema.load(request.json)

    job = Job(
        employer_id=employer.id,
        title=data['title'],
        description=data['description'],
        required_skill_id=data['required_skill_id'],
        location_lat=data.get('location_lat'),
        location_lng=data.get('location_lng'),
        address=data.get('address'),
        pay_min=data.get('pay_min'),
        pay_max=data.get('pay_max'),
        pay_type=data.get('pay_type'),
        expiration_date=data.get('expiration_date')
    )

    db.session.add(job)
    db.session.commit()

    return jsonify(job.to_dict()), 201


@employers_bp.route('/jobs/<int:job_id>', methods=['GET'])
@jwt_required()
def get_job(job_id):
    job = Job.query.get_or_404(job_id)

    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)

    if current_user.role.value != 'admin' and job.employer.user_id != current_user_id:
        return jsonify({'error': 'You do not have permission to view this job'}), 403

    job_dict = job.to_dict()
    job_dict['employer'] = job.employer.to_dict()
    skill = Skill.query.get(job.required_skill_id)
    job_dict['required_skill'] = skill.to_dict() if skill else None

    return jsonify(job_dict), 200


@employers_bp.route('/jobs/<int:job_id>', methods=['PUT'])
@jwt_required()
@employer_required
def update_job(job_id):
    current_user_id = get_jwt_identity()
    employer = Employer.query.filter_by(user_id=current_user_id).first_or_404()

    job = Job.query.filter_by(id=job_id, employer_id=employer.id).first_or_404()

    schema = JobUpdateSchema()
    data = schema.load(request.json, partial=True)

    for key, value in data.items():
        setattr(job, key, value)

    db.session.commit()
    return jsonify(job.to_dict()), 200


@employers_bp.route('/jobs/<int:job_id>', methods=['DELETE'])
@jwt_required()
@employer_required
def delete_job(job_id):
    current_user_id = get_jwt_identity()
    employer = Employer.query.filter_by(user_id=current_user_id).first_or_404()

    job = Job.query.filter_by(id=job_id, employer_id=employer.id).first_or_404()
    db.session.delete(job)
    db.session.commit()

    return jsonify({'message': 'Job deleted successfully'}), 200


@employers_bp.route('/jobs/<int:job_id>/applications', methods=['GET'])
@jwt_required()
@employer_required
def get_job_applications(job_id):
    current_user_id = get_jwt_identity()
    employer = Employer.query.filter_by(user_id=current_user_id).first_or_404()

    job = Job.query.filter_by(id=job_id, employer_id=employer.id).first_or_404()
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
                {'id': skill.id, 'name': skill.name, 'category': skill.category, 'proficiency_level': prof}
                for skill, prof in skills
            ]
        result.append(app_dict)

    return jsonify(result), 200


@employers_bp.route('/applications/<int:application_id>', methods=['PUT'])
@jwt_required()
@employer_required
def update_application_status(application_id):
    current_user_id = get_jwt_identity()
    employer = Employer.query.filter_by(user_id=current_user_id).first_or_404()

    application = Application.query.get_or_404(application_id)

    job = Job.query.filter_by(id=application.job_id, employer_id=employer.id).first()
    if not job:
        return jsonify({'error': 'Application not found or access denied'}), 404

    data = request.json
    if 'status' not in data:
        return jsonify({'error': 'Missing status field'}), 400

    from ..models.application import ApplicationStatus
    try:
        status = ApplicationStatus(data['status'])
    except ValueError:
        return jsonify({'error': 'Invalid status value'}), 400

    application.status = status
    db.session.commit()

    return jsonify(application.to_dict()), 200


@employers_bp.route('/workers/search', methods=['GET'])
@jwt_required()
@employer_required
def search_workers():
    schema = JobSearchSchema()
    filters = schema.load(request.args, partial=True)

    query = Worker.query

    if 'skill_id' in filters:
        skill_id = filters['skill_id']
        worker_ids = [ws.worker_id for ws in WorkerSkill.query.filter_by(skill_id=skill_id).all()]
        query = query.filter(Worker.id.in_(worker_ids))

    if 'location_lat' in filters and 'location_lng' in filters and 'radius_km' in filters:
        employer_lat = filters['location_lat']
        employer_lng = filters['location_lng']
        radius = filters['radius_km']

        workers = query.all()
        nearby_workers = []
        for worker in workers:
            if worker.location_lat and worker.location_lng:
                distance = calculate_distance(
                    employer_lat, employer_lng,
                    worker.location_lat, worker.location_lng
                )
                if distance <= radius:
                    worker_dict = worker.to_dict()
                    worker_dict['distance_km'] = distance
                    skills = db.session.query(Skill, WorkerSkill.proficiency_level).join(
                        WorkerSkill, WorkerSkill.skill_id == Skill.id
                    ).filter(WorkerSkill.worker_id == worker.id).all()
                    worker_dict['skills'] = [
                        {'id': skill.id, 'name': skill.name, 'category': skill.category, 'proficiency_level': prof}
                        for skill, prof in skills
                    ]
                    nearby_workers.append(worker_dict)
        return jsonify(nearby_workers), 200

    workers = query.all()
    result = []
    for worker in workers:
        worker_dict = worker.to_dict()
        skills = db.session.query(Skill, WorkerSkill.proficiency_level).join(
            WorkerSkill, WorkerSkill.skill_id == Skill.id
        ).filter(WorkerSkill.worker_id == worker.id).all()
        worker_dict['skills'] = [
            {'id': skill.id, 'name': skill.name, 'category': skill.category, 'proficiency_level': prof}
            for skill, prof in skills
        ]
        result.append(worker_dict)

    return jsonify(result), 200


@employers_bp.route('/stats', methods=['GET'])
@jwt_required()
@employer_required
def get_employer_stats():
    current_user_id = get_jwt_identity()
    employer = Employer.query.filter_by(user_id=current_user_id).first_or_404()

    jobs = Job.query.filter_by(employer_id=employer.id).all()
    job_status_counts = {}
    for job in jobs:
        status = job.status.value
        job_status_counts[status] = job_status_counts.get(status, 0) + 1

    applications = Application.query.join(Job).filter(Job.employer_id == employer.id).all()
    application_status_counts = {}
    for app in applications:
        status = app.status.value
        application_status_counts[status] = application_status_counts.get(status, 0) + 1

    reviews_given = Review.query.filter_by(employer_id=employer.id).count()

    return jsonify({
        'total_jobs': len(jobs),
        'job_status_counts': job_status_counts,
        'total_applications': len(applications),
        'application_status_counts': application_status_counts,
        'reviews_given': reviews_given
    }), 200

# ----- END FILE -----
