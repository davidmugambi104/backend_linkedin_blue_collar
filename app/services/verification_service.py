# ----- FILE: backend/app/services/verification_service.py -----
from ..extensions import db
from ..models import Verification, Worker, User, UserRole

class VerificationService:
    @staticmethod
    def submit_verification(worker_id, verification_type, document_url):
        """
        Submit a verification document for a worker.

        Args:
            worker_id: ID of the worker
            verification_type: Type of verification (e.g., 'id_card', 'license')
            document_url: URL of the uploaded document

        Returns:
            Verification object or None and error message
        """
        # Check if worker exists
        worker = Worker.query.get(worker_id)
        if not worker:
            return None, 'Worker not found'
        
        # Create verification
        verification = Verification(
            worker_id=worker_id,
            verification_type=verification_type,
            document_url=document_url
        )
        
        db.session.add(verification)
        db.session.commit()
        
        return verification, None

    @staticmethod
    def review_verification(verification_id, admin_id, status, review_notes=None):
        """
        Review a verification (approve/reject).

        Args:
            verification_id: ID of the verification
            admin_id: ID of the admin user reviewing
            status: New status ('approved' or 'rejected')
            review_notes: Optional notes from the admin

        Returns:
            Updated verification or None and error message
        """
        # Check if admin exists and is admin
        admin = User.query.get(admin_id)
        if not admin or admin.role != UserRole.ADMIN:
            return None, 'Admin access required'
        
        verification = Verification.query.get(verification_id)
        if not verification:
            return None, 'Verification not found'
        
        from ..models.verification import VerificationStatus
        verification.status = VerificationStatus(status)
        verification.reviewed_by = admin_id
        verification.review_notes = review_notes
        
        # If approved, update worker's verification score
        if status == 'approved':
            worker = Worker.query.get(verification.worker_id)
            if worker:
                # Increase verification score by 25 points (up to 100)
                worker.verification_score = min(100, worker.verification_score + 25)
                
                # If score reaches 75 or more, mark as verified
                if worker.verification_score >= 75:
                    worker.is_verified = True
        
        db.session.commit()
        
        return verification, None

    @staticmethod
    def get_worker_verification_status(worker_id):
        """
        Get verification status for a worker.

        Args:
            worker_id: ID of the worker

        Returns:
            Dictionary with verification status details
        """
        worker = Worker.query.get(worker_id)
        if not worker:
            return None, 'Worker not found'
        
        verifications = Verification.query.filter_by(worker_id=worker_id).all()
        
        # Count by status
        status_counts = {}
        for ver in verifications:
            status = ver.status.value
            status_counts[status] = status_counts.get(status, 0) + 1
        
        return {
            'worker_id': worker_id,
            'is_verified': worker.is_verified,
            'verification_score': worker.verification_score,
            'verification_counts': status_counts,
            'total_verifications': len(verifications)
        }, None

    @staticmethod
    def calculate_verification_score(worker_id):
        """
        Calculate verification score for a worker based on approved verifications.

        Args:
            worker_id: ID of the worker

        Returns:
            Updated verification score (0-100)
        """
        verifications = Verification.query.filter_by(
            worker_id=worker_id,
            status='approved'
        ).all()
        
        # Each approved verification gives 25 points, up to 100
        score = min(len(verifications) * 25, 100)
        
        # Update worker record
        worker = Worker.query.get(worker_id)
        if worker:
            worker.verification_score = score
            # Update verified status if score >= 75
            worker.is_verified = score >= 75
            db.session.commit()
        
        return score
# ----- END FILE -----
