# ----- FILE: backend/app/routes/payments.py -----
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..extensions import db
from ..models.payment import Payment, PaymentStatus
from ..models.user import User
from ..services.mpesa_service import mpesa_service
import uuid

payments_bp = Blueprint('payments', __name__, url_prefix='/api/payments')


@payments_bp.route('/deposit', methods=['POST'])
@jwt_required()
def initiate_deposit():
    """Initiate STK Push for deposit to wallet"""
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    phone = data.get('phone')
    amount = data.get('amount')
    reference = data.get('reference', f"deposit_{uuid.uuid4().hex[:8]}")
    
    if not phone or not amount:
        return jsonify({'error': 'Phone and amount required'}), 400
    
    if amount < 1:
        return jsonify({'error': 'Minimum amount is 1'}), 400
    
    # Initiate STK Push
    result = mpesa_service.stk_push(
        phone=phone,
        amount=int(amount),
        reference=reference,
        description=f"Wallet deposit for user {current_user_id}"
    )
    
    if result.get('success'):
        # Create pending payment record
        payment = Payment(
            user_id=current_user_id,
            amount=amount,
            payment_type='deposit',
            reference=reference,
            status=PaymentStatus.PENDING,
            provider='mpesa',
            provider_reference=result.get('checkout_request_id'),
            phone=phone
        )
        db.session.add(payment)
        db.session.commit()
        
        return jsonify({
            'message': 'Payment initiated. Check your phone for STK prompt.',
            'checkout_request_id': result.get('checkout_request_id'),
            'payment_id': payment.id,
            'mock': result.get('mock', False)
        }), 200
    else:
        return jsonify({'error': result.get('error', 'Payment failed')}), 400


@payments_bp.route('/withdraw', methods=['POST'])
@jwt_required()
def initiate_withdraw():
    """Initiate B2C for withdrawal to phone"""
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    phone = data.get('phone')
    amount = data.get('amount')
    
    if not phone or not amount:
        return jsonify({'error': 'Phone and amount required'}), 400
    
    if amount < 10:
        return jsonify({'error': 'Minimum withdrawal is 10'}), 400
    
    # Create payment record first
    reference = f"withdraw_{uuid.uuid4().hex[:8]}"
    payment = Payment(
        user_id=current_user_id,
        amount=amount,
        payment_type='withdrawal',
        reference=reference,
        status=PaymentStatus.PENDING,
        provider='mpesa',
        phone=phone
    )
    db.session.add(payment)
    db.session.commit()
    
    # Initiate B2C payment
    result = mpesa_service.b2c_payment(
        phone=phone,
        amount=int(amount),
        remark=f"Withdrawal {reference}"
    )
    
    if result.get('success'):
        payment.provider_reference = result.get('conversation_id')
        payment.status = PaymentStatus.PROCESSING
        db.session.commit()
        
        return jsonify({
            'message': 'Withdrawal initiated',
            'conversation_id': result.get('conversation_id'),
            'payment_id': payment.id,
            'mock': result.get('mock', False)
        }), 200
    else:
        payment.status = PaymentStatus.FAILED
        db.session.commit()
        return jsonify({'error': result.get('error', 'Withdrawal failed')}), 400


@payments_bp.route('/status/<checkout_request_id>', methods=['GET'])
@jwt_required()
def check_payment_status(checkout_request_id):
    """Check status of a payment"""
    result = mpesa_service.check_transaction_status(checkout_request_id)
    
    # Update payment record if found
    payment = Payment.query.filter_by(provider_reference=checkout_request_id).first()
    if payment:
        if result.get('result_code') == '0':
            payment.status = PaymentStatus.COMPLETED
        elif result.get('result_code'):
            payment.status = PaymentStatus.FAILED
        db.session.commit()
    
    return jsonify({
        'status': result,
        'payment': payment.to_dict() if payment else None
    })


@payments_bp.route('/my', methods=['GET'])
@jwt_required()
def my_payments():
    """Get user's payment history"""
    current_user_id = get_jwt_identity()
    
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    payments = Payment.query.filter_by(user_id=current_user_id)\
        .order_by(Payment.created_at.desc())\
        .paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'payments': [p.to_dict() for p in payments.items],
        'total': payments.total,
        'pages': payments.pages,
        'current_page': page
    })


@payments_bp.route('/<int:payment_id>', methods=['GET'])
@jwt_required()
def get_payment(payment_id):
    """Get specific payment details"""
    current_user_id = get_jwt_identity()
    
    payment = Payment.query.filter_by(
        id=payment_id, 
        user_id=current_user_id
    ).first()
    
    if not payment:
        return jsonify({'error': 'Payment not found'}), 404
    
    return jsonify({'payment': payment.to_dict()})


@payments_bp.route('/callback', methods=['POST'])
def mpesa_callback():
    """M-Pesa callback URL for transaction confirmation"""
    data = request.get_json()
    
    # Extract transaction details from callback
    body = data.get('Body', {})
    stk_callback = body.get('stkCallback', {})
    
    checkout_request_id = stk_callback.get('CheckoutRequestID')
    result_code = stk_callback.get('ResultCode')
    
    # Find and update payment
    payment = Payment.query.filter_by(provider_reference=checkout_request_id).first()
    if payment:
        if result_code == 0:
            # Get amount from callback metadata
            callback_metadata = stk_callback.get('CallbackMetadata', {}).get('Item', [])
            amount = None
            for item in callback_metadata:
                if item.get('Name') == 'Amount':
                    amount = item.get('Value')
            
            payment.status = PaymentStatus.COMPLETED
            if amount:
                payment.amount = amount
        else:
            payment.status = PaymentStatus.FAILED
        
        db.session.commit()
    
    return jsonify({'status': 'received'})


@payments_bp.route('/config', methods=['GET'])
def get_payment_config():
    """Get payment configuration (for frontend)"""
    return jsonify({
        'providers': ['mpesa'],
        'minimum_deposit': 1,
        'minimum_withdrawal': 10,
        'mock_mode': True  # Set to False when real credentials configured
    })
