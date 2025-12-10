# ----- FILE: backend/app/utils/permissions.py -----
from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from ..models import User, UserRole

def admin_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        if not user or user.role != UserRole.ADMIN:
            return jsonify({'error': 'Admin access required'}), 403
        return fn(*args, **kwargs)
    return wrapper

def employer_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        if not user or user.role != UserRole.EMPLOYER:
            return jsonify({'error': 'Employer access required'}), 403
        return fn(*args, **kwargs)
    return wrapper

def worker_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        if not user or user.role != UserRole.WORKER:
            return jsonify({'error': 'Worker access required'}), 403
        return fn(*args, **kwargs)
    return wrapper

def user_is_owner_or_admin(model, id_field='user_id'):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            current_user_id = get_jwt_identity()
            user = User.query.get(current_user_id)

            # Admin can do anything
            if user.role == UserRole.ADMIN:
                return fn(*args, **kwargs)

            # For non-admins, check if they own the resource
            # Get the resource id from the route parameters
            resource_id = kwargs.get('id')
            if not resource_id:
                return jsonify({'error': 'Resource ID not found in route'}), 400

            resource = model.query.get_or_404(resource_id)
            if getattr(resource, id_field) != current_user_id:
                return jsonify({'error': 'You do not have permission to access this resource'}), 403

            return fn(*args, **kwargs)
        return wrapper
    return decorator
