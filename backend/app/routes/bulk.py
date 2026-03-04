# ----- FILE: backend/app/routes/bulk.py -----
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..services.bulk_service import bulk_service
from ..utils.permissions import admin_required, employer_required
from ..models.user import User

bulk_bp = Blueprint('bulk', __name__, url_prefix='/api/bulk')


@bulk_bp.route('/hire/<int:job_id>', methods=['POST'])
@jwt_required()
@employer_required
def bulk_hire(job_id):
    """Hire multiple workers for a job."""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    employer = user.employer_profile
    
    data = request.get_json()
    worker_ids = data.get('worker_ids', [])
    
    if not worker_ids:
        return jsonify({'error': 'No worker IDs provided'}), 400
    
    result = bulk_service.bulk_hire(job_id, worker_ids, employer.id)
    return jsonify(result), 200


@bulk_bp.route('/verify', methods=['POST'])
@jwt_required()
@admin_required
def bulk_verify():
    """Bulk verify multiple workers."""
    data = request.get_json()
    worker_ids = data.get('worker_ids', [])
    
    if not worker_ids:
        return jsonify({'error': 'No worker IDs provided'}), 400
    
    current_user_id = get_jwt_identity()
    result = bulk_service.bulk_verify_workers(worker_ids, current_user_id)
    return jsonify(result), 200


@bulk_bp.route('/messages', methods=['POST'])
@jwt_required()
def bulk_send_messages():
    """Send message to multiple users."""
    current_user_id = get_jwt_identity()
    
    data = request.get_json()
    receiver_ids = data.get('receiver_ids', [])
    message = data.get('message')
    job_id = data.get('job_id')
    
    if not receiver_ids or not message:
        return jsonify({'error': 'receiver_ids and message required'}), 400
    
    result = bulk_service.bulk_send_messages(current_user_id, receiver_ids, message, job_id)
    return jsonify(result), 200
