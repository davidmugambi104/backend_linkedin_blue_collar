# ----- FILE: backend/app/services/matching_service.py -----
from ..models import Job, Worker, WorkerSkill
from ..utils.geo import calculate_distance
from ..models.job import JobStatus
from datetime import datetime, date


class MatchingService:
    @staticmethod
    def get_job_recommendations_for_worker(worker_id, limit=20, max_distance_km=50):
        """Get job recommendations for a worker."""
        worker = Worker.query.get(worker_id)
        if not worker:
            return []

        worker_skills = WorkerSkill.query.filter_by(worker_id=worker_id).all()
        worker_skill_ids = [ws.skill_id for ws in worker_skills]

        if not worker_skill_ids:
            return []

        jobs = Job.query.filter(
            Job.status == JobStatus.OPEN, 
            Job.required_skill_id.in_(worker_skill_ids)
        ).all()

        scored_jobs = []
        for job in jobs:
            score = MatchingService._calculate_job_match_score(worker, job, worker_skills)
            
            # Filter out jobs too far
            if (worker.location_lat and worker.location_lng and 
                job.location_lat and job.location_lng):
                distance = calculate_distance(
                    worker.location_lat, worker.location_lng,
                    job.location_lat, job.location_lng
                )
                if distance > max_distance_km:
                    continue
                distance_penalty = (distance / max_distance_km) * 0.2
                score *= (1 - distance_penalty)
                job_dict = job.to_dict()
                job_dict["distance_km"] = round(distance, 2)
                job_dict["match_score"] = round(score, 3)
                scored_jobs.append((score, job_dict))
            else:
                job_dict = job.to_dict()
                job_dict["match_score"] = round(score, 3)
                job_dict["distance_km"] = None
                scored_jobs.append((score, job_dict))

        scored_jobs.sort(key=lambda x: x[0], reverse=True)
        return [job for _, job in scored_jobs[:limit]]

    @staticmethod
    def _calculate_job_match_score(worker, job, worker_skills):
        """Calculate match score 0-1."""
        score = 0.0

        # 1. Skill proficiency (35%)
        for ws in worker_skills:
            if ws.skill_id == job.required_skill_id:
                skill_score = (ws.proficiency_level - 1) / 4.0
                score += skill_score * 0.35
                break

        # 2. Worker rating (20%)
        rating_score = min(worker.average_rating / 5.0, 1.0)
        score += rating_score * 0.20

        # 3. Verification (15%)
        score += (1.0 if worker.is_verified else 0.0) * 0.15
        
        # 4. Verification score (10%)
        score += (worker.verification_score / 100.0) * 0.10

        # 5. Availability match (10%)
        if worker.availability_status == "available":
            score += 0.10
        elif worker.availability_status == "busy" and job.pay_max and worker.hourly_rate:
            # Will be available soon - partial match
            score += 0.05

        # 6. Price range match (10%)
        if job.pay_min and job.pay_max and worker.hourly_rate:
            if job.pay_min <= worker.hourly_rate <= job.pay_max:
                score += 0.10
            elif worker.hourly_rate < job.pay_min:
                # Worker wants less than offered - still ok
                score += 0.05

        return min(score, 1.0)

    @staticmethod
    def get_worker_recommendations_for_job(job_id, limit=20, max_distance_km=50):
        """Get worker recommendations for a job."""
        job = Job.query.get(job_id)
        if not job:
            return []

        worker_skills = WorkerSkill.query.filter_by(
            skill_id=job.required_skill_id
        ).all()
        
        if not worker_skills:
            return []

        worker_ids = [ws.worker_id for ws in worker_skills]
        workers = Worker.query.filter(Worker.id.in_(worker_ids)).all()

        scored_workers = []
        for worker in workers:
            ws = next((w for w in worker_skills if w.worker_id == worker.id), None)
            if not ws:
                continue

            score = MatchingService._calculate_worker_match_score(worker, job, ws)

            # Location filter
            if (worker.location_lat and worker.location_lng and 
                job.location_lat and job.location_lng):
                distance = calculate_distance(
                    worker.location_lat, worker.location_lng,
                    job.location_lat, job.location_lng
                )
                if distance > max_distance_km:
                    continue
                distance_penalty = (distance / max_distance_km) * 0.2
                score *= (1 - distance_penalty)
                worker_dict = worker.to_dict()
                worker_dict["distance_km"] = round(distance, 2)
                worker_dict["match_score"] = round(score, 3)
                worker_dict["proficiency_level"] = ws.proficiency_level
                scored_workers.append((score, worker_dict))
            else:
                worker_dict = worker.to_dict()
                worker_dict["match_score"] = round(score, 3)
                worker_dict["distance_km"] = None
                worker_dict["proficiency_level"] = ws.proficiency_level
                scored_workers.append((score, worker_dict))

        scored_workers.sort(key=lambda x: x[0], reverse=True)
        return [worker for _, worker in scored_workers[:limit]]

    @staticmethod
    def _calculate_worker_match_score(worker, job, worker_skill):
        """Calculate match score from employer's perspective."""
        score = 0.0

        # 1. Skill proficiency (35%)
        proficiency_score = (worker_skill.proficiency_level - 1) / 4.0
        score += proficiency_score * 0.35

        # 2. Worker rating (20%)
        score += min(worker.average_rating / 5.0, 1.0) * 0.20

        # 3. Verification (15%)
        score += (1.0 if worker.is_verified else 0.0) * 0.15
        
        # 4. Verification score (10%)
        score += (worker.verification_score / 100.0) * 0.10

        # 5. Availability (10%)
        if worker.availability_status == "available":
            score += 0.10
        elif worker.availability_status == "busy":
            # Check if will be available by job start date
            if job.start_date and worker.next_available_date:
                if worker.next_available_date <= job.start_date:
                    score += 0.05

        # 6. Price fit (10%)
        if job.pay_min and job.pay_max and worker.hourly_rate:
            if job.pay_min <= worker.hourly_rate <= job.pay_max:
                score += 0.10
            elif worker.hourly_rate < job.pay_min:
                score += 0.05

        return min(score, 1.0)

    @staticmethod
    def get_similar_jobs(job_id, limit=10):
        """Get similar jobs based on skill and attributes."""
        job = Job.query.get(job_id)
        if not job:
            return []

        similar_jobs = Job.query.filter(
            Job.id != job_id,
            Job.required_skill_id == job.required_skill_id,
            Job.status == JobStatus.OPEN,
        ).limit(limit * 2).all()

        result = []
        for similar_job in similar_jobs:
            similarity = 0.0

            # Same employer
            if similar_job.employer_id == job.employer_id:
                similarity += 0.3

            # Similar pay range
            if job.pay_min and job.pay_max and similar_job.pay_min and similar_job.pay_max:
                job_mid = (float(job.pay_min) + float(job.pay_max)) / 2
                similar_mid = (float(similar_job.pay_min) + float(similar_job.pay_max)) / 2
                if similar_mid > 0:
                    pay_diff = abs(job_mid - similar_mid) / similar_mid
                    if pay_diff <= 0.2:
                        similarity += 0.3
                    else:
                        similarity += max(0, 0.3 - (pay_diff - 0.2))

            # Similar location
            if (job.location_lat and job.location_lng and 
                similar_job.location_lat and similar_job.location_lng):
                distance = calculate_distance(
                    job.location_lat, job.location_lng,
                    similar_job.location_lat, similar_job.location_lng
                )
                if distance <= 10:
                    similarity += 0.4
                elif distance <= 50:
                    similarity += 0.2

            job_dict = similar_job.to_dict()
            job_dict["similarity_score"] = round(min(similarity, 1.0), 3)
            result.append((similarity, job_dict))

        result.sort(key=lambda x: x[0], reverse=True)
        return [job for _, job in result[:limit]]

    @staticmethod
    def search_workers(filters):
        """Advanced worker search with matching."""
        query = Worker.query

        # Filter by skills
        if "skill_ids" in filters:
            worker_ids = [ws.worker_id for ws in 
                WorkerSkill.query.filter(WorkerSkill.skill_id.in_(filters["skill_ids"])).all()]
            if worker_ids:
                query = query.filter(Worker.id.in_(worker_ids))
            else:
                return []

        # Filter by availability
        if "availability_status" in filters:
            query = query.filter(Worker.availability_status == filters["availability_status"])

        # Filter by county
        if "county" in filters:
            query = query.filter(Worker.county == filters["county"])

        # Filter by min rating
        if "min_rating" in filters:
            query = query.filter(Worker.average_rating >= filters["min_rating"])

        # Filter by verified only
        if "verified_only" in filters and filters["verified_only"]:
            query = query.filter(Worker.is_verified == True)

        # Filter by max hourly rate
        if "max_rate" in filters:
            query = query.filter(Worker.hourly_rate <= filters["max_rate"])

        workers = query.all()
        
        result = []
        for worker in workers:
            worker_dict = worker.to_dict()
            
            if ("location_lat" in filters and "location_lng" in filters and 
                worker.location_lat and worker.location_lng):
                distance = calculate_distance(
                    filters["location_lat"], filters["location_lng"],
                    worker.location_lat, worker.location_lng
                )
                
                if "max_distance_km" in filters:
                    if distance > filters["max_distance_km"]:
                        continue
                        
                worker_dict["distance_km"] = round(distance, 2)
            
            result.append(worker_dict)
            
        return result

    @staticmethod
    def search_jobs(filters):
        """Advanced job search with matching."""
        query = Job.query.filter(Job.status == JobStatus.OPEN)

        # Filter by skills
        if "skill_id" in filters:
            query = query.filter(Job.required_skill_id == filters["skill_id"])

        # Filter by county
        if "county" in filters:
            query = query.filter(Job.county == filters["county"])

        # Filter by pay range
        if "pay_min" in filters:
            query = query.filter(Job.pay_max >= filters["pay_min"])
        if "pay_max" in filters:
            query = query.filter(Job.pay_min <= filters["pay_max"])

        # Filter by experience
        if "min_experience" in filters:
            query = query.filter(
                Job.required_experience_years >= filters["min_experience"]
            )

        # Filter by number of workers needed
        if "fundis_needed" in filters:
            query = query.filter(Job.number_of_fundis_needed >= filters["fundis_needed"])

        jobs = query.order_by(Job.created_at.desc()).all()

        result = []
        for job in jobs:
            job_dict = job.to_dict()
            
            if ("location_lat" in filters and "location_lng" in filters and 
                job.location_lat and job.location_lng):
                distance = calculate_distance(
                    filters["location_lat"], filters["location_lng"],
                    job.location_lat, job.location_lng
                )
                
                if "radius_km" in filters:
                    if distance > filters["radius_km"]:
                        continue
                        
                job_dict["distance_km"] = round(distance, 2)
            
            # Add employer info
            job_dict["employer"] = job.employer.to_dict() if job.employer else None
            
            result.append(job_dict)
            
        return result
