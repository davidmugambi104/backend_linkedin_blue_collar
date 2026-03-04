from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..extensions import db
from ..models import Worker, WorkerSkill, Skill, Job, Application, Review
from ..schemas import WorkerUpdateSchema, WorkerSkillSchema
from ..utils.permissions import worker_required
from ..utils.geo import calculate_distance
from ..utils.helpers import get_current_user_id
from ..services.matching_service import MatchingService

workers_bp = Blueprint("workers", __name__)


@workers_bp.route("", methods=["GET"])
def list_workers():
    workers = Worker.query.all()
    result = []
    for worker in workers:
        worker_dict = worker.to_dict()
        skills = (
            db.session.query(Skill, WorkerSkill.proficiency_level)
            .join(WorkerSkill, WorkerSkill.skill_id == Skill.id)
            .filter(WorkerSkill.worker_id == worker.id)
            .all()
        )
        worker_dict["skills"] = [
            {
                "id": skill.id,
                "skill_id": skill.id,
                "name": skill.name,
                "category": skill.category,
                "proficiency_level": prof,
            }
            for skill, prof in skills
        ]
        result.append(worker_dict)

    return jsonify(result), 200


@workers_bp.route("/profile", methods=["GET"])
@jwt_required()
@worker_required
def get_worker_profile():
    current_user_id = get_current_user_id()
    worker = Worker.query.filter_by(user_id=current_user_id).first_or_404()

    skills = (
        db.session.query(Skill, WorkerSkill.proficiency_level)
        .join(WorkerSkill, WorkerSkill.skill_id == Skill.id)
        .filter(WorkerSkill.worker_id == worker.id)
        .all()
    )

    worker_dict = worker.to_dict()
    worker_dict["skills"] = [
        {
            "id": skill.id,
            "name": skill.name,
            "category": skill.category,
            "proficiency_level": prof,
        }
        for skill, prof in skills
    ]

    return jsonify(worker_dict), 200


@workers_bp.route("/profile", methods=["PUT"])
@jwt_required()
@worker_required
def update_worker_profile():
    current_user_id = get_current_user_id()
    worker = Worker.query.filter_by(user_id=current_user_id).first_or_404()

    schema = WorkerUpdateSchema()
    data = schema.load(request.json, partial=True)

    for key, value in data.items():
        setattr(worker, key, value)

    db.session.commit()
    return jsonify(worker.to_dict()), 200


@workers_bp.route("/skills", methods=["GET"])
@jwt_required()
@worker_required
def get_worker_skills():
    current_user_id = get_current_user_id()
    worker = Worker.query.filter_by(user_id=current_user_id).first_or_404()

    skills = (
        db.session.query(Skill, WorkerSkill.proficiency_level)
        .join(WorkerSkill, WorkerSkill.skill_id == Skill.id)
        .filter(WorkerSkill.worker_id == worker.id)
        .all()
    )

    return (
        jsonify(
            [
                {
                    "id": skill.id,
                    "name": skill.name,
                    "category": skill.category,
                    "proficiency_level": prof,
                }
                for skill, prof in skills
            ]
        ),
        200,
    )


@workers_bp.route("/skills", methods=["POST"])
@jwt_required()
@worker_required
def add_worker_skill():
    current_user_id = get_current_user_id()
    worker = Worker.query.filter_by(user_id=current_user_id).first_or_404()

    schema = WorkerSkillSchema()
    data = schema.load(request.json)

    # Validate skill exists
    from ..models import Skill
    if not Skill.query.get(data["skill_id"]):
        return jsonify({"error": "Skill does not exist"}), 400

    existing = WorkerSkill.query.filter_by(
        worker_id=worker.id, skill_id=data["skill_id"]
    ).first()
    if existing:
        return jsonify({"error": "Skill already added for this worker"}), 400

    worker_skill = WorkerSkill(
        worker_id=worker.id,
        skill_id=data["skill_id"],
        proficiency_level=data.get("proficiency_level", 1),
    )

    db.session.add(worker_skill)
    db.session.commit()

    return jsonify(worker_skill.to_dict()), 201


@workers_bp.route("/skills/<int:skill_id>", methods=["PUT"])
@jwt_required()
@worker_required
def update_worker_skill(skill_id):
    current_user_id = get_current_user_id()
    worker = Worker.query.filter_by(user_id=current_user_id).first_or_404()

    worker_skill = WorkerSkill.query.filter_by(
        worker_id=worker.id, skill_id=skill_id
    ).first_or_404()

    schema = WorkerSkillSchema(partial=True)
    data = schema.load(request.json)

    # Validate skill exists if provided
    if "skill_id" in data:
        from ..models import Skill
        if not Skill.query.get(data["skill_id"]):
            return jsonify({"error": "Skill does not exist"}), 400

    if "proficiency_level" in data:
        worker_skill.proficiency_level = data["proficiency_level"]

    db.session.commit()
    return jsonify(worker_skill.to_dict()), 200


@workers_bp.route("/skills/<int:skill_id>", methods=["DELETE"])
@jwt_required()
@worker_required
def delete_worker_skill(skill_id):
    current_user_id = get_current_user_id()
    worker = Worker.query.filter_by(user_id=current_user_id).first_or_404()

    worker_skill = WorkerSkill.query.filter_by(
        worker_id=worker.id, skill_id=skill_id
    ).first_or_404()
    db.session.delete(worker_skill)
    db.session.commit()

    return jsonify({"message": "Skill removed successfully"}), 200


