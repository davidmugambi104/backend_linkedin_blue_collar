# ----- FILE: backend/app/models/application.py -----
import enum
from datetime import datetime
from ..extensions import db

class ApplicationStatus(enum.Enum):
    PENDING = 'pending'
    ACCEPTED = 'accepted'
    REJECTED = 'rejected'
    WITHDRAWN = 'withdrawn'

class Application(db.Model):
    __tablename__ = 'applications'

    id = db.Column(db.Integer, primary_key=True)
    job_id = db.Column(db.Integer, db.ForeignKey('jobs.id'), nullable=False)
    worker_id = db.Column(db.Integer, db.ForeignKey('workers.id'), nullable=False)
    status = db.Column(db.Enum(ApplicationStatus), default=ApplicationStatus.PENDING, index=True)
    cover_letter = db.Column(db.Text)
    proposed_rate = db.Column(db.Numeric(10, 2))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Unique constraint to prevent duplicate applications
    __table_args__ = (db.UniqueConstraint('job_id', 'worker_id', name='_job_worker_uc'),)

    def to_dict(self):
        return {
            'id': self.id,
            'job_id': self.job_id,
            'worker_id': self.worker_id,
            'status': self.status.value if self.status else None,
            'cover_letter': self.cover_letter,
            'proposed_rate': float(self.proposed_rate) if self.proposed_rate else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
