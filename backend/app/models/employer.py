from datetime import datetime
from ..extensions import db


class Employer(db.Model):
    __tablename__ = "employers"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer, db.ForeignKey("users.id"), nullable=False, unique=True
    )
    company_name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    location_lat = db.Column(db.Float)
    location_lng = db.Column(db.Float)
    address = db.Column(db.String(500))
    phone = db.Column(db.String(20))
    website = db.Column(db.String(200))
    logo = db.Column(db.String(500))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
    
    # New fields from agenda
    business_registration_number = db.Column(db.String(50))
    company_type = db.Column(db.String(50))  # individual, small_business, corporation, ngo, government
    kra_pin = db.Column(db.String(20))
    county = db.Column(db.String(100), index=True)
    sub_county = db.Column(db.String(100))
    industry_sector = db.Column(db.String(100))
    company_size = db.Column(db.String(50))

    # Relationships
    jobs = db.relationship("Job", backref="employer", cascade="all, delete-orphan")
    reviews_given = db.relationship(
        "Review",
        foreign_keys="Review.employer_id",
        backref="employer",
        cascade="all, delete-orphan",
    )

    # Fixed Messages Relationships with primaryjoin
    sent_messages = db.relationship(
        "Message",
        primaryjoin="Employer.user_id==Message.sender_id",
        backref=db.backref("sender_employer", overlaps="sender_worker"),
        cascade="all, delete-orphan",
        foreign_keys="Message.sender_id",
        overlaps="sender,sender_worker,sent_messages",
    )
    received_messages = db.relationship(
        "Message",
        primaryjoin="Employer.user_id==Message.receiver_id",
        backref=db.backref("receiver_employer", overlaps="receiver_worker"),
        cascade="all, delete-orphan",
        foreign_keys="Message.receiver_id",
        overlaps="receiver,receiver_worker,received_messages",
    )

    payments = db.relationship(
        "Payment",
        foreign_keys="Payment.employer_id",
        backref="employer",
        cascade="all, delete-orphan",
    )

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "company_name": self.company_name,
            "description": self.description,
            "location_lat": float(self.location_lat) if self.location_lat else None,
            "location_lng": float(self.location_lng) if self.location_lng else None,
            "address": self.address,
            "phone": self.phone,
            "website": self.website,
            "logo": self.logo,
            "business_registration_number": self.business_registration_number,
            "company_type": self.company_type,
            "kra_pin": self.kra_pin,
            "county": self.county,
            "sub_county": self.sub_county,
            "industry_sector": self.industry_sector,
            "company_size": self.company_size,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
