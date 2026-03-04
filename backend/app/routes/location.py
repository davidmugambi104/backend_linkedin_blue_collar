"""
Real-time Location API Routes
Worker location tracking and real-time job matching
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.geo_matching_service import geo_matcher
from app.models import Worker
from app.extensions import db
from datetime import datetime

location_bp = Blueprint('location', __name__)


@location_bp.route('/update-location', methods=['POST'])
@jwt_required()
def update_location():
    """Update worker's current location."""
    user_id = get_jwt_identity()
    
    # Get worker profile
    worker = Worker.query.filter_by(user_id=user_id).first()
    if not worker:
        return jsonify({'error': 'Worker profile not found'}), 404
    
    data = request.get_json()
    
    if not data or 'lat' not in data or 'lng' not in data:
        return jsonify({'error': 'lat and lng required'}), 400
    
    lat = float(data['lat'])
    lng = float(data['lng'])
    
    # Validate coordinates
    if not (-90 <= lat <= 90) or not (-180 <= lng <= 180):
        return jsonify({'error': 'Invalid coordinates'}), 400
    
    # Update in database
    worker.location_lat = lat
    worker.location_lng = lng
    db.session.commit()
    
    # Update in Redis for real-time matching
    geo_matcher.update_worker_location(worker.id, lat, lng)
    
    return jsonify({
        'success': True,
        'message': 'Location updated',
        'location': {'lat': lat, 'lng': lng}
    })


@location_bp.route('/my-location', methods=['GET'])
@jwt_required()
def get_my_location():
    """Get worker's current location."""
    user_id = get_jwt_identity()
    
    worker = Worker.query.filter_by(user_id=user_id).first()
    if not worker:
        return jsonify({'error': 'Worker profile not found'}), 404
    
    # Try Redis first, fallback to DB
    location = geo_matcher.get_worker_location(worker.id)
    
    if not location:
        location = {
            'lat': worker.location_lat,
            'lng': worker.location_lng,
            'timestamp': worker.updated_at.isoformat() if worker.updated_at else None
        }
    
    return jsonify(location)


@location_bp.route('/nearby-jobs', methods=['GET'])
@jwt_required()
def get_nearby_jobs():
    """Get jobs near worker."""
    user_id = get_jwt_identity()
    
    worker = Worker.query.filter_by(user_id=user_id).first()
    if not worker:
        return jsonify({'error': 'Worker profile not found'}), 404
    
    # Get location
    location = geo_matcher.get_worker_location(worker.id)
    if not location:
        if not worker.location_lat or not worker.location_lng:
            return jsonify({'error': 'Location not set'}), 400
        location = {'lat': worker.location_lat, 'lng': worker.location_lng}
    
    radius = request.args.get('radius', 10, type=float)
    limit = request.args.get('limit', 20, type=int)
    
    # Get nearby workers (which includes checking their distance from jobs)
    # Actually we need to get nearby JOBS, not workers
    from app.models import Job
    from app.services.geo_matching_service import GeospatialMatchingEngine
    
    jobs = Job.query.filter(Job.status == 'open').all()
    
    nearby_jobs = []
    for job in jobs:
        if job.location_lat and job.location_lng:
            distance = GeospatialMatchingEngine.haversine_distance(
                location['lat'], location['lng'],
                job.location_lat, job.location_lng
            )
            if distance <= radius:
                job_dict = job.to_dict()
                job_dict['distance_km'] = round(distance, 2)
                nearby_jobs.append(job_dict)
    
    nearby_jobs.sort(key=lambda x: x['distance_km'])
    
    return jsonify({
        'jobs': nearby_jobs[:limit],
        'location': location,
        'radius_km': radius
    })


@location_bp.route('/nearby-workers', methods=['GET'])
@jwt_required()
def get_nearby_workers():
    """Get workers near a location (for employers)."""
    lat = request.args.get('lat', type=float)
    lng = request.args.get('lng', type=float)
    radius = request.args.get('radius', 10, type=float)
    
    if not lat or not lng:
        return jsonify({'error': 'lat and lng required'}), 400
    
    nearby = geo_matcher.get_nearby_workers(lat, lng, radius)
    
    return jsonify({
        'workers': nearby,
        'count': len(nearby)
    })


@location_bp.route('/job/<int:job_id>/matches', methods=['GET'])
@jwt_required()
def get_job_matches(job_id):
    """Get matching workers for a job (real-time)."""
    radius = request.args.get('radius', 50, type=float)
    limit = request.args.get('limit', 20, type=int)
    min_score = request.args.get('min_score', 0.5, type=float)
    
    matches = geo_matcher.find_matching_workers_for_job(
        job_id, 
        limit=limit,
        radius_km=radius,
        min_match_score=min_score
    )
    
    return jsonify({
        'job_id': job_id,
        'matches': matches,
        'count': len(matches)
    })


@location_bp.route('/broadcast-job/<int:job_id>', methods=['POST'])
@jwt_required()
def broadcast_job(job_id):
    """Broadcast a new job to nearby workers."""
    # This would typically be admin-only
    geo_matcher.broadcast_new_job(job_id)
    
    return jsonify({
        'success': True,
        'message': f'Job {job_id} broadcast to matching workers'
    })
