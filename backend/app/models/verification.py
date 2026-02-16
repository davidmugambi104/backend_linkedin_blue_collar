import enum
from datetime import datetime
from ..extensions import db


class VerificationStatus(enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class Verification(db.Model):
    __tablename__ = "verifications"

    id = db.Column(db.Integer, primary_key=True)
    worker_id = db.Column(db.Integer, db.ForeignKey("workers.id"), nullable=False)
    verification_type = db.Column(
        db.String(100), nullable=False
    )  # e.g., 'id_card', 'license', 'certification'
    document_url = db.Column(db.String(500), nullable=False)
    status = db.Column(
        db.Enum(VerificationStatus), default=VerificationStatus.PENDING, index=True
    )
    reviewed_by = db.Column(db.Integer, db.ForeignKey("users.id"))  # admin user id
    review_notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    def to_dict(self):
        return {
            "id": self.id,
            "worker_id": self.worker_id,
            "verification_type": self.verification_type,
            "document_url": self.document_url,
            "status": self.status.value if self.status else None,
            "reviewed_by": self.reviewed_by,
            "review_notes": self.review_notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
