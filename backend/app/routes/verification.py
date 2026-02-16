from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..extensions import db
from ..models import User, Verification, Worker
from ..schemas import (
    VerificationCreateSchema,
    VerificationUpdateSchema,
)
from ..utils.permissions import admin_required, worker_required

verification_bp = Blueprint("verification", __name__)


@verification_bp.route("/", methods=["POST"])
@jwt_required()
@worker_required
def create_verification():
    """Worker submits a verification document."""
    current_user_id = get_jwt_identity()
    worker = Worker.query.filter_by(user_id=current_user_id).first_or_404()

    schema = VerificationCreateSchema()
    data = schema.load(request.json)

    # Check if worker_id in data matches the current worker
    if data["worker_id"] != worker.id:
        return (
            jsonify(
                {"error": "You can only submit verifications for your own profile"}
            ),
            403,
        )

    verification = Verification(
        worker_id=worker.id,
        verification_type=data["verification_type"],
        document_url=data["document_url"],
    )

    db.session.add(verification)
    db.session.commit()

    return jsonify(verification.to_dict()), 201


@verification_bp.route("/", methods=["GET"])
@jwt_required()
def get_verifications():
    """Get verifications (with filters)."""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)

    worker_id = request.args.get("worker_id")
    status = request.args.get("status")

    query = Verification.query

    # Apply filters
    if worker_id:
        # Worker can only see their own verifications; admin can see all
        if current_user.role.value == "worker":
            worker = Worker.query.filter_by(user_id=current_user_id).first()
            if not worker or int(worker_id) != worker.id:
                return (
                    jsonify({"error": "You can only view your own verifications"}),
                    403,
                )
        query = query.filter_by(worker_id=worker_id)
    else:
        # Non-admin users can only see their own
        if current_user.role.value == "worker":
            worker = Worker.query.filter_by(user_id=current_user_id).first()
            if not worker:
                return jsonify({"error": "Worker profile not found"}), 404
            query = query.filter_by(worker_id=worker.id)

    if status:
        from ..models.verification import VerificationStatus

        try:
            query = query.filter_by(status=VerificationStatus(status))
        except ValueError:
            return jsonify({"error": "Invalid status value"}), 400

    verifications = query.order_by(Verification.created_at.desc()).all()

    result = []
    for ver in verifications:
        ver_dict = ver.to_dict()
        worker = Worker.query.get(ver.worker_id)
        ver_dict["worker"] = worker.to_dict() if worker else None
        result.append(ver_dict)

    return jsonify(result), 200


@verification_bp.route("/<int:verification_id>", methods=["GET"])
@jwt_required()
def get_verification(verification_id):
    """Get a specific verification by ID."""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)

    verification = Verification.query.get_or_404(verification_id)

    # Worker can only view their own verifications
    if current_user.role.value == "worker":
        worker = Worker.query.filter_by(user_id=current_user_id).first()
        if not worker or verification.worker_id != worker.id:
            return jsonify({"error": "You can only view your own verifications"}), 403

    ver_dict = verification.to_dict()
    worker = Worker.query.get(verification.worker_id)
    ver_dict["worker"] = worker.to_dict() if worker else None

    return jsonify(ver_dict), 200


@verification_bp.route("/<int:verification_id>", methods=["PUT"])
@jwt_required()
@admin_required
def update_verification(verification_id):
    """Admin updates verification status (approve/reject)."""
    current_user_id = get_jwt_identity()
    verification = Verification.query.get_or_404(verification_id)

    schema = VerificationUpdateSchema()
    data = schema.load(request.json)

    verification.status = data["status"]
    verification.reviewed_by = current_user_id
    verification.review_notes = data.get("review_notes")

    if data["status"] == "approved":
        worker = Worker.query.get(verification.worker_id)
        if worker:
            worker.verification_score = min(100, worker.verification_score + 25)
            if worker.verification_score >= 75:
                worker.is_verified = True

    db.session.commit()

    ver_dict = verification.to_dict()
    worker = Worker.query.get(verification.worker_id)
    ver_dict["worker"] = worker.to_dict() if worker else None

    return jsonify(ver_dict), 200


@verification_bp.route("/<int:verification_id>", methods=["DELETE"])
@jwt_required()
@admin_required
def delete_verification(verification_id):
    """Admin deletes a verification."""
    verification = Verification.query.get_or_404(verification_id)

    db.session.delete(verification)
    db.session.commit()

    return jsonify({"message": "Verification deleted successfully"}), 200


@verification_bp.route("/worker/<int:worker_id>/status", methods=["GET"])
def get_worker_verification_status(worker_id):
    """Get verification status for a worker. Public endpoint."""
    worker = Worker.query.get_or_404(worker_id)

    verifications = Verification.query.filter_by(worker_id=worker_id).all()

    status_counts = {}
    for ver in verifications:
        status = ver.status.value
        status_counts[status] = status_counts.get(status, 0) + 1

    return (
        jsonify(
            {
                "worker_id": worker_id,
                "is_verified": worker.is_verified,
                "verification_score": worker.verification_score,
                "verification_counts": status_counts,
                "total_verifications": len(verifications),
            }
        ),
        200,
    )
