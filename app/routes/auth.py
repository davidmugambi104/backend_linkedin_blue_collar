# ----- FILE: backend/app/routes/auth.py -----
from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token, create_refresh_token, jwt_required, get_jwt_identity, get_jwt
)
from ..extensions import db, jwt
from ..models import User, UserRole, Worker, Employer
from ..schemas import UserSchema, UserLoginSchema
from ..utils.permissions import admin_required
import datetime

auth_bp = Blueprint('auth', __name__)

# In-memory blacklist (use Redis or DB in production)
blacklisted_tokens = set()


@auth_bp.route('/register', methods=['POST'])
def register():
    schema = UserSchema()
    data = schema.load(request.json)

    # Create user
    user = User(
        username=data['username'],
        email=data['email'],
        role=UserRole(data['role'])
    )
    user.set_password(data['password'])

    db.session.add(user)
    db.session.commit()

    # Create profile based on role
    if user.role == UserRole.WORKER:
        worker = Worker(user_id=user.id, full_name=user.username)
        db.session.add(worker)
    elif user.role == UserRole.EMPLOYER:
        employer = Employer(user_id=user.id, company_name=user.username)
        db.session.add(employer)

    db.session.commit()

    return jsonify({
        'message': 'User created successfully',
        'user': user.to_dict()
    }), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    schema = UserLoginSchema()
    data = schema.load(request.json)

    user = User.query.filter_by(email=data['email']).first()
    if not user or not user.check_password(data['password']):
        return jsonify({'error': 'Invalid email or password'}), 401

    if not user.is_active:
        return jsonify({'error': 'Account is deactivated'}), 403

    # Create tokens
    access_token = create_access_token(identity=user.id, additional_claims={'role': user.role.value})
    refresh_token = create_refresh_token(identity=user.id)

    return jsonify({
        'access_token': access_token,
        'refresh_token': refresh_token,
        'user': user.to_dict()
    }), 200


@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    current_user = get_jwt_identity()
    user = User.query.get(current_user)

    if not user or not user.is_active:
        return jsonify({'error': 'User not found or inactive'}), 401

    new_access_token = create_access_token(identity=user.id, additional_claims={'role': user.role.value})
    return jsonify({'access_token': new_access_token}), 200


@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    jti = get_jwt()['jti']
    blacklisted_tokens.add(jti)
    return jsonify({'message': 'Successfully logged out'}), 200


@auth_bp.route('/logout/refresh', methods=['POST'])
@jwt_required(refresh=True)
def logout_refresh():
    jti = get_jwt()['jti']
    blacklisted_tokens.add(jti)
    return jsonify({'message': 'Refresh token revoked'}), 200


# JWT callback to check blacklist
@jwt.token_in_blocklist_loader
def check_if_token_in_blacklist(jwt_header, jwt_payload):
    jti = jwt_payload['jti']
    return jti in blacklisted_tokens


# Admin route to activate/deactivate users
@auth_bp.route('/admin/users/<int:user_id>/activate', methods=['PUT'])
@jwt_required()
@admin_required
def toggle_user_activation(user_id):
    user = User.query.get_or_404(user_id)

    data = request.json
    if 'is_active' not in data:
        return jsonify({'error': 'Missing is_active field'}), 400

    user.is_active = data['is_active']
    db.session.commit()

    return jsonify({
        'message': f"User {'activated' if user.is_active else 'deactivated'}",
        'user': user.to_dict()
    }), 200

# ----- END FILE -----
