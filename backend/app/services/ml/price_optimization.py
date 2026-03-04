# ----- FILE: backend/app/services/ml/price_optimization.py -----
"""
Price Optimization Service - AI-powered price optimization for workers.
"""
from typing import Dict, Any, List, Optional
from sqlalchemy import func
from datetime import datetime, timedelta


class PriceOptimizationService:
    """AI-powered price optimization for workers."""
    
    def __init__(self):
        self.market_rates = {}
    
    def get_recommended_rate(self, worker_id: int, skill_id: Optional[int] = None) -> Dict[str, Any]:
        """Get recommended hourly/daily rate for a worker."""
        from app.models import Worker, WorkerSkill, Skill
        
        worker = Worker.query.get(worker_id)
        if not worker:
            return {'error': 'Worker not found'}
        
        if skill_id:
            return self._get_skill_rate(worker, skill_id)
        
        worker_skills = WorkerSkill.query.filter_by(worker_id=worker_id).all()
        if not worker_skills:
            return {'recommended_rate': 500, 'min_rate': 300, 'max_rate': 1000, 'confidence': 'low'}
        
        rates = []
        for ws in worker_skills:
            rate_info = self._get_skill_rate(worker, ws.skill_id)
            if rate_info.get('recommended_rate'):
                rates.append(rate_info)
        
        if rates:
            avg_rate = sum(r['recommended_rate'] for r in rates) / len(rates)
            min_rate = min(r['min_rate'] for r in rates)
            max_rate = max(r['max_rate'] for r in rates)
            
            return {
                'recommended_rate': round(avg_rate),
                'min_rate': min_rate,
                'max_rate': max_rate,
                'confidence': 'high' if len(rates) > 2 else 'medium',
                'based_on_skills': len(rates)
            }
        
        return {'recommended_rate': 500, 'min_rate': 300, 'max_rate': 1000, 'confidence': 'low'}
    
    def _get_skill_rate(self, worker, skill_id: int) -> Dict[str, Any]:
        from app.models import Worker, WorkerSkill, Skill
        
        skill = Skill.query.get(skill_id)
        
        workers_with_skill = WorkerSkill.query.filter_by(skill_id=skill_id).all()
        
        if not workers_with_skill:
            return {
                'skill_id': skill_id,
                'skill_name': skill.name if skill else 'Unknown',
                'recommended_rate': 500,
                'min_rate': 300,
                'max_rate': 1000,
                'confidence': 'low'
            }
        
        rates = []
        for ws in workers_with_skill:
            w = Worker.query.get(ws.worker_id)
            if w and ws.hourly_rate and w.availability_status == 'available':
                rates.append(float(ws.hourly_rate))
        
        if not rates:
            rates = [500]
        
        rates.sort()
        median = rates[len(rates) // 2]
        
        # Adjust based on experience and rating
        exp_mult = 1.0
        if worker.years_experience:
            if worker.years_experience > 5:
                exp_mult = 1.3
            elif worker.years_experience > 2:
                exp_mult = 1.15
        
        rat_mult = 1.0
        if worker.average_rating:
            if worker.average_rating >= 4.5:
                rat_mult = 1.25
            elif worker.average_rating >= 4.0:
                rat_mult = 1.1
        
        recommended = median * exp_mult * rat_mult
        
        return {
            'skill_id': skill_id,
            'skill_name': skill.name if skill else 'Unknown',
            'market_median': median,
            'recommended_rate': round(recommended),
            'min_rate': round(median * 0.7),
            'max_rate': round(median * 1.3),
            'experience_years': worker.years_experience or 0,
            'current_rating': worker.average_rating or 0,
            'confidence': 'high' if len(rates) > 10 else ('medium' if len(rates) > 5 else 'low'),
            'market_data': {'sample_size': len(rates), 'min': min(rates), 'max': max(rates)}
        }
    
    def get_job_price_range(self, job_id: int) -> Dict[str, Any]:
        from app.models import Job, Worker, WorkerSkill, Skill
        
        job = Job.query.get(job_id)
        if not job:
            return {'error': 'Job not found'}
        
        workers_with_skill = WorkerSkill.query.filter_by(skill_id=job.required_skill_id).all()
        
        if not workers_with_skill:
            return {'job_id': job_id, 'recommended_min': job.pay_min or 500, 'recommended_max': job.pay_max or 1500, 'confidence': 'low'}
        
        rates = []
        for ws in workers_with_skill:
            w = Worker.query.get(ws.worker_id)
            if w and ws.hourly_rate:
                rate = float(ws.hourly_rate)
                if job.required_experience_years and w.years_experience:
                    if w.years_experience >= job.required_experience_years:
                        rates.append(rate)
                else:
                    rates.append(rate)
        
        if not rates:
            rates = [500, 1000]
        
        rates.sort()
        
        return {
            'job_id': job_id,
            'job_title': job.title,
            'required_skill': job.required_skill.name if job.required_skill else 'Unknown',
            'market_min': min(rates),
            'market_max': max(rates),
            'market_median': rates[len(rates) // 2],
            'recommended_min': round(rates[len(rates) // 4]),
            'recommended_max': round(rates[len(rates) * 3 // 4]),
            'sample_size': len(rates),
            'confidence': 'high' if len(rates) > 10 else ('medium' if len(rates) > 5 else 'low')
        }
    
    def get_market_rate(self, skill_id: int, county: Optional[str] = None) -> Dict[str, Any]:
        from app.models import Worker, WorkerSkill, Skill
        
        query = WorkerSkill.query.filter_by(skill_id=skill_id)
        
        workers = []
        for ws in query.all():
            w = Worker.query.get(ws.worker_id)
            if w and ws.hourly_rate:
                if county is None or (w.county and w.county.lower() == county.lower()):
                    workers.append(w)
        
        if not workers:
            return {'skill_id': skill_id, 'recommended_rate': 500, 'min_rate': 300, 'max_rate': 1000, 'confidence': 'low'}
        
        rates = [float(w.hourly_rate) for w in workers if w.hourly_rate]
        rates.sort()
        
        skill = Skill.query.get(skill_id)
        
        return {
            'skill_id': skill_id,
            'skill_name': skill.name if skill else 'Unknown',
            'county': county,
            'recommended_rate': rates[len(rates) // 2],
            'min_rate': rates[0],
            'max_rate': rates[-1],
            'average_rate': round(sum(rates) / len(rates)),
            'sample_size': len(rates),
            'confidence': 'high' if len(rates) > 10 else ('medium' if len(rates) > 5 else 'low'),
            'workers_count': len(workers)
        }


price_optimization_service = PriceOptimizationService()
