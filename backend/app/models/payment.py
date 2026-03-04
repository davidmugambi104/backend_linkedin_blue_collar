# ----- FILE: backend/app/models/payment.py -----
import enum
from datetime import datetime
from ..extensions import db


class PaymentStatus(enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"


class Payment(db.Model):
    __tablename__ = "payments"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)  # For wallet payments
    job_id = db.Column(db.Integer, db.ForeignKey("jobs.id"), nullable=True)  # For job payments
    employer_id = db.Column(db.Integer, db.ForeignKey("employers.id"), nullable=True)
    worker_id = db.Column(db.Integer, db.ForeignKey("workers.id"), nullable=True)
    
    # Payment details
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    payment_type = db.Column(db.String(20), nullable=False)  # 'deposit', 'withdrawal', 'job_payment', 'escrow'
    reference = db.Column(db.String(100), nullable=False)  # Our reference
    status = db.Column(db.Enum(PaymentStatus), default=PaymentStatus.PENDING, index=True)
    
    # Provider details
    provider = db.Column(db.String(20), default='mpesa')  # 'mpesa', 'stripe', etc
    provider_reference = db.Column(db.String(100))  # M-Pesa CheckoutRequestID, etc
    phone = db.Column(db.String(20))  # Phone number used
    
    # For job payments
    platform_fee = db.Column(db.Numeric(10, 2), default=0)
    net_amount = db.Column(db.Numeric(10, 2))
    
    # Legacy fields (for backward compatibility)
    transaction_id = db.Column(db.String(100), index=True)
    payment_method = db.Column(db.String(50))
    paid_at = db.Column(db.DateTime)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "job_id": self.job_id,
            "employer_id": self.employer_id,
            "worker_id": self.worker_id,
            "amount": float(self.amount) if self.amount else None,
            "payment_type": self.payment_type,
            "reference": self.reference,
            "status": self.status.value if self.status else None,
            "provider": self.provider,
            "provider_reference": self.provider_reference,
            "phone": self.phone,
            "platform_fee": float(self.platform_fee) if self.platform_fee else 0,
            "net_amount": float(self.net_amount) if self.net_amount else None,
            "transaction_id": self.transaction_id,
            "payment_method": self.payment_method,
            "paid_at": self.paid_at.isoformat() if self.paid_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


# For backward compatibility
PaymentStatusEnum = PaymentStatus
