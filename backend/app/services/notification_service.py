# ----- FILE: backend/app/services/notification_service.py -----
from datetime import datetime
from ..extensions import socketio
from ..models import Application, Job, Worker, Employer
from flask import current_app


class NotificationService:
    @staticmethod
    def notify_new_message(sender_id, receiver_id, message_content):
        """
        Notify a user about a new message.

        Args:
            sender_id: ID of the sender
            receiver_id: ID of the receiver
            message_content: Content of the message
        """
        try:
            # Emit Socket.IO event
            socketio.emit(
                "new_message",
                {
                    "sender_id": sender_id,
                    "receiver_id": receiver_id,
                    "content": message_content,
                    "timestamp": datetime.utcnow().isoformat(),
                },
                room=receiver_id,
            )

            # In a real application, you might also send push notifications or emails here
            current_app.logger.info(
                f"New message notification: from {sender_id} to {receiver_id}"
            )
        except Exception as e:
            current_app.logger.error(f"Error sending message notification: {e}")

    @staticmethod
    def notify_application_status_change(application_id, new_status):
        """
        Notify a worker about a change in their application status.

        Args:
            application_id: ID of the application
            new_status: New status of the application
        """
        try:
            application = Application.query.get(application_id)
            if not application:
                return

            worker = Worker.query.get(application.worker_id)
            if not worker:
                return

            job = Job.query.get(application.job_id)

            # Emit Socket.IO event to the worker
            socketio.emit(
                "application_status_changed",
                {
                    "application_id": application_id,
                    "job_id": application.job_id,
                    "job_title": job.title if job else None,
                    "new_status": new_status,
                    "timestamp": datetime.utcnow().isoformat(),
                },
                room=worker.user_id,
            )

            current_app.logger.info(
                f"Application status change notification: application {application_id} to {new_status}"
            )
        except Exception as e:
            current_app.logger.error(
                f"Error sending application status notification: {e}"
            )

    @staticmethod
    def notify_new_application(job_id, application_id):
        """
        Notify an employer about a new application for their job.

        Args:
            job_id: ID of the job
            application_id: ID of the application
        """
        try:
            job = Job.query.get(job_id)
            if not job:
                return

            employer = Employer.query.get(job.employer_id)
            if not employer:
                return

            application = Application.query.get(application_id)
            worker = Worker.query.get(application.worker_id) if application else None

            # Emit Socket.IO event to the employer
            socketio.emit(
                "new_application",
                {
                    "job_id": job_id,
                    "job_title": job.title,
                    "application_id": application_id,
                    "worker_id": application.worker_id if application else None,
                    "worker_name": worker.full_name if worker else None,
                    "timestamp": datetime.utcnow().isoformat(),
                },
                room=employer.user_id,
            )

            current_app.logger.info(
                f"New application notification: job {job_id}, application {application_id}"
            )
        except Exception as e:
            current_app.logger.error(f"Error sending new application notification: {e}")

    @staticmethod
    def notify_job_completed(job_id):
        """
        Notify both employer and worker about job completion.

        Args:
            job_id: ID of the job
        """
        try:
            job = Job.query.get(job_id)
            if not job:
                return

            employer = Employer.query.get(job.employer_id)
            application = Application.query.filter_by(
                job_id=job_id, status="accepted"
            ).first()

            if not application:
                return

            worker = Worker.query.get(application.worker_id)

            # Notify employer
            if employer:
                socketio.emit(
                    "job_completed",
                    {
                        "job_id": job_id,
                        "job_title": job.title,
                        "worker_id": worker.id if worker else None,
                        "worker_name": worker.full_name if worker else None,
                        "timestamp": datetime.utcnow().isoformat(),
                    },
                    room=employer.user_id,
                )

            # Notify worker
            if worker:
                socketio.emit(
                    "job_completed",
                    {
                        "job_id": job_id,
                        "job_title": job.title,
                        "employer_id": employer.id if employer else None,
                        "company_name": employer.company_name if employer else None,
                        "timestamp": datetime.utcnow().isoformat(),
                    },
                    room=worker.user_id,
                )

            current_app.logger.info(f"Job completed notification: job {job_id}")
        except Exception as e:
            current_app.logger.error(f"Error sending job completion notification: {e}")

    @staticmethod
    def send_in_app_notification(user_id, title, message, notification_type="info"):
        """
        Send an in-app notification.

        Args:
            user_id: ID of the user to notify
            title: Notification title
            message: Notification message
            notification_type: Type of notification (info, success, warning, error)
        """
        try:
            socketio.emit(
                "in_app_notification",
                {
                    "title": title,
                    "message": message,
                    "type": notification_type,
                    "timestamp": datetime.utcnow().isoformat(),
                },
                room=user_id,
            )

            current_app.logger.info(
                f"In-app notification sent to user {user_id}: {title}"
            )
        except Exception as e:
            current_app.logger.error(f"Error sending in-app notification: {e}")


# ----- END FILE -----
