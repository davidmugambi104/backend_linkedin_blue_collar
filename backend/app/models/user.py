from datetime import datetime
import bcrypt
from ..extensions import db
import enum


class UserRole(enum.Enum):
    WORKER = "worker"
    EMPLOYER = "employer"
    ADMIN = "admin"


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(128), nullable=False)
    role = db.Column(db.Enum(UserRole), nullable=False)
    phone = db.Column(db.String(20), index=True)
    is_phone_verified = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
    
    # Location fields
    id_number = db.Column(db.String(20))
    county = db.Column(db.String(100), index=True)
    sub_county = db.Column(db.String(100))
    ward = db.Column(db.String(100))
    
    # Password reset fields
    reset_code = db.Column(db.String(6))
    reset_code_expires = db.Column(db.DateTime)

    # Relationships
    worker_profile = db.relationship(
        "Worker", backref="user", uselist=False, cascade="all, delete-orphan"
    )
    employer_profile = db.relationship(
        "Employer", backref="user", uselist=False, cascade="all, delete-orphan"
    )

    def set_password(self, password):
        self.password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    def check_password(self, password):
        return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "role": self.role.value,
            "phone": self.phone,
            "is_phone_verified": self.is_phone_verified,
            "is_active": self.is_active,
            "id_number": self.id_number,
            "county": self.county,
            "sub_county": self.sub_county,
            "ward": self.ward,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
