# ----- FILE: backend/app/models/dispute.py -----
from datetime import datetime
from ..extensions import db
import enum


class DisputeStatus(enum.Enum):
    PENDING = "pending"
    UNDER_REVIEW = "under_review"
    RESOLVED = "resolved"
    REJECTED = "rejected"
    ESCALATED = "escalated"


class DisputeType(enum.Enum):
    PAYMENT = "payment"
    QUALITY = "quality"
    NO_SHOW = "no_show"
    DAMAGE = "damage"
    COMMUNICATION = "communication"
    OTHER = "other"


class Dispute(db.Model):
    __tablename__ = "disputes"
    
    id = db.Column(db.Integer, primary_key=True)
    job_id = db.Column(db.Integer, db.ForeignKey("jobs.id"), nullable=False)
    application_id = db.Column(db.Integer, db.ForeignKey("applications.id"))
    raised_by_user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    
    dispute_type = db.Column(db.Enum(DisputeType), nullable=False)
    status = db.Column(db.Enum(DisputeStatus), default=DisputeStatus.PENDING)
    description = db.Column(db.Text, nullable=False)
    evidence_urls = db.Column(db.JSON)  # List of evidence file URLs
    
    resolution = db.Column(db.Text)
    resolved_by = db.Column(db.Integer, db.ForeignKey("users.id"))
    resolved_at = db.Column(db.DateTime)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    job = db.relationship("Job", backref="disputes")
    application = db.relationship("Application", backref="disputes")
    raised_by = db.relationship("User", foreign_keys=[raised_by_user_id], backref="disputes_raised")
    resolver = db.relationship("User", foreign_keys=[resolved_by])
    
    def to_dict(self):
        return {
            "id": self.id,
            "job_id": self.job_id,
            "application_id": self.application_id,
            "raised_by_user_id": self.raised_by_user_id,
            "dispute_type": self.dispute_type.value,
            "status": self.status.value,
            "description": self.description,
            "evidence_urls": self.evidence_urls,
            "resolution": self.resolution,
            "resolved_by": self.resolved_by,
            "resolved_at": self.resolved_at.isoformat() if self.resolved_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class DisputeMessage(db.Model):
    __tablename__ = "dispute_messages"
    
    id = db.Column(db.Integer, primary_key=True)
    dispute_id = db.Column(db.Integer, db.ForeignKey("disputes.id"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    message = db.Column(db.Text, nullable=False)
    is_evidence = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    dispute = db.relationship("Dispute", backref="messages")
    user = db.relationship("User", backref="dispute_messages")
    
    def to_dict(self):
        return {
            "id": self.id,
            "dispute_id": self.dispute_id,
            "user_id": self.user_id,
            "message": self.message,
            "is_evidence": self.is_evidence,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
