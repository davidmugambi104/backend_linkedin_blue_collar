"""
Real-time Geospatial Matching Service
Uber-style proximity system for instant job-worker matching
"""
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
from math import radians, cos, sin, asin, sqrt
import json
from flask_socketio import emit
from app import socketio
from app.models import Job, Worker, WorkerSkill
from app.extensions import db, redis_cache
import logging

logger = logging.getLogger(__name__)


class GeospatialMatchingEngine:
    """Real-time geospatial matching for workers and jobs."""
    
    # Redis key prefixes
    WORKER_LOCATION_KEY = "worker:location:"
    JOB_GEOCACHE_KEY = "job:geo:"
    ACTIVE_WORKERS_KEY = "workers:active"
    JOB_BROADCAST_KEY = "job:broadcast:"
    
    def __init__(self):
        self.max_search_radius_km = 50
        self.notification_radius_km = 10
        self.match_weights = {
            'skill': 0.35,
            'distance': 0.25,
            'rating': 0.15,
            'verification': 0.15,
            'availability': 0.10
        }
    
    # -------------------------------------------------------------------------
    # Location Tracking
    # -------------------------------------------------------------------------
    
    def update_worker_location(self, worker_id: int, lat: float, lng: float) -> bool:
        """Update worker's current location."""
        try:
            location_data = {
                'worker_id': worker_id,
                'lat': lat,
                'lng': lng,
                'timestamp': datetime.utcnow().isoformat()
            }
            
            # Store in Redis with 1-hour expiry
            key = f"{self.WORKER_LOCATION_KEY}{worker_id}"
            redis_cache.setex(key, 3600, json.dumps(location_data))
            
            # Add to active workers set
            redis_cache.sadd(self.ACTIVE_WORKERS_KEY, worker_id)
            
            # Check for nearby jobs
            self._check_and_notify_matching_jobs(worker_id, lat, lng)
            
            return True
        except Exception as e:
            logger.error(f"Error updating location: {e}")
            return False
    
    def get_worker_location(self, worker_id: int) -> Optional[Dict]:
        """Get worker's last known location."""
        try:
            key = f"{self.WORKER_LOCATION_KEY}{worker_id}"
            data = redis_cache.get(key)
            return json.loads(data) if data else None
        except Exception as e:
            logger.error(f"Error getting location: {e}")
            return None
    
    def get_nearby_workers(self, lat: float, lng: float, radius_km: float = 10) -> List[Dict]:
        """Get all workers within radius of a location."""
        try:
            # Get all active workers
            worker_ids = redis_cache.smembers(self.ACTIVE_WORKERS_KEY)
            
            nearby = []
            for worker_id in worker_ids:
                location = self.get_worker_location(int(worker_id))
                if location:
                    distance = self.haversine_distance(
                        lat, lng, 
                        location['lat'], location['lng']
                    )
                    if distance <= radius_km:
                        nearby.append({
                            'worker_id': int(worker_id),
                            'distance_km': round(distance, 2),
                            'location': location
                        })
            
            return sorted(nearby, key=lambda x: x['distance_km'])
        except Exception as e:
            logger.error(f"Error getting nearby workers: {e}")
            return []
    
    # -------------------------------------------------------------------------
    # Real-time Job Matching
    # -------------------------------------------------------------------------
    
    def _check_and_notify_matching_jobs(self, worker_id: int, lat: float, lng: float):
        """Check for matching jobs near worker and notify via WebSocket."""
        try:
            worker = Worker.query.get(worker_id)
            if not worker or worker.availability_status != 'available':
                return
            
            # Get worker skills
            worker_skills = WorkerSkill.query.filter_by(worker_id=worker_id).all()
            skill_ids = [ws.skill_id for ws in worker_skills]
            
            if not skill_ids:
                return
            
            # Find open jobs matching skills within radius
            jobs = Job.query.filter(
                Job.status == 'open',
                Job.required_skill_id.in_(skill_ids)
            ).all()
            
            matching_jobs = []
            for job in jobs:
                if job.location_lat and job.location_lng:
                    distance = self.haversine_distance(
                        lat, lng, 
                        job.location_lat, job.location_lng
                    )
                    
                    if distance <= self.notification_radius_km:
                        match_score = self._calculate_match_score(worker, job, worker_skills)
                        matching_jobs.append({
                            'job': job.to_dict(),
                            'distance_km': round(distance, 2),
                            'match_score': round(match_score, 2)
                        })
            
            if matching_jobs:
                # Emit to specific worker
                socketio.emit('new_job_matches', {
                    'worker_id': worker_id,
                    'jobs': matching_jobs,
                    'count': len(matching_jobs)
                }, room=f'worker_{worker_id}')
                
                logger.info(f"Notified worker {worker_id} of {len(matching_jobs)} new jobs")
        
        except Exception as e:
            logger.error(f"Error in job notification: {e}")
    
    def broadcast_new_job(self, job_id: int):
        """Broadcast new job to nearby workers."""
        try:
            job = Job.query.get(job_id)
            if not job or not job.location_lat:
                return
            
            # Get workers with matching skills
            matching_workers = self.find_matching_workers_for_job(
                job_id, 
                limit=50,
                radius_km=self.notification_radius_km
            )
            
            # Emit to all matching workers
            job_data = job.to_dict()
            for worker_info in matching_workers:
                socketio.emit('job_alert', {
                    'job': job_data,
                    'match_score': worker_info['match_score'],
                    'distance_km': worker_info['distance_km']
                }, room=f"worker_{worker_info['worker_id']}")
            
            logger.info(f"Broadcast job {job_id} to {len(matching_workers)} workers")
            
        except Exception as e:
            logger.error(f"Error broadcasting job: {e}")
    
    def find_matching_workers_for_job(
        self, 
        job_id: int, 
        limit: int = 20, 
        radius_km: float = 50,
        min_match_score: float = 0.5
    ) -> List[Dict]:
        """Find best matching workers for a job within radius."""
        try:
            job = Job.query.get(job_id)
            if not job:
                return []
            
            # Get workers with required skill
            worker_skills = WorkerSkill.query.filter_by(
                skill_id=job.required_skill_id
            ).all()
            
            matches = []
            for ws in worker_skills:
                worker = Worker.query.get(ws.worker_id)
                if not worker or worker.availability_status == 'unavailable':
                    continue
                
                # Get location from Redis or DB
                location = self.get_worker_location(worker.id)
                if location:
                    lat, lng = location['lat'], location['lng']
                else:
                    lat, lng = worker.location_lat, worker.location_lng
                
                if not lat or not lng:
                    continue
                
                # Calculate distance
                distance = self.haversine_distance(
                    job.location_lat, job.location_lng, lat, lng
                )
                
                if distance > radius_km:
                    continue
                
                # Calculate match score
                match_score = self._calculate_match_score(worker, job, [ws])
                
                if match_score >= min_match_score:
                    matches.append({
                        'worker_id': worker.id,
                        'worker': worker.to_dict(),
                        'match_score': round(match_score, 2),
                        'distance_km': round(distance, 2),
                        'skill_proficiency': ws.proficiency_level
                    })
            
            # Sort by match score
            matches.sort(key=lambda x: x['match_score'], reverse=True)
            return matches[:limit]
            
        except Exception as e:
            logger.error(f"Error finding matching workers: {e}")
            return []
    
    # -------------------------------------------------------------------------
    # Matching Algorithm
    # -------------------------------------------------------------------------
    
    def _calculate_match_score(self, worker: Worker, job: Job, worker_skills: List) -> float:
        """Calculate comprehensive match score 0-1."""
        score = 0.0
        
        # 1. Skill match (35%)
        for ws in worker_skills:
            if ws.skill_id == job.required_skill_id:
                proficiency_scores = {
                    'beginner': 0.4,
                    'intermediate': 0.7,
                    'expert': 0.9,
                    'master': 1.0
                }
                skill_score = proficiency_scores.get(ws.proficiency_level, 0.5)
                score += skill_score * self.match_weights['skill']
                break
        
        # 2. Distance (25%) - handled separately, returns 0-1
        # Called after distance is known
        
        # 3. Rating (15%)
        rating_score = min((worker.average_rating or 0) / 5.0, 1.0)
        score += rating_score * self.match_weights['rating']
        
        # 4. Verification (15%)
        verification_score = (worker.is_verified or worker.verification_score > 50)
        score += (1.0 if verification_score else 0.0) * self.match_weights['verification']
        
        # 5. Availability (10%)
        if worker.availability_status == 'available':
            score += self.match_weights['availability']
        elif worker.availability_status == 'busy':
            score += self.match_weights['availability'] * 0.3
        
        return min(score, 1.0)
    
    def calculate_distance_score(self, distance_km: float, max_radius_km: float = 50) -> float:
        """Calculate distance score (closer = higher)."""
        if distance_km >= max_radius_km:
            return 0.0
        return 1.0 - (distance_km / max_radius_km)
    
    # -------------------------------------------------------------------------
    # Geospatial Utilities
    # -------------------------------------------------------------------------
    
    @staticmethod
    def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """
        Calculate the great circle distance in kilometers between two points.
        """
        # Convert to radians
        lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
        
        # Haversine formula
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
        c = 2 * asin(sqrt(a))
        
        # Earth radius in kilometers
        r = 6371
        
        return c * r
    
    @staticmethod
    def is_within_radius(lat1: float, lon1: float, lat2: float, lon2: float, radius_km: float) -> bool:
        """Check if point 2 is within radius of point 1."""
        distance = GeospatialMatchingEngine.haversine_distance(lat1, lon1, lat2, lon2)
        return distance <= radius_km


# Singleton instance
geo_matcher = GeospatialMatchingEngine()
