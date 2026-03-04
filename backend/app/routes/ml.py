# ----- FILE: backend/app/routes/ml.py -----
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from ..services.ml.fraud_detection import fraud_detection_service
from ..services.ml.skill_recommendations import skill_recommendation_service
from ..services.ml.price_optimization import price_optimization_service

ml_bp = Blueprint('ml', __name__, url_prefix='/api/ml')


# === Fraud Detection ===

@ml_bp.route('/fraud/user/<int:user_id>', methods=['GET'])
@jwt_required()
def analyze_user_fraud(user_id):
    """Analyze user for fraud risk."""
    result = fraud_detection_service.analyze_user(user_id)
    return jsonify(result), 200


@ml_bp.route('/fraud/transaction/<int:payment_id>', methods=['GET'])
@jwt_required()
def analyze_transaction_fraud(payment_id):
    """Analyze transaction for fraud."""
    result = fraud_detection_service.analyze_transaction(payment_id)
    return jsonify(result), 200


# === Skill Recommendations ===

@ml_bp.route('/recommendations/skills/<int:worker_id>', methods=['GET'])
@jwt_required()
def get_skill_recommendations(worker_id):
    """Get skill recommendations for worker."""
    top_n = request.args.get('top_n', 5, type=int)
    result = skill_recommendation_service.get_recommendations(worker_id, top_n)
    return jsonify({
        'worker_id': worker_id,
        'recommendations': result
    }), 200


@ml_bp.route('/recommendations/trends', methods=['GET'])
def get_skill_trends():
    """Get skill market trends."""
    result = skill_recommendation_service.get_market_trends()
    return jsonify(result), 200


# === Price Optimization ===

@ml_bp.route('/price/worker/<int:worker_id>', methods=['GET'])
@jwt_required()
def get_worker_price(worker_id):
    """Get price recommendation for worker."""
    skill_id = request.args.get('skill_id', type=int)
    result = price_optimization_service.get_recommended_rate(worker_id, skill_id)
    return jsonify(result), 200


@ml_bp.route('/price/job/<int:job_id>', methods=['GET'])
def get_job_price(job_id):
    """Get price recommendation for job."""
    result = price_optimization_service.get_job_price_range(job_id)
    return jsonify(result), 200


@ml_bp.route('/price/market/<int:skill_id>', methods=['GET'])
def get_market_rate(skill_id):
    """Get market rate for skill."""
    county = request.args.get('county')
    result = price_optimization_service.get_market_rate(skill_id, county)
    return jsonify(result), 200
