# ----- FILE: backend/app/services/payment_service.py -----
from datetime import datetime
from ..extensions import db
from ..models import Payment, Job, Application


class PaymentService:
    @staticmethod
    def create_payment(job_id, amount, payment_method=None, transaction_id=None):
        """
        Create a payment record for a completed job.

        Args:
            job_id: ID of the job
            amount: Total payment amount
            payment_method: Method of payment (optional)
            transaction_id: Transaction ID (optional)

        Returns:
            Payment object or (None, error message)
        """
        job = Job.query.get(job_id)
        if not job:
            return None, "Job not found"

        # Check if job is completed
        from ..models.job import JobStatus

        if job.status != JobStatus.COMPLETED:
            return None, "Job must be completed to create payment"

        # Get the accepted application for this job
        application = Application.query.filter_by(
            job_id=job_id, status="accepted"
        ).first()
        if not application:
            return None, "No accepted application found for this job"

        worker_id = application.worker_id

        # Check if payment already exists for this job
        existing_payment = Payment.query.filter_by(job_id=job_id).first()
        if existing_payment:
            return None, "Payment already exists for this job"

        # Calculate platform fee (10%)
        platform_fee = amount * 0.10
        net_amount = amount - platform_fee

        # Create payment
        payment = Payment(
            job_id=job_id,
            employer_id=job.employer_id,
            worker_id=worker_id,
            amount=amount,
            platform_fee=platform_fee,
            net_amount=net_amount,
            payment_method=payment_method,
            transaction_id=transaction_id,
        )

        db.session.add(payment)
        db.session.commit()

        return payment, None

    @staticmethod
    def mark_payment_as_paid(payment_id, transaction_id=None, payment_method=None):
        """
        Mark a payment as paid.

        Args:
            payment_id: ID of the payment
            transaction_id: Transaction ID (optional)
            payment_method: Method of payment (optional)

        Returns:
            Updated payment or (None, error message)
        """
        payment = Payment.query.get(payment_id)
        if not payment:
            return None, "Payment not found"


        payment.status = "paid"
        payment.paid_at = datetime.utcnow()

        if transaction_id:
            payment.transaction_id = transaction_id
        if payment_method:
            payment.payment_method = payment_method

        db.session.commit()
        return payment, None

    @staticmethod
    def get_payment_summary(
        employer_id=None, worker_id=None, start_date=None, end_date=None
    ):
        """
        Get payment summary with optional filters.

        Args:
            employer_id: Filter by employer
            worker_id: Filter by worker
            start_date: Start date for filtering
            end_date: End date for filtering

        Returns:
            Dictionary with payment statistics
        """
        query = Payment.query

        if employer_id:
            query = query.filter_by(employer_id=employer_id)
        if worker_id:
            query = query.filter_by(worker_id=worker_id)
        if start_date:
            query = query.filter(Payment.created_at >= start_date)
        if end_date:
            query = query.filter(Payment.created_at <= end_date)

        payments = query.all()

        total_amount = sum(p.amount for p in payments)
        total_fees = sum(p.platform_fee for p in payments)
        total_net = sum(p.net_amount for p in payments)

        # Count by status
        status_counts = {}
        for payment in payments:
            status = payment.status.value
            status_counts[status] = status_counts.get(status, 0) + 1

        return {
            "total_payments": len(payments),
            "total_amount": float(total_amount) if total_amount else 0,
            "total_platform_fees": float(total_fees) if total_fees else 0,
            "total_net_amount": float(total_net) if total_net else 0,
            "status_counts": status_counts,
        }

    @staticmethod
    def get_worker_earnings(worker_id, start_date=None, end_date=None):
        """
        Get earnings summary for a worker.

        Args:
            worker_id: ID of the worker
            start_date: Start date for filtering
            end_date: End date for filtering

        Returns:
            Dictionary with earnings statistics
        """
        query = Payment.query.filter_by(worker_id=worker_id)

        if start_date:
            query = query.filter(Payment.created_at >= start_date)
        if end_date:
            query = query.filter(Payment.created_at <= end_date)

        payments = query.all()

        total_earnings = sum(p.net_amount for p in payments)
        pending_earnings = sum(
            p.net_amount for p in payments if p.status.value == "pending"
        )

        # Group by month for chart data
        monthly_earnings = {}
        for payment in payments:
            if payment.paid_at:
                month_key = payment.paid_at.strftime("%Y-%m")
                monthly_earnings[month_key] = monthly_earnings.get(
                    month_key, 0
                ) + float(payment.net_amount)

        return {
            "total_earnings": float(total_earnings) if total_earnings else 0,
            "pending_earnings": float(pending_earnings) if pending_earnings else 0,
            "total_jobs": len(payments),
            "monthly_earnings": monthly_earnings,
        }


# ----- END FILE -----
