import enum
from datetime import datetime
from ..extensions import db

class PaymentStatus(enum.Enum):
    PENDING = 'pending'
    PAID = 'paid'
    FAILED = 'failed'
    REFUNDED = 'refunded'

class Payment(db.Model):
    __tablename__ = 'payments'

    id = db.Column(db.Integer, primary_key=True)
    job_id = db.Column(db.Integer, db.ForeignKey('jobs.id'), nullable=False)
    employer_id = db.Column(db.Integer, db.ForeignKey('employers.id'), nullable=False)
    worker_id = db.Column(db.Integer, db.ForeignKey('workers.id'), nullable=False)
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    platform_fee = db.Column(db.Numeric(10, 2), nullable=False, default=0)  # 10% of amount
    net_amount = db.Column(db.Numeric(10, 2), nullable=False)  # amount - platform_fee
    status = db.Column(db.Enum(PaymentStatus), default=PaymentStatus.PENDING, index=True)
    transaction_id = db.Column(db.String(100), unique=True, index=True)
    payment_method = db.Column(db.String(50))
    paid_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'job_id': self.job_id,
            'employer_id': self.employer_id,
            'worker_id': self.worker_id,
            'amount': float(self.amount) if self.amount else None,
            'platform_fee': float(self.platform_fee) if self.platform_fee else None,
            'net_amount': float(self.net_amount) if self.net_amount else None,
            'status': self.status.value if self.status else None,
            'transaction_id': self.transaction_id,
            'payment_method': self.payment_method,
            'paid_at': self.paid_at.isoformat() if self.paid_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
