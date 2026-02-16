# ----- FILE: backend/app/routes/skills.py -----
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from ..extensions import db
from ..models import Skill, WorkerSkill, Job
from ..schemas import SkillSchema
from ..utils.permissions import admin_required

skills_bp = Blueprint("skills", __name__)


@skills_bp.route("/", methods=["GET"])
def get_skills():
    """Get all skills. Public endpoint."""
    skills = Skill.query.all()
    return jsonify([skill.to_dict() for skill in skills]), 200


@skills_bp.route("/", methods=["POST"])
@jwt_required()
@admin_required
def create_skill():
    schema = SkillSchema()
    data = schema.load(request.json)

    # Check if skill with same name already exists
    existing = Skill.query.filter_by(name=data["name"]).first()
    if existing:
        return jsonify({"error": "Skill with this name already exists"}), 400

    skill = Skill(name=data["name"], category=data["category"])
    db.session.add(skill)
    db.session.commit()

    return jsonify(skill.to_dict()), 201


@skills_bp.route("/<int:skill_id>", methods=["GET"])
def get_skill(skill_id):
    skill = Skill.query.get_or_404(skill_id)
    return jsonify(skill.to_dict()), 200


@skills_bp.route("/<int:skill_id>", methods=["PUT"])
@jwt_required()
@admin_required
def update_skill(skill_id):
    skill = Skill.query.get_or_404(skill_id)

    schema = SkillSchema(partial=True)
    data = schema.load(request.json)

    # If name is being updated, check for duplicates
    if "name" in data and data["name"] != skill.name:
        existing = Skill.query.filter_by(name=data["name"]).first()
        if existing:
            return jsonify({"error": "Skill with this name already exists"}), 400

    for key, value in data.items():
        setattr(skill, key, value)

    db.session.commit()
    return jsonify(skill.to_dict()), 200


@skills_bp.route("/<int:skill_id>", methods=["DELETE"])
@jwt_required()
@admin_required
def delete_skill(skill_id):
    skill = Skill.query.get_or_404(skill_id)

    # Check if the skill is being used by any worker or job
    worker_skill_count = WorkerSkill.query.filter_by(skill_id=skill_id).count()
    job_count = Job.query.filter_by(required_skill_id=skill_id).count()

    if worker_skill_count > 0 or job_count > 0:
        return (
            jsonify(
                {
                    "error": "Cannot delete skill because it is being used by workers or jobs",
                    "worker_skill_count": worker_skill_count,
                    "job_count": job_count,
                }
            ),
            400,
        )

    db.session.delete(skill)
    db.session.commit()

    return jsonify({"message": "Skill deleted successfully"}), 200


@skills_bp.route("/categories", methods=["GET"])
def get_skill_categories():
    """Get distinct skill categories. Public endpoint."""
    categories = db.session.query(Skill.category).distinct().all()
    return jsonify([category[0] for category in categories if category[0]]), 200


# ----- END FILE -----
