# ----- FILE: backend/app/routes/payments.py -----
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from ..extensions import db
from ..models import User, Payment, Job, Worker, Employer, Application
from ..schemas import PaymentCreateSchema, PaymentUpdateSchema
from ..utils.permissions import admin_required

payments_bp = Blueprint("payments", __name__)


def calculate_payment_details(amount):
    """Calculate platform fee (10%) and net amount."""
    platform_fee = amount * 0.10
    net_amount = amount - platform_fee
    return platform_fee, net_amount


@payments_bp.route("/", methods=["POST"])
@jwt_required()
def create_payment():
    """Create a payment record (employer or admin only)."""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)

    if current_user.role.value not in ["employer", "admin"]:
        return jsonify({"error": "Only employers and admins can create payments"}), 403

    schema = PaymentCreateSchema()
    data = schema.load(request.json)

    job_id = data["job_id"]
    job = Job.query.get_or_404(job_id)

    from ..models.job import JobStatus

    if job.status != JobStatus.COMPLETED:
        return (
            jsonify({"error": "Payments can only be created for completed jobs"}),
            400,
        )

    if current_user.role.value == "employer":
        employer = Employer.query.filter_by(user_id=current_user_id).first()
        if not employer or job.employer_id != employer.id:
            return (
                jsonify({"error": "You can only create payments for jobs you posted"}),
                403,
            )

    application = Application.query.filter_by(job_id=job_id, status="accepted").first()
    if not application:
        return jsonify({"error": "No worker was hired for this job"}), 400

    worker_id = application.worker_id
    amount = data["amount"]

    existing_payment = Payment.query.filter_by(job_id=job_id).first()
    if existing_payment:
        return jsonify({"error": "A payment already exists for this job"}), 400

    platform_fee, net_amount = calculate_payment_details(amount)

    payment = Payment(
        job_id=job_id,
        employer_id=job.employer_id,
        worker_id=worker_id,
        amount=amount,
        platform_fee=platform_fee,
        net_amount=net_amount,
        payment_method=data.get("payment_method"),
        transaction_id=data.get("transaction_id"),
    )

    db.session.add(payment)
    db.session.commit()
    return jsonify(payment.to_dict()), 201


@payments_bp.route("/", methods=["GET"])
@jwt_required()
def get_payments():
    """Get payments (filtered by role)."""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)

    query = Payment.query

    if current_user.role.value == "worker":
        worker = Worker.query.filter_by(user_id=current_user_id).first()
        if not worker:
            return jsonify({"error": "Worker profile not found"}), 404
        query = query.filter_by(worker_id=worker.id)

    elif current_user.role.value == "employer":
        employer = Employer.query.filter_by(user_id=current_user_id).first()
        if not employer:
            return jsonify({"error": "Employer profile not found"}), 404
        query = query.filter_by(employer_id=employer.id)

    job_id = request.args.get("job_id")
    status = request.args.get("status")

    if job_id:
        query = query.filter_by(job_id=job_id)

    if status:
        from ..models.payment import PaymentStatus

        try:
            query = query.filter_by(status=PaymentStatus(status))
        except ValueError:
            return jsonify({"error": "Invalid status value"}), 400

    payments = query.order_by(Payment.created_at.desc()).all()

    result = []
    for payment in payments:
        payment_dict = payment.to_dict()

        job = Job.query.get(payment.job_id)
        if job:
            payment_dict["job"] = job.to_dict()

        worker = Worker.query.get(payment.worker_id)
        if worker:
            payment_dict["worker"] = worker.to_dict()

        employer = Employer.query.get(payment.employer_id)
        if employer:
            payment_dict["employer"] = employer.to_dict()

        result.append(payment_dict)

    return jsonify(result), 200


@payments_bp.route("/<int:payment_id>", methods=["GET"])
@jwt_required()
def get_payment(payment_id):
    """Get a specific payment."""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)

    payment = Payment.query.get_or_404(payment_id)

    if current_user.role.value == "worker":
        worker = Worker.query.filter_by(user_id=current_user_id).first()
        if not worker or payment.worker_id != worker.id:
            return jsonify({"error": "You can only view your own payments"}), 403

    elif current_user.role.value == "employer":
        employer = Employer.query.filter_by(user_id=current_user_id).first()
        if not employer or payment.employer_id != employer.id:
            return jsonify({"error": "You can only view payments for your jobs"}), 403

    payment_dict = payment.to_dict()

    job = Job.query.get(payment.job_id)
    if job:
        payment_dict["job"] = job.to_dict()

    worker = Worker.query.get(payment.worker_id)
    if worker:
        payment_dict["worker"] = worker.to_dict()

    employer = Employer.query.get(payment.employer_id)
    if employer:
        payment_dict["employer"] = employer.to_dict()

    return jsonify(payment_dict), 200


@payments_bp.route("/<int:payment_id>", methods=["PUT"])
@jwt_required()
def update_payment(payment_id):
    """Update a payment (admin or employer who made it)."""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)

    payment = Payment.query.get_or_404(payment_id)

    if current_user.role.value == "employer":
        employer = Employer.query.filter_by(user_id=current_user_id).first()
        if not employer or payment.employer_id != employer.id:
            return jsonify({"error": "You can only update payments for your jobs"}), 403
    elif current_user.role.value != "admin":
        return jsonify({"error": "You do not have permission to update payments"}), 403

    schema = PaymentUpdateSchema()
    data = schema.load(request.json, partial=True)

    for key, value in data.items():
        setattr(payment, key, value)

    if "status" in data and data["status"] == "paid" and not payment.paid_at:
        payment.paid_at = datetime.utcnow()

    db.session.commit()
    return jsonify(payment.to_dict()), 200


@payments_bp.route("/stats", methods=["GET"])
@jwt_required()
@admin_required
def get_payment_stats():
    """Get payment statistics (admin only)."""
    total_payments = Payment.query.count()
    total_amount = (
        db.session.query(db.func.sum(Payment.amount))
        .filter(Payment.status == "paid")
        .scalar()
        or 0
    )
    total_fees = (
        db.session.query(db.func.sum(Payment.platform_fee))
        .filter(Payment.status == "paid")
        .scalar()
        or 0
    )

    payments_by_status = {}
    payments = Payment.query.all()
    for payment in payments:
        status = payment.status.value
        payments_by_status[status] = payments_by_status.get(status, 0) + 1

    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    recent_payments = Payment.query.filter(
        Payment.created_at >= thirty_days_ago
    ).count()

    return (
        jsonify(
            {
                "total_payments": total_payments,
                "total_amount_paid": float(total_amount),
                "total_platform_fees": float(total_fees),
                "payments_by_status": payments_by_status,
                "recent_payments_last_30_days": recent_payments,
            }
        ),
        200,
    )


# ----- END FILE -----
