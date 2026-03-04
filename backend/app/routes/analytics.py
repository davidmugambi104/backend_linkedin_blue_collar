# ----- FILE: backend/app/routes/analytics.py -----
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from ..services.analytics_service import analytics_service
from ..utils.permissions import admin_required
from ..models.user import User
from ..extensions import db

analytics_bp = Blueprint('analytics', __name__, url_prefix='/api/analytics')


@analytics_bp.route('/overview', methods=['GET'])
def get_overview():
    """Get platform overview statistics."""
    stats = analytics_service.get_platform_stats()
    return jsonify(stats), 200


@analytics_bp.route('/growth', methods=['GET'])
def get_growth():
    """Get growth metrics."""
    days = request.args.get('days', 30, type=int)
    metrics = analytics_service.get_growth_metrics(days)
    return jsonify(metrics), 200


@analytics_bp.route('/skills', methods=['GET'])
def get_skills_analytics():
    """Get skills analytics."""
    analytics = analytics_service.get_skills_analytics()
    return jsonify(analytics), 200


@analytics_bp.route('/location', methods=['GET'])
def get_location_analytics():
    """Get location analytics."""
    analytics = analytics_service.get_location_analytics()
    return jsonify(analytics), 200


@analytics_bp.route('/worker/<int:worker_id>', methods=['GET'])
@jwt_required()
def get_worker_analytics(worker_id):
    """Get worker-specific analytics."""
    analytics = analytics_service.get_worker_analytics(worker_id)
    return jsonify(analytics), 200


@analytics_bp.route('/worker/<int:worker_id>/ranking', methods=['GET'])
@jwt_required()
def get_worker_ranking(worker_id):
    """Get worker ranking."""
    skill_id = request.args.get('skill_id', type=int)
    ranking = analytics_service.get_worker_ranking(worker_id, skill_id)
    return jsonify(ranking), 200


@analytics_bp.route('/employer/<int:employer_id>', methods=['GET'])
@jwt_required()
def get_employer_analytics(employer_id):
    """Get employer-specific analytics."""
    analytics = analytics_service.get_employer_analytics(employer_id)
    return jsonify(analytics), 200


@analytics_bp.route('/job/<int:job_id>', methods=['GET'])
def get_job_analytics(job_id):
    """Get job-specific analytics."""
    analytics = analytics_service.get_job_analytics(job_id)
    return jsonify(analytics), 200
