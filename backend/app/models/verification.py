# ----- FILE: backend/app/models/verification.py -----
from datetime import datetime, timedelta
from ..extensions import db
import enum

class VerificationStatus(enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class VerificationCode(db.Model):
    __tablename__ = 'verification_codes'

    id = db.Column(db.Integer, primary_key=True)
    phone = db.Column(db.String(20), nullable=False, index=True)
    code = db.Column(db.String(6), nullable=False)
    purpose = db.Column(db.String(20), nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)
    verified_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    @staticmethod
    def generate_code():
        import random
        return ''.join([str(random.randint(0, 9)) for _ in range(6)])

    @staticmethod
    def create_verification(phone, purpose='phone_verify', expires_minutes=10):
        VerificationCode.query.filter_by(
            phone=phone, 
            purpose=purpose, 
            verified_at=None
        ).delete()
        
        code = VerificationCode(
            phone=phone,
            code=VerificationCode.generate_code(),
            purpose=purpose,
            expires_at=datetime.utcnow() + timedelta(minutes=expires_minutes)
        )
        db.session.add(code)
        db.session.commit()
        return code

    def is_valid(self):
        return self.verified_at is None and self.expires_at > datetime.utcnow()


# Document verification (for ID verification from agenda)
class DocumentVerification(db.Model):
    __tablename__ = 'document_verifications'

    id = db.Column(db.Integer, primary_key=True)
    worker_id = db.Column(db.Integer, db.ForeignKey('workers.id'), nullable=False)
    verification_type = db.Column(db.String(50), nullable=False)  # 'id_card', 'certificate', 'kra_pin', 'nhif', 'nssf'
    document_url = db.Column(db.String(500), nullable=False)
    status = db.Column(db.String(20), default='pending')
    reviewed_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    review_notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "worker_id": self.worker_id,
            "verification_type": self.verification_type,
            "document_url": self.document_url,
            "status": self.status,
            "reviewed_by": self.reviewed_by,
            "review_notes": self.review_notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

# Alias for backward compatibility
Verification = DocumentVerification