@workers_bp.route("/jobs/recommended", methods=["GET"])
@jwt_required()
@worker_required
def get_recommended_jobs():
    current_user_id = get_current_user_id()
    worker = Worker.query.filter_by(user_id=current_user_id).first_or_404()

    worker_skill_ids = [
        ws.skill_id for ws in WorkerSkill.query.filter_by(worker_id=worker.id).all()
    ]

    from ..models.job import JobStatus

    query = Job.query.filter(Job.status == JobStatus.OPEN)

    if worker_skill_ids:
        query = query.filter(Job.required_skill_id.in_(worker_skill_ids))

    if worker.location_lat and worker.location_lng:
        jobs = query.all()
        nearby_jobs = []
        for job in jobs:
            if job.location_lat and job.location_lng:
                distance = calculate_distance(
                    worker.location_lat,
                    worker.location_lng,
                    job.location_lat,
                    job.location_lng,
                )
                if distance <= 50:
                    job_dict = job.to_dict()
                    job_dict["distance_km"] = distance
                    nearby_jobs.append(job_dict)
        return jsonify(nearby_jobs), 200

    jobs = query.all()
    return jsonify([job.to_dict() for job in jobs]), 200


@workers_bp.route("/applications", methods=["GET"])
@jwt_required()
@worker_required
def get_worker_applications():
    current_user_id = get_current_user_id()
    worker = Worker.query.filter_by(user_id=current_user_id).first_or_404()

    applications = Application.query.filter_by(worker_id=worker.id).all()
    result = []
    for app in applications:
        app_dict = app.to_dict()
        job = Job.query.get(app.job_id)
        if job:
            app_dict["job"] = job.to_dict()
        result.append(app_dict)

    return jsonify(result), 200


@workers_bp.route("/reviews", methods=["GET"])
@jwt_required()
@worker_required
def get_worker_reviews():
    current_user_id = get_current_user_id()
    worker = Worker.query.filter_by(user_id=current_user_id).first_or_404()

    reviews = Review.query.filter_by(worker_id=worker.id).all()
    result = []
    for review in reviews:
        review_dict = review.to_dict()
        employer = review.employer
        if employer:
            review_dict["employer"] = employer.to_dict()
        result.append(review_dict)

    return jsonify(result), 200


@workers_bp.route("/stats", methods=["GET"])
@jwt_required()
@worker_required
def get_worker_stats():
    current_user_id = get_current_user_id()
    worker = Worker.query.filter_by(user_id=current_user_id).first_or_404()

    applications = Application.query.filter_by(worker_id=worker.id).all()
    status_counts = {}
    for app in applications:
        status = app.status.value
        status_counts[status] = status_counts.get(status, 0) + 1

    avg_rating = worker.average_rating

    completed_count = 0
    for app in applications:
        if app.status.value == "accepted":
            job = Job.query.get(app.job_id)
            if job and job.status.value == "completed":
                completed_count += 1

    return (
        jsonify(
            {
                "total_applications": len(applications),
                "application_status_counts": status_counts,
                "average_rating": avg_rating,
                "completed_jobs": completed_count,
                "verification_status": worker.is_verified,
                "verification_score": worker.verification_score,
            }
        ),
        200,
    )


@workers_bp.route("/search", methods=["GET"])
def search_workers():
    """Search workers with advanced filters - Public endpoint."""
    filters = {}
    
    # Parse query params
    if request.args.get("skill_ids"):
        filters["skill_ids"] = [int(x) for x in request.args.get("skill_ids").split(",")]
    if request.args.get("availability_status"):
        filters["availability_status"] = request.args.get("availability_status")
    if request.args.get("county"):
        filters["county"] = request.args.get("county")
    if request.args.get("min_rating"):
        filters["min_rating"] = float(request.args.get("min_rating"))
    if request.args.get("verified_only") == "true":
        filters["verified_only"] = True
    if request.args.get("max_rate"):
        filters["max_rate"] = float(request.args.get("max_rate"))
    if request.args.get("location_lat") and request.args.get("location_lng"):
        filters["location_lat"] = float(request.args.get("location_lat"))
        filters["location_lng"] = float(request.args.get("location_lng"))
    if request.args.get("max_distance_km"):
        filters["max_distance_km"] = float(request.args.get("max_distance_km"))
    
    results = MatchingService.search_workers(filters)
    return jsonify(results), 200


@workers_bp.route("/match/jobs/<int:job_id>", methods=["GET"])
@jwt_required()
@worker_required
def match_worker_to_job(job_id):
    """Get match score for current worker to a specific job."""
    current_user_id = get_current_user_id()
    worker = Worker.query.filter_by(user_id=current_user_id).first_or_404()
    
    from ..models.job import JobStatus
    job = Job.query.get(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404
    
    if job.status != JobStatus.OPEN:
        return jsonify({"error": "Job is not open"}), 400
    
    # Get worker skill for this job
    worker_skill = WorkerSkill.query.filter_by(
        worker_id=worker.id, skill_id=job.required_skill_id
    ).first()
    
    score = MatchingService._calculate_worker_match_score(worker, job, worker_skill)
    
    # Calculate distance if available
    distance = None
    if (worker.location_lat and worker.location_lng and 
        job.location_lat and job.location_lng):
        distance = calculate_distance(
            worker.location_lat, worker.location_lng,
            job.location_lat, job.location_lng
        )
    
    return jsonify({
        "match_score": round(score, 3),
        "distance_km": round(distance, 2) if distance else None,
        "job": job.to_dict(),
        "worker": worker.to_dict()
    }), 200
