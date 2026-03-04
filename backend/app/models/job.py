import enum
from datetime import datetime
from ..extensions import db


class JobStatus(enum.Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    EXPIRED = "expired"


class Job(db.Model):
    __tablename__ = "jobs"

    id = db.Column(db.Integer, primary_key=True)
    employer_id = db.Column(db.Integer, db.ForeignKey("employers.id"), nullable=False)
    title = db.Column(db.String(200), nullable=False, index=True)
    description = db.Column(db.Text, nullable=False)
    required_skill_id = db.Column(
        db.Integer, db.ForeignKey("skills.id"), nullable=False
    )
    location_lat = db.Column(db.Float)
    location_lng = db.Column(db.Float)
    address = db.Column(db.String(500))
    pay_min = db.Column(db.Numeric(10, 2))
    pay_max = db.Column(db.Numeric(10, 2))
    pay_type = db.Column(db.String(20))  # hourly, daily, fixed
    status = db.Column(db.Enum(JobStatus), default=JobStatus.OPEN, index=True)
    expiration_date = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
    
    # New fields from agenda
    county = db.Column(db.String(100), index=True)
    sub_county = db.Column(db.String(100))
    start_date = db.Column(db.Date)
    required_experience_years = db.Column(db.Integer)
    number_of_fundis_needed = db.Column(db.Integer, default=1)
    is_flexible_hours = db.Column(db.Boolean, default=True)

    # Relationships
    applications = db.relationship(
        "Application", backref="job", cascade="all, delete-orphan"
    )
    payments = db.relationship("Payment", backref="job", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "employer_id": self.employer_id,
            "title": self.title,
            "description": self.description,
            "required_skill_id": self.required_skill_id,
            "location_lat": float(self.location_lat) if self.location_lat else None,
            "location_lng": float(self.location_lng) if self.location_lng else None,
            "address": self.address,
            "pay_min": float(self.pay_min) if self.pay_min else None,
            "pay_max": float(self.pay_max) if self.pay_max else None,
            "pay_type": self.pay_type,
            "status": self.status.value if self.status else None,
            "expiration_date": (
                self.expiration_date.isoformat() if self.expiration_date else None
            ),
            "county": self.county,
            "sub_county": self.sub_county,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "required_experience_years": self.required_experience_years,
            "number_of_fundis_needed": self.number_of_fundis_needed,
            "is_flexible_hours": self.is_flexible_hours,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
