# ----- FILE: backend/app/routes/applications.py -----
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..extensions import db
from ..models import User, Application, Job, Worker, Employer, Skill, WorkerSkill
from ..schemas import (
    ApplicationUpdateSchema,
)
from ..utils.helpers import get_current_user_id

applications_bp = Blueprint("applications", __name__)


@applications_bp.route("/", methods=["GET"])
@jwt_required()
def get_applications():
    """Get applications (with filters based on role)."""
    current_user_id = get_current_user_id()
    current_user = User.query.get(current_user_id)

    query = Application.query

    if current_user.role.value == "worker":
        worker = Worker.query.filter_by(user_id=current_user_id).first()
        if not worker:
            return jsonify({"error": "Worker profile not found"}), 404
        query = query.filter_by(worker_id=worker.id)

    elif current_user.role.value == "employer":
        employer = Employer.query.filter_by(user_id=current_user_id).first()
        if not employer:
            return jsonify({"error": "Employer profile not found"}), 404
        job_ids = [job.id for job in Job.query.filter_by(employer_id=employer.id).all()]
        if not job_ids:
            return jsonify([]), 200
        query = query.filter(Application.job_id.in_(job_ids))

    # Admin can see all applications, no additional filter

    status = request.args.get("status")
    if status:
        from ..models.application import ApplicationStatus

        try:
            query = query.filter(Application.status == ApplicationStatus(status))
        except ValueError:
            return jsonify({"error": "Invalid status value"}), 400

    applications = query.order_by(Application.created_at.desc()).all()

    result = []
    for app in applications:
        app_dict = app.to_dict()
        job = Job.query.get(app.job_id)
        if job:
            app_dict["job"] = job.to_dict()
            skill = Skill.query.get(job.required_skill_id)
            app_dict["job"]["required_skill"] = skill.to_dict() if skill else None

        worker = Worker.query.get(app.worker_id)
        if worker:
            app_dict["worker"] = worker.to_dict()
            skills = (
                db.session.query(Skill, WorkerSkill.proficiency_level)
                .join(WorkerSkill, WorkerSkill.skill_id == Skill.id)
                .filter(WorkerSkill.worker_id == worker.id)
                .all()
            )
            app_dict["worker"]["skills"] = [
                {
                    "id": skill.id,
                    "name": skill.name,
                    "category": skill.category,
                    "proficiency_level": prof,
                }
                for skill, prof in skills
            ]
        result.append(app_dict)

    return jsonify(result), 200


@applications_bp.route("/<int:application_id>", methods=["GET"])
@jwt_required()
def get_application(application_id):
    """Get a specific application."""
    current_user_id = get_current_user_id()
    current_user = User.query.get(current_user_id)

    application = Application.query.get_or_404(application_id)

    if current_user.role.value == "worker":
        worker = Worker.query.filter_by(user_id=current_user_id).first()
        if not worker or application.worker_id != worker.id:
            return (
                jsonify(
                    {"error": "You do not have permission to view this application"}
                ),
                403,
            )

    elif current_user.role.value == "employer":
        employer = Employer.query.filter_by(user_id=current_user_id).first()
        if not employer:
            return jsonify({"error": "Employer profile not found"}), 404
        job = Job.query.get(application.job_id)
        if not job or job.employer_id != employer.id:
            return (
                jsonify(
                    {"error": "You do not have permission to view this application"}
                ),
                403,
            )

    app_dict = application.to_dict()

    job = Job.query.get(application.job_id)
    if job:
        app_dict["job"] = job.to_dict()
        skill = Skill.query.get(job.required_skill_id)
        app_dict["job"]["required_skill"] = skill.to_dict() if skill else None
        app_dict["job"]["employer"] = job.employer.to_dict()

    worker = Worker.query.get(application.worker_id)
    if worker:
        app_dict["worker"] = worker.to_dict()
        skills = (
            db.session.query(Skill, WorkerSkill.proficiency_level)
            .join(WorkerSkill, WorkerSkill.skill_id == Skill.id)
            .filter(WorkerSkill.worker_id == worker.id)
            .all()
        )
        app_dict["worker"]["skills"] = [
            {
                "id": skill.id,
                "name": skill.name,
                "category": skill.category,
                "proficiency_level": prof,
            }
            for skill, prof in skills
        ]

    return jsonify(app_dict), 200


