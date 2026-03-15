from datetime import datetime
from ..extensions import db


class Worker(db.Model):
    __tablename__ = "workers"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer, db.ForeignKey("users.id"), nullable=False, unique=True
    )
    full_name = db.Column(db.String(200), nullable=False)
    bio = db.Column(db.Text)
    location_lat = db.Column(db.Float)
    location_lng = db.Column(db.Float)
    address = db.Column(db.String(500))
    phone = db.Column(db.String(20))
    profile_picture = db.Column(db.String(500))
    hourly_rate = db.Column(db.Numeric(10, 2))
    is_verified = db.Column(db.Boolean, default=False)
    verification_score = db.Column(db.Integer, default=0)
    average_rating = db.Column(db.Float, default=0.0)
    total_ratings = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
    
    # New fields from agenda
    date_of_birth = db.Column(db.Date)
    gender = db.Column(db.String(20))
    id_number = db.Column(db.String(20))
    id_photo_front_url = db.Column(db.String(500))
    id_photo_back_url = db.Column(db.String(500))
    kra_pin = db.Column(db.String(20))
    nhif_number = db.Column(db.String(20))
    nssf_number = db.Column(db.String(20))
    county = db.Column(db.String(100), index=True)
    sub_county = db.Column(db.String(100))
    ward = db.Column(db.String(100))
    service_radius_km = db.Column(db.Integer, default=10)
    availability_status = db.Column(db.String(20), default="available", index=True)
    next_available_date = db.Column(db.Date)
    max_travel_distance = db.Column(db.Integer, default=20)
    profile_completion_percentage = db.Column(db.Integer, default=0)
    years_experience = db.Column(db.Integer, default=0)

    # Relationships
    skills = db.relationship(
        "WorkerSkill", backref="worker", cascade="all, delete-orphan"
    )
    applications = db.relationship(
        "Application", backref="worker", cascade="all, delete-orphan"
    )
    reviews_received = db.relationship(
        "Review",
        foreign_keys="Review.worker_id",
        backref="worker",
        cascade="all, delete-orphan",
    )
    sent_messages = db.relationship(
        "Message",
        primaryjoin="Worker.user_id==Message.sender_id",
        backref=db.backref("sender_worker", overlaps="sender_employer"),
        cascade="all, delete-orphan",
        foreign_keys="Message.sender_id",
        overlaps="sender,sender_employer,sent_messages",
    )
    received_messages = db.relationship(
        "Message",
        primaryjoin="Worker.user_id==Message.receiver_id",
        backref=db.backref("receiver_worker", overlaps="receiver_employer"),
        cascade="all, delete-orphan",
        foreign_keys="Message.receiver_id",
        overlaps="receiver,receiver_employer,received_messages",
    )
    verifications = db.relationship(
        "DocumentVerification", backref="worker", cascade="all, delete-orphan"
    )
    payments = db.relationship(
        "Payment",
        foreign_keys="Payment.worker_id",
        backref="worker",
        cascade="all, delete-orphan",
    )

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "full_name": self.full_name,
            "bio": self.bio,
            "location_lat": float(self.location_lat) if self.location_lat else None,
            "location_lng": float(self.location_lng) if self.location_lng else None,
            "address": self.address,
            "phone": self.phone,
            "profile_picture": self.profile_picture,
            "hourly_rate": float(self.hourly_rate) if self.hourly_rate else None,
            "daily_rate": float(self.hourly_rate) if self.hourly_rate else None,
            "is_verified": self.is_verified,
            "verification_score": self.verification_score,
            "average_rating": float(self.average_rating) if self.average_rating else 0.0,
            "total_ratings": self.total_ratings,
            "date_of_birth": self.date_of_birth.isoformat() if self.date_of_birth else None,
            "gender": self.gender,
            "id_number": self.id_number,
            "county": self.county,
            "sub_county": self.sub_county,
            "ward": self.ward,
            "service_radius_km": self.service_radius_km,
            "availability_status": self.availability_status,
            "availability": self.availability_status,
            "next_available_date": self.next_available_date.isoformat() if self.next_available_date else None,
            "max_travel_distance": self.max_travel_distance,
            "profile_completion_percentage": self.profile_completion_percentage,
            "years_experience": self.years_experience,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
