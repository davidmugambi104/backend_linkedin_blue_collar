# ----- FILE: backend/app/services/matching_service.py -----
from ..models import Job, Worker, WorkerSkill
from ..utils.geo import calculate_distance


class MatchingService:
    @staticmethod
    def get_job_recommendations_for_worker(worker_id, limit=20, max_distance_km=50):
        """
        Get job recommendations for a worker.

        Args:
            worker_id: ID of the worker
            limit: Maximum number of recommendations to return
            max_distance_km: Maximum distance in kilometers for location filtering

        Returns:
            List of jobs with match scores, sorted by score descending
        """
        worker = Worker.query.get(worker_id)
        if not worker:
            return []

        # Get worker's skills
        worker_skills = WorkerSkill.query.filter_by(worker_id=worker_id).all()
        worker_skill_ids = [ws.skill_id for ws in worker_skills]

        if not worker_skill_ids:
            return []

        # Get open jobs that require skills the worker has
        from ..models.job import JobStatus

        jobs = Job.query.filter(
            Job.status == JobStatus.OPEN, Job.required_skill_id.in_(worker_skill_ids)
        ).all()

        # Calculate match score for each job
        scored_jobs = []
        for job in jobs:
            score = MatchingService._calculate_job_match_score(
                worker, job, worker_skills
            )

            # Check location
            if (
                worker.location_lat
                and worker.location_lng
                and job.location_lat
                and job.location_lng
            ):
                distance = calculate_distance(
                    worker.location_lat,
                    worker.location_lng,
                    job.location_lat,
                    job.location_lng,
                )
                if distance <= max_distance_km:
                    # Adjust score based on distance (closer is better)
                    distance_penalty = (
                        distance / max_distance_km
                    ) * 0.2  # Up to 20% penalty
                    score *= 1 - distance_penalty
                    job_dict = job.to_dict()
                    job_dict["distance_km"] = distance
                    job_dict["match_score"] = score
                    scored_jobs.append((score, job_dict))
            else:
                # No location data, just use the score
                job_dict = job.to_dict()
                job_dict["match_score"] = score
                job_dict["distance_km"] = None
                scored_jobs.append((score, job_dict))

        # Sort by score descending
        scored_jobs.sort(key=lambda x: x[0], reverse=True)

        # Return top N jobs
        return [job for _, job in scored_jobs[:limit]]

    @staticmethod
    def _calculate_job_match_score(worker, job, worker_skills):
        """
        Calculate match score between a worker and a job.
        Score ranges from 0 to 1.
        """
        base_score = 0.0

        # 1. Skill proficiency (40% of score)
        for ws in worker_skills:
            if ws.skill_id == job.required_skill_id:
                # Proficiency level 1-5, normalized to 0-1
                skill_score = (ws.proficiency_level - 1) / 4.0  # 0 to 1
                base_score += skill_score * 0.4
                break

        # 2. Worker rating (30% of score)
        rating_score = min(worker.average_rating / 5.0, 1.0)  # Normalize to 0-1
        base_score += rating_score * 0.3

        # 3. Verification status (15% of score)
        verification_score = 1.0 if worker.is_verified else 0.0
        base_score += verification_score * 0.15

        # 4. Worker's verification score (15% of score)
        verification_percentage = worker.verification_score / 100.0  # Normalize to 0-1
        base_score += verification_percentage * 0.15

        return min(base_score, 1.0)  # Cap at 1.0

    @staticmethod
    def get_worker_recommendations_for_job(job_id, limit=20, max_distance_km=50):
        """
        Get worker recommendations for a job.

        Args:
            job_id: ID of the job
            limit: Maximum number of recommendations to return
            max_distance_km: Maximum distance in kilometers for location filtering

        Returns:
            List of workers with match scores, sorted by score descending
        """
        job = Job.query.get(job_id)
        if not job:
            return []

        # Get workers who have the required skill
        worker_skills = WorkerSkill.query.filter_by(
            skill_id=job.required_skill_id
        ).all()
        if not worker_skills:
            return []

        worker_ids = [ws.worker_id for ws in worker_skills]
        workers = Worker.query.filter(Worker.id.in_(worker_ids)).all()

        # Calculate match score for each worker
        scored_workers = []
        for worker in workers:
            # Get the specific worker skill for proficiency level
            ws = next((ws for ws in worker_skills if ws.worker_id == worker.id), None)
            if not ws:
                continue

            score = MatchingService._calculate_worker_match_score(worker, job, ws)

            # Check location
            if (
                worker.location_lat
                and worker.location_lng
                and job.location_lat
                and job.location_lng
            ):
                distance = calculate_distance(
                    worker.location_lat,
                    worker.location_lng,
                    job.location_lat,
                    job.location_lng,
                )
                if distance <= max_distance_km:
                    # Adjust score based on distance (closer is better)
                    distance_penalty = (
                        distance / max_distance_km
                    ) * 0.2  # Up to 20% penalty
                    score *= 1 - distance_penalty
                    worker_dict = worker.to_dict()
                    worker_dict["distance_km"] = distance
                    worker_dict["match_score"] = score
                    worker_dict["proficiency_level"] = ws.proficiency_level
                    scored_workers.append((score, worker_dict))
            else:
                # No location data, just use the score
                worker_dict = worker.to_dict()
                worker_dict["match_score"] = score
                worker_dict["distance_km"] = None
                worker_dict["proficiency_level"] = ws.proficiency_level
                scored_workers.append((score, worker_dict))

        # Sort by score descending
        scored_workers.sort(key=lambda x: x[0], reverse=True)

        # Return top N workers
        return [worker for _, worker in scored_workers[:limit]]

    @staticmethod
    def _calculate_worker_match_score(worker, job, worker_skill):
        """
        Calculate match score between a worker and a job from employer's perspective.
        Score ranges from 0 to 1.
        """
        base_score = 0.0

        # 1. Skill proficiency (40% of score)
        proficiency_score = (worker_skill.proficiency_level - 1) / 4.0  # 0 to 1
        base_score += proficiency_score * 0.4

        # 2. Worker rating (30% of score)
        rating_score = min(worker.average_rating / 5.0, 1.0)  # Normalize to 0-1
        base_score += rating_score * 0.3

        # 3. Verification status (15% of score)
        verification_score = 1.0 if worker.is_verified else 0.0
        base_score += verification_score * 0.15

        # 4. Worker's verification score (15% of score)
        verification_percentage = worker.verification_score / 100.0  # Normalize to 0-1
        base_score += verification_percentage * 0.15

        return min(base_score, 1.0)  # Cap at 1.0

    @staticmethod
    def get_similar_jobs(job_id, limit=10):
        """
        Get similar jobs based on skill and other attributes.

        Args:
            job_id: ID of the reference job
            limit: Maximum number of similar jobs to return

        Returns:
            List of similar jobs
        """
        job = Job.query.get(job_id)
        if not job:
            return []

        # Find jobs with same required skill
        from ..models.job import JobStatus

        similar_jobs = (
            Job.query.filter(
                Job.id != job_id,
                Job.required_skill_id == job.required_skill_id,
                Job.status == JobStatus.OPEN,
            )
            .limit(limit)
            .all()
        )

        # Add similarity score based on other factors
        result = []
        for similar_job in similar_jobs:
            similarity = 0.0

            # Same employer? (if so, higher similarity)
            if similar_job.employer_id == job.employer_id:
                similarity += 0.3

            # Similar pay range? (within 20%)
            if (
                job.pay_min
                and job.pay_max
                and similar_job.pay_min
                and similar_job.pay_max
            ):
                job_mid = (job.pay_min + job.pay_max) / 2
                similar_mid = (similar_job.pay_min + similar_job.pay_max) / 2
                if similar_mid > 0:
                    pay_diff = abs(job_mid - similar_mid) / similar_mid
                    if pay_diff <= 0.2:
                        similarity += 0.3
                    else:
                        similarity += max(0, 0.3 - (pay_diff - 0.2))

            # Similar location? (if both have locations)
            if (
                job.location_lat
                and job.location_lng
                and similar_job.location_lat
                and similar_job.location_lng
            ):
                distance = calculate_distance(
                    job.location_lat,
                    job.location_lng,
                    similar_job.location_lat,
                    similar_job.location_lng,
                )
                if distance <= 10:  # Within 10 km
                    similarity += 0.4
                elif distance <= 50:  # Within 50 km
                    similarity += 0.2

            job_dict = similar_job.to_dict()
            job_dict["similarity_score"] = min(similarity, 1.0)
            result.append(job_dict)

        # Sort by similarity score descending
        result.sort(key=lambda x: x["similarity_score"], reverse=True)

        return result


# ----- END FILE -----