@applications_bp.route("/<int:application_id>", methods=["PUT"])
@jwt_required()
def update_application(application_id):
    """Update an application (status update by employer or worker)."""
    current_user_id = get_current_user_id()
    current_user = User.query.get(current_user_id)

    application = Application.query.get_or_404(application_id)
    schema = ApplicationUpdateSchema()
    data = schema.load(request.json, partial=True)

    if current_user.role.value == "employer":
        employer = Employer.query.filter_by(user_id=current_user_id).first()
        if not employer:
            return jsonify({"error": "Employer profile not found"}), 404

        job = Job.query.get(application.job_id)
        if not job or job.employer_id != employer.id:
            return (
                jsonify(
                    {"error": "You do not have permission to update this application"}
                ),
                403,
            )

        if "status" in data and data["status"] not in ["accepted", "rejected"]:
            return (
                jsonify(
                    {"error": "Employers can only set status to accepted or rejected"}
                ),
                400,
            )

        if data.get("status") == "accepted":
            from ..models.job import JobStatus

            if job.status != JobStatus.OPEN:
                return (
                    jsonify(
                        {
                            "error": "Cannot accept application for a job that is not open"
                        }
                    ),
                    400,
                )

            existing_accepted = Application.query.filter_by(
                job_id=application.job_id, status="accepted"
            ).first()
            if existing_accepted and existing_accepted.id != application_id:
                return (
                    jsonify(
                        {
                            "error": "Another application has already been accepted for this job"
                        }
                    ),
                    400,
                )

            job.status = JobStatus.IN_PROGRESS

        application.status = data["status"]

    elif current_user.role.value == "worker":
        worker = Worker.query.filter_by(user_id=current_user_id).first()
        if not worker or application.worker_id != worker.id:
            return (
                jsonify(
                    {"error": "You do not have permission to update this application"}
                ),
                403,
            )

        if "status" in data and data["status"] != "withdrawn":
            return (
                jsonify({"error": "Workers can only withdraw their applications"}),
                400,
            )

        if "cover_letter" in data:
            application.cover_letter = data["cover_letter"]
        if "proposed_rate" in data:
            application.proposed_rate = data["proposed_rate"]
        if "status" in data:
            application.status = data["status"]

    else:  # admin
        for key, value in data.items():
            setattr(application, key, value)

    db.session.commit()
    return jsonify(application.to_dict()), 200


@applications_bp.route("/<int:application_id>", methods=["DELETE"])
@jwt_required()
def delete_application(application_id):
    """Delete an application (worker or admin only)."""
    current_user_id = get_current_user_id()
    current_user = User.query.get(current_user_id)

    application = Application.query.get_or_404(application_id)

    if current_user.role.value == "worker":
        worker = Worker.query.filter_by(user_id=current_user_id).first()
        if not worker or application.worker_id != worker.id:
            return (
                jsonify(
                    {"error": "You do not have permission to delete this application"}
                ),
                403,
            )
    elif current_user.role.value == "admin":
        pass  # Admin can delete any
    else:
        return (
            jsonify({"error": "You do not have permission to delete applications"}),
            403,
        )

    db.session.delete(application)
    db.session.commit()
    return jsonify({"message": "Application deleted successfully"}), 200


@applications_bp.route("/stats", methods=["GET"])
@jwt_required()
def get_application_stats():
    """Get application statistics for the current user."""
    current_user_id = get_current_user_id()
    current_user = User.query.get(current_user_id)

    if current_user.role.value == "worker":
        worker = Worker.query.filter_by(user_id=current_user_id).first()
        if not worker:
            return jsonify({"error": "Worker profile not found"}), 404
        applications = Application.query.filter_by(worker_id=worker.id).all()

    elif current_user.role.value == "employer":
        employer = Employer.query.filter_by(user_id=current_user_id).first()
        if not employer:
            return jsonify({"error": "Employer profile not found"}), 404
        job_ids = [job.id for job in Job.query.filter_by(employer_id=employer.id).all()]
        if not job_ids:
            return jsonify({"total": 0, "status_counts": {}}), 200
        applications = Application.query.filter(Application.job_id.in_(job_ids)).all()

    else:  # admin
        applications = Application.query.all()

    status_counts = {}
    for app in applications:
        status = app.status.value
        status_counts[status] = status_counts.get(status, 0) + 1

    return jsonify({"total": len(applications), "status_counts": status_counts}), 200


# ----- END FILE -----
