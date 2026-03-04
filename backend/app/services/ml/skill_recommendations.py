# ----- FILE: backend/app/services/ml/skill_recommendations.py -----
"""
Skill Recommendation Service - AI-powered skill recommendations for workers.
"""
from typing import Dict, Any, List
from sqlalchemy import func


class SkillRecommendationService:
    """AI-powered skill recommendations for workers."""
    
    def __init__(self):
        self.weights = {
            'market_demand': 0.35,
            'earnings_potential': 0.30,
            'worker_affinity': 0.20,
            'growth_trend': 0.15
        }
    
    def get_recommendations(self, worker_id: int, top_n: int = 5) -> List[Dict[str, Any]]:
        """Get skill recommendations for a worker."""
        from app.models import Worker, WorkerSkill, Skill, Job
        
        worker = Worker.query.get(worker_id)
        if not worker:
            return []
        
        current_skills = WorkerSkill.query.filter_by(worker_id=worker_id).all()
        current_skill_ids = [ws.skill_id for ws in current_skills]
        
        all_skills = Skill.query.all()
        
        recommendations = []
        for skill in all_skills:
            if skill.id in current_skill_ids:
                continue
            
            score = self._calculate_recommendation_score(skill, worker, current_skill_ids)
            if score > 0.3:
                recommendations.append({
                    'skill': skill.to_dict(),
                    'score': round(score, 3),
                    'reasons': self._get_recommendation_reasons(skill, worker)
                })
        
        recommendations.sort(key=lambda x: x['score'], reverse=True)
        return recommendations[:top_n]
    
    def _calculate_recommendation_score(self, skill, worker, current_skill_ids: List[int]) -> float:
        from app.models import WorkerSkill, Job
        from app.extensions import db
        
        scores = {}
        
        # Market demand
        jobs_with_skill = Job.query.filter_by(required_skill_id=skill.id).count()
        max_jobs = db.session.query(func.count(Job.id)).scalar() or 1
        scores['market_demand'] = min(jobs_with_skill / max_jobs * 100, 1.0)
        
        # Earnings potential
        workers_with_skill = WorkerSkill.query.filter_by(skill_id=skill.id).all()
        if workers_with_skill:
            rates = [float(w.hourly_rate or 0) for w in workers_with_skill if w.hourly_rate]
            if rates:
                avg_rate = sum(rates) / len(rates)
                max_rate = db.session.query(func.max(WorkerSkill.hourly_rate)).scalar() or 1
                scores['earnings_potential'] = (avg_rate / max_rate) if max_rate > 0 else 0
            else:
                scores['earnings_potential'] = 0.5
        else:
            scores['earnings_potential'] = 0.5
        
        # Worker affinity
        similar_worker_ids = set()
        for sid in current_skill_ids:
            similar = WorkerSkill.query.filter_by(skill_id=sid).all()
            similar_worker_ids.update([w.worker_id for w in similar])
        
        if similar_worker_ids:
            similar_with_new = WorkerSkill.query.filter(
                WorkerSkill.worker_id.in_(similar_worker_ids),
                WorkerSkill.skill_id == skill.id
            ).count()
            scores['worker_affinity'] = similar_with_new / len(similar_worker_ids)
        else:
            scores['worker_affinity'] = 0.5
        
        scores['growth_trend'] = 0.5
        
        return sum(scores[key] * self.weights[key] for key in self.weights)
    
    def _get_recommendation_reasons(self, skill, worker) -> List[str]:
        from app.models import WorkerSkill, Job
        reasons = []
        
        job_count = Job.query.filter_by(required_skill_id=skill.id).count()
        if job_count > 10:
            reasons.append(f"High demand ({job_count} jobs)")
        
        workers_with_skill = WorkerSkill.query.filter_by(skill_id=skill.id).all()
        if workers_with_skill:
            rates = [float(w.hourly_rate or 0) for w in workers_with_skill if w.hourly_rate]
            if rates:
                avg_rate = sum(rates) / len(rates)
                if avg_rate > 500:
                    reasons.append(f"Good earning potential (KES {avg_rate:,.0f}/day)")
        
        return reasons
    
    def get_market_trends(self) -> Dict[str, Any]:
        from app.models import Skill, WorkerSkill, Job
        from app.extensions import db
        
        skills_by_demand = db.session.query(
            Skill.id, Skill.name, func.count(Job.id).label('job_count')
        ).join(Job, Job.required_skill_id == Skill.id).group_by(Skill.id).order_by(
            func.count(Job.id).desc()
        ).limit(10).all()
        
        skills_by_supply = db.session.query(
            Skill.id, Skill.name, func.count(WorkerSkill.worker_id).label('worker_count')
        ).join(WorkerSkill, WorkerSkill.skill_id == Skill.id).group_by(Skill.id).order_by(
            func.count(WorkerSkill.worker_id).desc()
        ).limit(10).all()
        
        demand_dict = {s.id: s.job_count for s in skills_by_demand}
        
        trends = []
        for skill in Skill.query.all():
            job_count = demand_dict.get(skill.id, 0)
            worker_count = WorkerSkill.query.filter_by(skill_id=skill.id).count()
            
            if worker_count > 0:
                ratio = job_count / worker_count
                status = 'high_demand' if ratio > 1 else ('balanced' if ratio > 0.5 else 'oversaturated')
            else:
                ratio = 0
                status = 'unknown'
            
            trends.append({
                'skill_id': skill.id,
                'skill_name': skill.name,
                'job_count': job_count,
                'worker_count': worker_count,
                'demand_ratio': round(ratio, 2),
                'status': status
            })
        
        trends.sort(key=lambda x: x['demand_ratio'], reverse=True)
        
        return {
            'trends': trends[:20],
            'top_demanded': [{'name': s.name, 'jobs': s.job_count} for s in skills_by_demand],
            'top_supplied': [{'name': s.name, 'workers': s.worker_count} for s in skills_by_supply]
        }


skill_recommendation_service = SkillRecommendationService()
