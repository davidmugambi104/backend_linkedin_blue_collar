# ----- FILE: backend/app/routes/verification.py -----
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..extensions import db
from ..models.verification import VerificationCode
from ..models.user import User
from ..models.worker import Worker
from ..services.sms_service import sms_service
from ..utils.permissions import worker_required
import re
import os
import uuid

verification_bp = Blueprint('verification', __name__, url_prefix='/api/verification')

def normalize_phone(phone):
    """Normalize phone to format: 254XXXXXXXXX"""
    digits = re.sub(r'\D', '', phone)
    if digits.startswith('0'):
        digits = '254' + digits[1:]
    elif not digits.startswith('254'):
        digits = '254' + digits
    return digits

@verification_bp.route('/send-code', methods=['POST'])
def send_verification_code():
    """Send verification code to phone"""
    data = request.get_json()
    phone = data.get('phone')
    purpose = data.get('purpose', 'phone_verify')
    
    if not phone:
        return jsonify({'error': 'Phone number required'}), 400
    
    phone = normalize_phone(phone)
    
    # Create verification code
    verification = VerificationCode.create_verification(phone, purpose)
    
    # Send SMS
    message = f"Your WorkForge verification code is: {verification.code}"
    sms_service.send_sms(phone, message)
    
    return jsonify({
        'message': 'Verification code sent',
        'expires_in_minutes': 10
    })

@verification_bp.route('/verify-code', methods=['POST'])
def verify_code():
    """Verify code and optionally link to user"""
    data = request.get_json()
    phone = data.get('phone')
    code = data.get('code')
    purpose = data.get('purpose', 'phone_verify')
    
    if not phone or not code:
        return jsonify({'error': 'Phone and code required'}), 400
    
    phone = normalize_phone(phone)
    
    # Find valid verification
    verification = VerificationCode.query.filter_by(
        phone=phone,
        code=code,
        purpose=purpose,
        verified_at=None
    ).first()
    
    if not verification:
        return jsonify({'error': 'Invalid or expired code'}), 400
    
    if not verification.is_valid():
        return jsonify({'error': 'Code expired'}), 400
    
    # Mark as verified
    from datetime import datetime
    verification.verified_at = datetime.utcnow()
    db.session.commit()
    
    return jsonify({
        'message': 'Phone verified successfully',
        'verified': True
    })

@verification_bp.route('/verify-phone', methods=['POST'])
@jwt_required()
def verify_user_phone():
    """Verify current user's phone"""
    current_user_id = get_jwt_identity()
    data = request.get_json()
    code = data.get('code')
    
    if not code:
        return jsonify({'error': 'Code required'}), 400
    
    user = User.query.get(current_user_id)
    if not user or not user.phone:
        return jsonify({'error': 'User phone not found'}), 404
    
    phone = normalize_phone(user.phone)
    
    # Find valid verification
    verification = VerificationCode.query.filter_by(
        phone=phone,
        code=code,
        purpose='phone_verify',
        verified_at=None
    ).first()
    
    if not verification or not verification.is_valid():
        return jsonify({'error': 'Invalid or expired code'}), 400
    
    # Mark as verified
    from datetime import datetime
    verification.verified_at = datetime.utcnow()
    user.is_phone_verified = True
    db.session.commit()
    
    return jsonify({
        'message': 'Phone verified successfully',
        'verified': True
    })

@verification_bp.route('/resend-code', methods=['POST'])
def resend_code():
    """Resend verification code"""
    data = request.get_json()
    phone = data.get('phone')
    purpose = data.get('purpose', 'phone_verify')
    
    if not phone:
        return jsonify({'error': 'Phone number required'}), 400
    
    # Check rate limit (max 3 resends per hour)
    recent = VerificationCode.query.filter_by(
        phone=normalize_phone(phone),
        purpose=purpose
    ).filter(
        VerificationCode.created_at > db.func.now() - db.text('INTERVAL 1 HOUR')
    ).count()
    
    if recent >= 3:
        return jsonify({'error': 'Too many requests. Try again later.'}), 429
    
    return send_verification_code()


# ===== Document Upload Routes =====

UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER', 'uploads/verification')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'pdf'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@verification_bp.route('/document/upload', methods=['POST'])
@jwt_required()
@worker_required
def upload_document():
    """Upload verification document (ID, certificate, etc.)"""
    current_user_id = get_jwt_identity()
    worker = Worker.query.filter_by(user_id=current_user_id).first_or_404()
    
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if not allowed_file(file.filename):
        return jsonify({'error': 'File type not allowed. Use png, jpg, jpeg, or pdf'}), 400
    
    document_type = request.form.get('document_type', 'id_card')
    
    # Create upload directory if not exists
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    
    # Generate unique filename
    ext = file.filename.rsplit('.', 1)[1].lower()
    filename = f"{worker.id}_{document_type}_{uuid.uuid4().hex[:8]}.{ext}"
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    
    # Save file
    file.save(filepath)
    
    # Create or update document verification record
    from ..models.verification import DocumentVerification
    
    doc = DocumentVerification.query.filter_by(
        worker_id=worker.id,
        verification_type=document_type
    ).first()
    
    if doc:
        doc.document_url = filepath
        doc.status = 'pending'
    else:
        doc = DocumentVerification(
            worker_id=worker.id,
            verification_type=document_type,
            document_url=filepath,
            status='pending'
        )
        db.session.add(doc)
    
    db.session.commit()
    
    return jsonify({
        'message': 'Document uploaded successfully',
        'document': doc.to_dict()
    }), 201


@verification_bp.route('/documents', methods=['GET'])
@jwt_required()
@worker_required
def get_my_documents():
    """Get current worker's verification documents"""
    current_user_id = get_jwt_identity()
    worker = Worker.query.filter_by(user_id=current_user_id).first_or_404()
    
    from ..models.verification import DocumentVerification
    docs = DocumentVerification.query.filter_by(worker_id=worker.id).all()
    
    return jsonify({
        'documents': [doc.to_dict() for doc in docs]
    }), 200


@verification_bp.route('/admin/queue', methods=['GET'])
@jwt_required()
def get_verification_queue():
    """Get pending documents for admin review"""
    from ..models.verification import DocumentVerification
    from ..utils.permissions import admin_required
    
    # Check admin
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    if user.role.value != 'admin':
        return jsonify({'error': 'Admin access required'}), 403
    
    status = request.args.get('status', 'pending')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    query = DocumentVerification.query.filter_by(status=status)
    
    # Get with worker info
    docs = query.order_by(DocumentVerification.created_at.desc())\
        .paginate(page=page, per_page=per_page, error_out=False)
    
    result = []
    for doc in docs.items:
        doc_dict = doc.to_dict()
        worker = Worker.query.get(doc.worker_id)
        if worker:
            doc_dict['worker'] = {
                'id': worker.id,
                'full_name': worker.full_name,
                'phone': worker.phone
            }
        result.append(doc_dict)
    
    return jsonify({
        'documents': result,
        'total': docs.total,
        'pages': docs.pages,
        'current_page': page
    }), 200


@verification_bp.route('/admin/review/<int:doc_id>', methods=['PUT'])
@jwt_required()
def review_document(doc_id):
    """Admin review a verification document"""
    from ..models.verification import DocumentVerification
    from ..utils.permissions import admin_required
    
    # Check admin
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    if user.role.value != 'admin':
        return jsonify({'error': 'Admin access required'}), 403
    
    doc = DocumentVerification.query.get_or_404(doc_id)
    
    data = request.get_json()
    action = data.get('action')  # 'approve' or 'reject'
    notes = data.get('notes', '')
    
    if action == 'approve':
        doc.status = 'approved'
        doc.reviewed_by = current_user_id
        doc.review_notes = notes
        
        # Update worker verification score
        worker = Worker.query.get(doc.worker_id)
        if worker:
            worker.verification_score = min(100, worker.verification_score + 25)
            if worker.verification_score >= 50:
                worker.is_verified = True
                
    elif action == 'reject':
        doc.status = 'rejected'
        doc.reviewed_by = current_user_id
        doc.review_notes = notes
    else:
        return jsonify({'error': 'Invalid action. Use approve or reject'}), 400
    
    db.session.commit()
    
    return jsonify({
        'message': f'Document {action}d',
        'document': doc.to_dict()
    }), 200


@verification_bp.route('/status', methods=['GET'])
@jwt_required()
@worker_required
def get_verification_status():
    """Get current worker's overall verification status"""
    current_user_id = get_jwt_identity()
    worker = Worker.query.filter_by(user_id=current_user_id).first_or_404()
    
    from ..models.verification import DocumentVerification
    docs = DocumentVerification.query.filter_by(worker_id=worker.id).all()
    
    doc_status = {}
    for doc in docs:
        doc_status[doc.verification_type] = {
            'status': doc.status,
            'reviewed_at': doc.updated_at.isoformat() if doc.updated_at else None
        }
    
    return jsonify({
        'is_verified': worker.is_verified,
        'verification_score': worker.verification_score,
        'documents': doc_status
    }), 200
