# ----- FILE: backend/app/services/bulk_service.py -----
"""
Bulk Operations Service - Bulk hiring, verification, messaging.
"""
from typing import List, Dict, Any
from datetime import datetime
from ..extensions import db
from ..models import User, Worker, Employer, Job, Application
from ..models.job import JobStatus


class BulkService:
    """Service for bulk operations."""
    
    def bulk_hire(self, job_id: int, worker_ids: List[int], employer_id: int) -> Dict[str, Any]:
        """Hire multiple workers for a job."""
        job = Job.query.get(job_id)
        if not job:
            return {'error': 'Job not found'}
        
        if job.employer_id != employer_id:
            return {'error': 'Not authorized'}
        
        if job.status != JobStatus.OPEN:
            return {'error': 'Job is not open'}
        
        if len(worker_ids) > job.number_of_fundis_needed:
            return {'error': f'Exceeds required workers ({job.number_of_fundis_needed})'}
        
        hired = []
        failed = []
        
        for worker_id in worker_ids:
            # Check if already applied
            existing = Application.query.filter_by(
                job_id=job_id, worker_id=worker_id
            ).first()
            
            if existing:
                if existing.status == 'accepted':
                    hired.append({'worker_id': worker_id, 'status': 'already_hired'})
                else:
                    # Update to accepted
                    existing.status = 'accepted'
                    existing.updated_at = datetime.utcnow()
                    hired.append({'worker_id': worker_id, 'status': 'hired'})
            else:
                # Create new application
                app = Application(
                    job_id=job_id,
                    worker_id=worker_id,
                    status='accepted',
                    cover_letter='Bulk hired'
                )
                db.session.add(app)
                hired.append({'worker_id': worker_id, 'status': 'hired'})
        
        db.session.commit()
        
        return {
            'job_id': job_id,
            'hired_count': len(hired),
            'failed_count': len(failed),
            'results': hired + failed
        }
    
    def bulk_verify_workers(self, worker_ids: List[int], admin_id: int) -> Dict[str, Any]:
        """Bulk verify multiple workers."""
        verified = []
        failed = []
        
        for worker_id in worker_ids:
            worker = Worker.query.get(worker_id)
            if not worker:
                failed.append({'worker_id': worker_id, 'error': 'Not found'})
                continue
            
            worker.is_verified = True
            worker.verification_score = min(100, worker.verification_score + 25)
            verified.append({'worker_id': worker_id, 'status': 'verified'})
        
        db.session.commit()
        
        return {
            'verified_count': len(verified),
            'failed_count': len(failed),
            'results': verified + failed
        }
    
    def bulk_send_messages(self, sender_id: int, receiver_ids: List[int], 
                          message: str, job_id: int = None) -> Dict[str, Any]:
        """Send same message to multiple users."""
        from ..models import Message
        
        sent = []
        
        for receiver_id in receiver_ids:
            msg = Message(
                sender_id=sender_id,
                receiver_id=receiver_id,
                content=message,
                job_id=job_id
            )
            db.session.add(msg)
            sent.append({'receiver_id': receiver_id, 'status': 'sent'})
        
        db.session.commit()
        
        return {
            'sent_count': len(sent),
            'results': sent
        }


bulk_service = BulkService()
