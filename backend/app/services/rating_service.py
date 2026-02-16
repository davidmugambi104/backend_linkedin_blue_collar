# ----- FILE: backend/app/services/rating_service.py -----
from ..extensions import db
from ..models import Review, Worker


class RatingService:
    @staticmethod
    def calculate_worker_rating(worker_id):
        """
        Calculate and update a worker's average rating.

        Args:
            worker_id: ID of the worker

        Returns:
            Tuple of (average_rating, total_ratings)
        """
        reviews = Review.query.filter_by(worker_id=worker_id).all()

        if not reviews:
            average_rating = 0.0
            total_ratings = 0
        else:
            total_score = sum(review.rating for review in reviews)
            total_ratings = len(reviews)
            average_rating = total_score / total_ratings

        # Update worker record
        worker = Worker.query.get(worker_id)
        if worker:
            worker.average_rating = average_rating
            worker.total_ratings = total_ratings
            db.session.commit()

        return average_rating, total_ratings

    @staticmethod
    def get_rating_distribution(worker_id):
        """
        Get rating distribution for a worker.

        Args:
            worker_id: ID of the worker

        Returns:
            Dictionary with count of each rating (1-5)
        """
        distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        reviews = Review.query.filter_by(worker_id=worker_id).all()

        for review in reviews:
            distribution[review.rating] = distribution.get(review.rating, 0) + 1

        return distribution

    @staticmethod
    def get_employer_rating_stats(employer_id):
        """
        Get rating statistics for an employer (based on reviews they've given).

        Args:
            employer_id: ID of the employer

        Returns:
            Dictionary with average rating given, total count, and distribution
        """
        reviews = Review.query.filter_by(employer_id=employer_id).all()

        if not reviews:
            return {
                "average_given": 0.0,
                "total_given": 0,
                "distribution": {1: 0, 2: 0, 3: 0, 4: 0, 5: 0},
            }

        total_score = sum(review.rating for review in reviews)
        total_given = len(reviews)
        average_given = total_score / total_given

        distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        for review in reviews:
            distribution[review.rating] = distribution.get(review.rating, 0) + 1

        return {
            "average_given": average_given,
            "total_given": total_given,
            "distribution": distribution,
        }

    @staticmethod
    def get_job_rating(job_id):
        """
        Get rating for a specific job.

        Args:
            job_id: ID of the job

        Returns:
            Review object for the job, or None if no review exists
        """
        return Review.query.filter_by(job_id=job_id).first()


# ----- END FILE -----
