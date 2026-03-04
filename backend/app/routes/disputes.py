# ----- FILE: backend/app/routes/disputes.py -----
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..extensions import db
from ..models.dispute import Dispute, DisputeMessage, DisputeStatus, DisputeType
from ..models.user import User
from ..utils.permissions import admin_required
from datetime import datetime

disputes_bp = Blueprint('disputes', __name__, url_prefix='/api/disputes')


@disputes_bp.route('/', methods=['POST'])
@jwt_required()
def create_dispute():
    """Create a new dispute."""
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    job_id = data.get('job_id')
    application_id = data.get('application_id')
    dispute_type = data.get('dispute_type')
    description = data.get('description')
    evidence_urls = data.get('evidence_urls', [])
    
    if not all([job_id, dispute_type, description]):
        return jsonify({'error': 'job_id, dispute_type, description required'}), 400
    
    try:
        dispute_type_enum = DisputeType[dispute_type.upper()]
    except KeyError:
        return jsonify({'error': 'Invalid dispute_type'}), 400
    
    dispute = Dispute(
        job_id=job_id,
        application_id=application_id,
        raised_by_user_id=current_user_id,
        dispute_type=dispute_type_enum,
        description=description,
        evidence_urls=evidence_urls
    )
    db.session.add(dispute)
    db.session.commit()
    
    return jsonify({'dispute': dispute.to_dict()}), 201


@disputes_bp.route('/', methods=['GET'])
@jwt_required()
def list_disputes():
    """List disputes (filtered by role)."""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    query = Dispute.query
    
    # Workers and employers see their own disputes
    if user.role.value == 'worker':
        from ..models import Worker
        worker = Worker.query.filter_by(user_id=current_user_id).first()
        if worker:
            # Get job IDs for this worker's applications
            from ..models import Application
            app_ids = [a.id for a in Application.query.filter_by(worker_id=worker.id).all()]
            job_ids = [a.job_id for a in Application.query.filter_by(worker_id=worker.id).all()]
            query = query.filter(
                (Dispute.raised_by_user_id == current_user_id) |
                (Dispute.job_id.in_(job_ids))
            )
    elif user.role.value == 'employer':
        from ..models import Employer
        employer = Employer.query.filter_by(user_id=current_user_id).first()
        if employer:
            from ..models import Job
            job_ids = [j.id for j in Job.query.filter_by(employer_id=employer.id).all()]
            query = query.filter(
                (Dispute.raised_by_user_id == current_user_id) |
                (Dispute.job_id.in_(job_ids))
            )
    # Admins see all
    
    status = request.args.get('status')
    if status:
        try:
            query = query.filter(Dispute.status == DisputeStatus[status.upper()])
        except KeyError:
            pass
    
    disputes = query.order_by(Dispute.created_at.desc()).all()
    
    return jsonify({'disputes': [d.to_dict() for d in disputes]}), 200


@disputes_bp.route('/<int:dispute_id>', methods=['GET'])
@jwt_required()
def get_dispute(dispute_id):
    """Get dispute details."""
    dispute = Dispute.query.get_or_404(dispute_id)
    messages = DisputeMessage.query.filter_by(dispute_id=dispute_id).order_by(DisputeMessage.created_at).all()
    
    return jsonify({
        'dispute': dispute.to_dict(),
        'messages': [m.to_dict() for m in messages]
    }), 200


@disputes_bp.route('/<int:dispute_id>/message', methods=['POST'])
@jwt_required()
def add_dispute_message(dispute_id):
    """Add message to dispute."""
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    message = data.get('message')
    is_evidence = data.get('is_evidence', False)
    
    if not message:
        return jsonify({'error': 'message required'}), 400
    
    dispute_msg = DisputeMessage(
        dispute_id=dispute_id,
        user_id=current_user_id,
        message=message,
        is_evidence=is_evidence
    )
    db.session.add(dispute_msg)
    db.session.commit()
    
    return jsonify({'message': dispute_msg.to_dict()}), 201


@disputes_bp.route('/<int:dispute_id>/resolve', methods=['POST'])
@jwt_required()
@admin_required
def resolve_dispute(dispute_id):
    """Resolve a dispute (admin only)."""
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    dispute = Dispute.query.get_or_404(dispute_id)
    
    resolution = data.get('resolution')
    action = data.get('action', 'resolve')  # resolve, reject, escalate
    
    if action == 'resolve':
        dispute.status = DisputeStatus.RESOLVED
        dispute.resolution = resolution
    elif action == 'reject':
        dispute.status = DisputeStatus.REJECTED
        dispute.resolution = resolution
    elif action == 'escalate':
        dispute.status = DisputeStatus.ESCALATED
    
    dispute.resolved_by = current_user_id
    dispute.resolved_at = datetime.utcnow()
    db.session.commit()
    
    return jsonify({'dispute': dispute.to_dict()}), 200
