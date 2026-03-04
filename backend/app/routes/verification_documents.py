# ----- FILE: backend/app/routes/verification_documents.py -----
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import os
import uuid
from werkzeug.utils import secure_filename
from ..extensions import db
from ..models.verification import DocumentVerification
from ..models.worker import Worker

verification_doc_bp = Blueprint('verification_doc', __name__, url_prefix='/api/verification/documents')

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'pdf'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@verification_doc_bp.route('/upload', methods=['POST'])
@jwt_required()
def upload_document():
    """Upload verification document (ID, certificate, etc.)"""
    current_user_id = get_jwt_identity()
    
    # Get worker's profile
    worker = Worker.query.filter_by(user_id=current_user_id).first()
    if not worker:
        return jsonify({'error': 'Worker profile not found'}), 404
    
    # Check if file is present
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if not allowed_file(file.filename):
        return jsonify({'error': 'File type not allowed. Use png, jpg, jpeg, or pdf'}), 400
    
    # Get verification type
    verification_type = request.form.get('verification_type', 'id_card')
    if verification_type not in ['id_card', 'certificate', 'portfolio']:
        return jsonify({'error': 'Invalid verification type'}), 400
    
    # Generate unique filename
    ext = file.filename.rsplit('.', 1)[1].lower()
    filename = f"{uuid.uuid4()}.{ext}"
    
    # Create uploads directory
    upload_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), '..', '..', 'uploads', 'verifications')
    os.makedirs(upload_dir, exist_ok=True)
    
    # Save file
    filepath = os.path.join(upload_dir, filename)
    file.save(filepath)
    
    # Create verification record
    document_url = f"/uploads/verifications/{filename}"
    verification = DocumentVerification(
        worker_id=worker.id,
        verification_type=verification_type,
        document_url=document_url,
        status='pending'
    )
    db.session.add(verification)
    db.session.commit()
    
    return jsonify({
        'message': 'Document uploaded successfully',
        'verification': {
            'id': verification.id,
            'type': verification.verification_type,
            'status': verification.status,
            'document_url': verification.document_url
        }
    }), 201

@verification_doc_bp.route('/my', methods=['GET'])
@jwt_required()
def my_verifications():
    """Get current user's verification status"""
    current_user_id = get_jwt_identity()
    
    worker = Worker.query.filter_by(user_id=current_user_id).first()
    if not worker:
        return jsonify({'error': 'Worker profile not found'}), 404
    
    verifications = DocumentVerification.query.filter_by(worker_id=worker.id).all()
    
    return jsonify({
        'verifications': [{
            'id': v.id,
            'type': v.verification_type,
            'status': v.status,
            'document_url': v.document_url,
            'review_notes': v.review_notes,
            'created_at': v.created_at.isoformat() if v.created_at else None
        } for v in verifications]
    })

@verification_doc_bp.route('/<int:verification_id>', methods=['GET'])
@jwt_required()
def get_verification(verification_id):
    """Get specific verification details"""
    current_user_id = get_jwt_identity()
    
    worker = Worker.query.filter_by(user_id=current_user_id).first()
    if not worker:
        return jsonify({'error': 'Worker profile not found'}), 404
    
    verification = DocumentVerification.query.filter_by(
        id=verification_id, 
        worker_id=worker.id
    ).first()
    
    if not verification:
        return jsonify({'error': 'Verification not found'}), 404
    
    return jsonify({
        'verification': {
            'id': verification.id,
            'type': verification.verification_type,
            'status': verification.status,
            'document_url': verification.document_url,
            'review_notes': verification.review_notes,
            'created_at': verification.created_at.isoformat() if verification.created_at else None
        }
    })
