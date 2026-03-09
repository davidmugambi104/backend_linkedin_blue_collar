from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..extensions import db
from ..models import User
from ..schemas import UserUpdateSchema
from ..utils.permissions import user_is_owner_or_admin
from ..utils.helpers import get_current_user_id

users_bp = Blueprint("users", __name__)


@users_bp.route("/me", methods=["GET"])
@jwt_required()
def get_current_user():
    current_user_id = get_current_user_id()
    user = User.query.get_or_404(current_user_id)
    return jsonify(user.to_dict()), 200


@users_bp.route("/me", methods=["PUT"])
@jwt_required()
def update_current_user():
    current_user_id = get_current_user_id()
    user = User.query.get_or_404(current_user_id)

    schema = UserUpdateSchema()
    data = schema.load(request.json, partial=True)

    for key, value in data.items():
        setattr(user, key, value)

    db.session.commit()
    return jsonify(user.to_dict()), 200


@users_bp.route("/<int:user_id>", methods=["GET"])
@jwt_required()
def get_user(user_id):
    current_user_id = get_current_user_id()
    current_user = User.query.get(current_user_id)
    user = User.query.get_or_404(user_id)

    # Only allow admin or the user themselves to view the full profile
    if current_user.role.value != "admin" and current_user.id != user_id:
        return jsonify({"error": "You do not have permission to view this user"}), 403

    return jsonify(user.to_dict()), 200


@users_bp.route("/<int:user_id>", methods=["PUT"])
@jwt_required()
@user_is_owner_or_admin(User)
def update_user(user_id):
    user = User.query.get_or_404(user_id)

    schema = UserUpdateSchema()
    data = schema.load(request.json, partial=True)

    for key, value in data.items():
        setattr(user, key, value)

    db.session.commit()
    return jsonify(user.to_dict()), 200


@users_bp.route("/<int:user_id>", methods=["DELETE"])
@jwt_required()
@user_is_owner_or_admin(User)
def delete_user(user_id):
    user = User.query.get_or_404(user_id)

    user.is_active = False
    db.session.commit()

    return jsonify({"message": "User deactivated successfully"}), 200
