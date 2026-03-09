# ----- FILE: backend/app/routes/escrow.py -----
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from ..extensions import db
from ..models.payment import Payment, PaymentStatus
from ..models.job import Job
from ..models.application import Application, ApplicationStatus
from ..utils.helpers import get_current_user_id
from decimal import Decimal

escrow_bp = Blueprint('escrow', __name__, url_prefix='/api/escrow')


@escrow_bp.route('/hold', methods=['POST'])
@jwt_required()
def hold_payment():
    """Hold payment in escrow for a job"""
    current_user_id = get_current_user_id()
    data = request.get_json()
    
    job_id = data.get('job_id')
    amount = data.get('amount')
    
    if not job_id or not amount:
        return jsonify({'error': 'Job ID and amount required'}), 400
    
    # Verify job belongs to employer
    job = Job.query.get(job_id)
    if not job:
        return jsonify({'error': 'Job not found'}), 404
    
    employer = job.employer
    if not employer or employer.user_id != current_user_id:
        return jsonify({'error': 'Not authorized'}), 403
    
    # Calculate platform fee (10%)
    platform_fee = Decimal(str(amount)) * Decimal('0.10')
    net_amount = Decimal(str(amount)) - platform_fee
    
    # Create escrow payment
    payment = Payment(
        user_id=current_user_id,
        job_id=job_id,
        employer_id=employer.id,
        amount=amount,
        payment_type='escrow',
        reference=f"escrow_{job_id}_{current_user_id}",
        status=PaymentStatus.PENDING,
        platform_fee=platform_fee,
        net_amount=net_amount,
        provider='mpesa'
    )
    db.session.add(payment)
    db.session.commit()
    
    return jsonify({
        'message': 'Payment held in escrow',
        'payment': payment.to_dict(),
        'release_available': True
    }), 201


@escrow_bp.route('/release', methods=['POST'])
@jwt_required()
def release_payment():
    """Release escrow payment to worker (job completed)"""
    current_user_id = get_current_user_id()
    data = request.get_json()
    
    job_id = data.get('job_id')
    worker_id = data.get('worker_id')
    
    if not job_id or not worker_id:
        return jsonify({'error': 'Job ID and worker ID required'}), 400
    
    # Verify job belongs to employer
    job = Job.query.get(job_id)
    if not job:
        return jsonify({'error': 'Job not found'}), 404
    
    employer = job.employer
    if not employer or employer.user_id != current_user_id:
        return jsonify({'error': 'Not authorized'}), 403
    
    # Find pending escrow payment
    payment = Payment.query.filter_by(
        job_id=job_id,
        payment_type='escrow',
        status=PaymentStatus.PENDING
    ).first()
    
    if not payment:
        return jsonify({'error': 'No escrow payment found'}), 404
    
    # Verify worker was hired for this job
    application = Application.query.filter_by(
        job_id=job_id,
        worker_id=worker_id,
        status=ApplicationStatus.ACCEPTED
    ).first()
    
    if not application:
        return jsonify({'error': 'Worker was not hired for this job'}), 400
    
    # Update payment to completed
    payment.worker_id = worker_id
    payment.status = PaymentStatus.COMPLETED
    db.session.commit()
    
    return jsonify({
        'message': 'Payment released to worker',
        'payment': payment.to_dict()
    })


@escrow_bp.route('/refund', methods=['POST'])
@jwt_required()
def refund_payment():
    """Refund escrow payment to employer (job cancelled)"""
    current_user_id = get_current_user_id()
    data = request.get_json()
    
    job_id = data.get('job_id')
    
    if not job_id:
        return jsonify({'error': 'Job ID required'}), 400
    
    # Verify job belongs to employer
    job = Job.query.get(job_id)
    if not job:
        return jsonify({'error': 'Job not found'}), 404
    
    employer = job.employer
    if not employer or employer.user_id != current_user_id:
        return jsonify({'error': 'Not authorized'}), 403
    
    # Find pending escrow payment
    payment = Payment.query.filter_by(
        job_id=job_id,
        payment_type='escrow',
        status=PaymentStatus.PENDING
    ).first()
    
    if not payment:
        return jsonify({'error': 'No escrow payment found'}), 404
    
    # Refund payment
    payment.status = PaymentStatus.REFUNDED
    db.session.commit()
    
    return jsonify({
        'message': 'Payment refunded',
        'payment': payment.to_dict()
    })


@escrow_bp.route('/job/<int:job_id>', methods=['GET'])
@jwt_required()
def get_job_escrow(job_id):
    """Get escrow payment for a job"""
    payment = Payment.query.filter_by(
        job_id=job_id,
        payment_type='escrow'
    ).first()
    
    if not payment:
        return jsonify({'escrow': None})
    
    return jsonify({
        'escrow': {
            'amount': float(payment.amount),
            'platform_fee': float(payment.platform_fee),
            'net_amount': float(payment.net_amount),
            'status': payment.status.value
        }
    })
