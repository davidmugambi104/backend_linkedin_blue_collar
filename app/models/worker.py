from datetime import datetime
from ..extensions import db

class Worker(db.Model):
    __tablename__ = 'workers'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, unique=True)
    full_name = db.Column(db.String(200), nullable=False)
    bio = db.Column(db.Text)
    location_lat = db.Column(db.Float)
    location_lng = db.Column(db.Float)
    address = db.Column(db.String(500))
    phone = db.Column(db.String(20))
    profile_picture = db.Column(db.String(500))
    hourly_rate = db.Column(db.Numeric(10, 2))
    is_verified = db.Column(db.Boolean, default=False)
    verification_score = db.Column(db.Integer, default=0)  # 0-100 scale
    average_rating = db.Column(db.Float, default=0.0)
    total_ratings = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    skills = db.relationship('WorkerSkill', backref='worker', cascade='all, delete-orphan')
    applications = db.relationship('Application', backref='worker', cascade='all, delete-orphan')
    reviews_received = db.relationship('Review', foreign_keys='Review.worker_id', backref='worker', cascade='all, delete-orphan')
    sent_messages = db.relationship('Message', foreign_keys='Message.sender_id', backref='sender_worker', cascade='all, delete-orphan')
    received_messages = db.relationship('Message', foreign_keys='Message.receiver_id', backref='receiver_worker', cascade='all, delete-orphan')
    verifications = db.relationship('Verification', backref='worker', cascade='all, delete-orphan')
    payments = db.relationship('Payment', foreign_keys='Payment.worker_id', backref='worker', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'full_name': self.full_name,
            'bio': self.bio,
            'location_lat': float(self.location_lat) if self.location_lat else None,
            'location_lng': float(self.location_lng) if self.location_lng else None,
            'address': self.address,
            'phone': self.phone,
            'profile_picture': self.profile_picture,
            'hourly_rate': float(self.hourly_rate) if self.hourly_rate else None,
            'is_verified': self.is_verified,
            'verification_score': self.verification_score,
            'average_rating': float(self.average_rating) if self.average_rating else 0.0,
            'total_ratings': self.total_ratings,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
