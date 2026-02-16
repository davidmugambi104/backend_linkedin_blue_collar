# ----- FILE: backend/app/routes/reviews.py -----
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..extensions import db
from ..models import User, Review, Job, Worker, Employer, Application
from ..schemas import ReviewCreateSchema
from ..utils.permissions import employer_required

reviews_bp = Blueprint("reviews", __name__)


@reviews_bp.route("/", methods=["GET"])
def get_reviews():
    """Get all reviews (with optional filters). Public endpoint."""
    worker_id = request.args.get("worker_id")
    employer_id = request.args.get("employer_id")
    job_id = request.args.get("job_id")

    query = Review.query

    if worker_id:
        query = query.filter_by(worker_id=worker_id)
    if employer_id:
        query = query.filter_by(employer_id=employer_id)
    if job_id:
        query = query.filter_by(job_id=job_id)

    reviews = query.order_by(Review.created_at.desc()).all()

    result = []
    for review in reviews:
        review_dict = review.to_dict()
        review_dict["worker"] = review.worker.to_dict() if review.worker else None
        review_dict["employer"] = review.employer.to_dict() if review.employer else None
        job = Job.query.get(review.job_id)
        review_dict["job"] = job.to_dict() if job else None
        result.append(review_dict)

    return jsonify(result), 200


@reviews_bp.route("/", methods=["POST"])
@jwt_required()
@employer_required
def create_review():
    """Employer creates a review for a worker after job completion."""
    current_user_id = get_jwt_identity()
    employer = Employer.query.filter_by(user_id=current_user_id).first_or_404()

    schema = ReviewCreateSchema()
    data = schema.load(request.json)

    job_id = data["job_id"]
    job = Job.query.get_or_404(job_id)

    from ..models.job import JobStatus

    if job.employer_id != employer.id:
        return jsonify({"error": "You can only review jobs you posted"}), 403
    if job.status != JobStatus.COMPLETED:
        return (
            jsonify({"error": "Reviews can only be submitted for completed jobs"}),
            400,
        )

    application = Application.query.filter_by(job_id=job_id, status="accepted").first()
    if not application:
        return jsonify({"error": "No worker was hired for this job"}), 400

    worker_id = application.worker_id
    existing_review = Review.query.filter_by(job_id=job_id).first()
    if existing_review:
        return jsonify({"error": "A review already exists for this job"}), 400

    review = Review(
        job_id=job_id,
        worker_id=worker_id,
        employer_id=employer.id,
        rating=data["rating"],
        comment=data.get("comment", ""),
    )
    db.session.add(review)

    # Update worker's average rating
    worker = Worker.query.get(worker_id)
    if worker:
        reviews = Review.query.filter_by(worker_id=worker_id).all()
        total_ratings = len(reviews)
        total_score = sum(r.rating for r in reviews) + data["rating"]
        worker.average_rating = total_score / (total_ratings + 1)
        worker.total_ratings = total_ratings + 1

    db.session.commit()

    review_dict = review.to_dict()
    review_dict["worker"] = worker.to_dict() if worker else None
    review_dict["employer"] = employer.to_dict()
    review_dict["job"] = job.to_dict()

    return jsonify(review_dict), 201


@reviews_bp.route("/<int:review_id>", methods=["GET"])
def get_review(review_id):
    """Get a specific review by ID. Public endpoint."""
    review = Review.query.get_or_404(review_id)

    review_dict = review.to_dict()
    review_dict["worker"] = review.worker.to_dict() if review.worker else None
    review_dict["employer"] = review.employer.to_dict() if review.employer else None
    job = Job.query.get(review.job_id)
    review_dict["job"] = job.to_dict() if job else None

    return jsonify(review_dict), 200


@reviews_bp.route("/<int:review_id>", methods=["PUT"])
@jwt_required()
def update_review(review_id):
    """Update a review (only by the employer who created it or admin)."""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    review = Review.query.get_or_404(review_id)

    if current_user.role.value == "employer":
        employer = Employer.query.filter_by(user_id=current_user_id).first()
        if not employer or review.employer_id != employer.id:
            return jsonify({"error": "You can only update your own reviews"}), 403
    elif current_user.role.value != "admin":
        return jsonify({"error": "You do not have permission to update reviews"}), 403

    data = request.json
    rating = data.get("rating")
    comment = data.get("comment")

    if rating is not None:
        old_rating = review.rating
        review.rating = rating
        if old_rating != rating:
            worker = Worker.query.get(review.worker_id)
            if worker:
                reviews = Review.query.filter_by(worker_id=worker.id).all()
                if reviews:
                    worker.average_rating = sum(r.rating for r in reviews) / len(
                        reviews
                    )

    if comment is not None:
        review.comment = comment

    db.session.commit()

    review_dict = review.to_dict()
    review_dict["worker"] = review.worker.to_dict() if review.worker else None
    review_dict["employer"] = review.employer.to_dict() if review.employer else None
    job = Job.query.get(review.job_id)
    review_dict["job"] = job.to_dict() if job else None

    return jsonify(review_dict), 200


@reviews_bp.route("/<int:review_id>", methods=["DELETE"])
@jwt_required()
def delete_review(review_id):
    """Delete a review (only by the employer who created it or admin)."""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    review = Review.query.get_or_404(review_id)

    if current_user.role.value == "employer":
        employer = Employer.query.filter_by(user_id=current_user_id).first()
        if not employer or review.employer_id != employer.id:
            return jsonify({"error": "You can only delete your own reviews"}), 403
    elif current_user.role.value != "admin":
        return jsonify({"error": "You do not have permission to delete reviews"}), 403

    worker_id = review.worker_id
    db.session.delete(review)

    worker = Worker.query.get(worker_id)
    if worker:
        reviews = Review.query.filter_by(worker_id=worker_id).all()
        if reviews:
            worker.average_rating = sum(r.rating for r in reviews) / len(reviews)
            worker.total_ratings = len(reviews)
        else:
            worker.average_rating = 0.0
            worker.total_ratings = 0

    db.session.commit()

    return jsonify({"message": "Review deleted successfully"}), 200


@reviews_bp.route("/worker/<int:worker_id>/average", methods=["GET"])
def get_worker_average_rating(worker_id):
    """Get a worker's average rating. Public endpoint."""
    worker = Worker.query.get_or_404(worker_id)

    return (
        jsonify(
            {
                "worker_id": worker_id,
                "average_rating": (
                    float(worker.average_rating) if worker.average_rating else 0.0
                ),
                "total_ratings": worker.total_ratings,
            }
        ),
        200,
    )


# ----- END FILE -----
