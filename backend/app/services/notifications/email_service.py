# ----- FILE: backend/app/services/notifications/email_service.py -----
from flask import current_app
from typing import Optional
import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText


class EmailService:
    def _smtp_config(self):
        """Pull SMTP settings from Flask app config."""
        return {
            "server": current_app.config.get("MAIL_SERVER", "smtp.gmail.com"),
            "port": int(current_app.config.get("MAIL_PORT", 587)),
            "use_tls": current_app.config.get("MAIL_USE_TLS", True),
            "username": current_app.config.get("MAIL_USERNAME"),
            "password": current_app.config.get("MAIL_PASSWORD"),
            "from_email": current_app.config.get("MAIL_DEFAULT_SENDER"),
        }

    def send_email(self, to_email: str, subject: str, html_content: str,
                   text_content: Optional[str] = None) -> bool:
        """Send an email via SMTP."""
        try:
            cfg = self._smtp_config()
            if not cfg["username"] or not cfg["password"]:
                current_app.logger.info(f"[DEV EMAIL] To: {to_email}, Subject: {subject}")
                return True

            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = cfg["from_email"] or cfg["username"]
            msg["To"] = to_email

            if text_content:
                msg.attach(MIMEText(text_content, "plain"))
            if html_content:
                msg.attach(MIMEText(html_content, "html"))

            context = ssl.create_default_context()
            with smtplib.SMTP(cfg["server"], cfg["port"]) as smtp:
                if cfg["use_tls"]:
                    smtp.starttls(context=context)
                smtp.login(cfg["username"], cfg["password"])
                smtp.sendmail(msg["From"], to_email, msg.as_string())
            return True
        except Exception as e:
            current_app.logger.error(f"Email send failed: {e}")
            return False

    def send_template(self, to_email: str, template_id: str, dynamic_data: dict) -> bool:
        """Stub kept for API compatibility — plain send_email is preferred."""
        current_app.logger.info(f"[EMAIL] send_template not implemented for SMTP, template={template_id}")
        return False

    # === Common Email Templates ===

    def send_welcome_email(self, email: str, name: str, user_type: str) -> bool:
        subject = "Welcome to WorkForge!"
        html = f"""
        <html><body style="font-family:Arial,sans-serif;padding:20px;">
            <h2 style="color:#2c3e50;">Welcome to WorkForge, {name}!</h2>
            <p>Thank you for joining as a <strong>{user_type}</strong>.</p>
            <p>Complete your profile to start:</p>
            <ul>
                <li>Add your skills and experience</li>
                <li>Upload your ID for verification</li>
                <li>Set your availability and rates</li>
            </ul>
            <a href="https://workforge.co.ke/dashboard"
               style="background:#3498db;color:white;padding:12px 24px;text-decoration:none;border-radius:4px;">
                Go to Dashboard
            </a>
        </body></html>"""
        return self.send_email(email, subject, html)

    def send_job_application_email(self, employer_email: str, employer_name: str,
                                   worker_name: str, job_title: str) -> bool:
        subject = f"New Application for: {job_title}"
        html = f"""
        <html><body style="font-family:Arial,sans-serif;padding:20px;">
            <h2>New Application Received</h2>
            <p>Hello {employer_name},</p>
            <p><strong>{worker_name}</strong> has applied for your job: <em>{job_title}</em></p>
            <a href="https://workforge.co.ke/employer/applications"
               style="background:#27ae60;color:white;padding:12px 24px;text-decoration:none;border-radius:4px;">
                View Applications
            </a>
        </body></html>"""
        return self.send_email(employer_email, subject, html)

    def send_application_status_email(self, worker_email: str, worker_name: str,
                                       job_title: str, status: str) -> bool:
        subject = f"Application Update: {job_title}"
        html = f"""
        <html><body style="font-family:Arial,sans-serif;padding:20px;">
            <h2>Application {status.title()}</h2>
            <p>Hello {worker_name},</p>
            <p>Your application for <strong>{job_title}</strong> has been <strong>{status}</strong>.</p>
            <a href="https://workforge.co.ke/worker/applications"
               style="background:#3498db;color:white;padding:12px 24px;text-decoration:none;border-radius:4px;">
                View Status
            </a>
        </body></html>"""
        return self.send_email(worker_email, subject, html)

    def send_payment_received_email(self, worker_email: str, worker_name: str,
                                     amount: float, job_title: str) -> bool:
        subject = f"Payment Received: KES {amount:,.0f}"
        html = f"""
        <html><body style="font-family:Arial,sans-serif;padding:20px;">
            <h2 style="color:#27ae60;">Payment Received! 💰</h2>
            <p>Hello {worker_name},</p>
            <p>You've received <strong>KES {amount:,.0f}</strong> for: {job_title}</p>
            <a href="https://workforge.co.ke/worker/payments"
               style="background:#27ae60;color:white;padding:12px 24px;text-decoration:none;border-radius:4px;">
                View Payments
            </a>
        </body></html>"""
        return self.send_email(worker_email, subject, html)

    def send_password_reset_code_email(self, email: str, name: str, code: str) -> bool:
        subject = "Your WorkForge Password Reset Code"
        html = f"""
        <html><body style="font-family:Arial,sans-serif;padding:20px;color:#1f2937;">
            <h2>Password Reset Code</h2>
            <p>Hello {name},</p>
            <p>Use the verification code below to reset your password:</p>
            <div style="margin:20px 0;font-size:32px;font-weight:700;letter-spacing:8px;color:#0A2540;">
                {code}
            </div>
            <p>This code expires in 10 minutes.</p>
            <p style="color:#6b7280;">If you did not request this, you can ignore this email.</p>
        </body></html>"""
        text = f"Hello {name}, your WorkForge password reset code is {code}. It expires in 10 minutes."
        return self.send_email(email, subject, html, text)

    def send_email_verification_code(self, email: str, name: str, code: str) -> bool:
        subject = "Verify Your WorkForge Email"
        html = f"""
        <html><body style="font-family:Arial,sans-serif;padding:20px;color:#1f2937;">
            <h2>Verify Your Email</h2>
            <p>Hello {name},</p>
            <p>Use this code to verify your WorkForge account:</p>
            <div style="margin:20px 0;font-size:32px;font-weight:700;letter-spacing:8px;color:#0A2540;">
                {code}
            </div>
            <p>This code expires in 10 minutes.</p>
        </body></html>"""
        text = f"Hello {name}, your WorkForge email verification code is {code}. It expires in 10 minutes."
        return self.send_email(email, subject, html, text)


email_service = EmailService()

    # === Common Email Templates ===
    
    def send_welcome_email(self, email: str, name: str, user_type: str) -> bool:
        """Send welcome email."""
        subject = "Welcome to WorkForge!"
        html = f"""
        <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #2c3e50;">Welcome to WorkForge, {name}!</h2>
            <p>Thank you for joining as a <strong>{user_type}</strong>.</p>
            <p>Complete your profile to start:</p>
            <ul>
                <li>Add your skills and experience</li>
                <li>Upload your ID for verification</li>
                <li>Set your availability and rates</li>
            </ul>
            <a href="https://workforge.co.ke/dashboard" 
               style="background: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
                Go to Dashboard
            </a>
        </body>
        </html>
        """
        return self.send_email(email, subject, html)

    def send_job_application_email(self, employer_email: str, employer_name: str, 
                                   worker_name: str, job_title: str) -> bool:
        """Notify employer of new application."""
        subject = f"New Application for: {job_title}"
        html = f"""
        <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>New Application Received</h2>
            <p>Hello {employer_name},</p>
            <p><strong>{worker_name}</strong> has applied for your job: <em>{job_title}</em></p>
            <a href="https://workforge.co.ke/employer/applications" 
               style="background: #27ae60; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
                View Applications
            </a>
        </body>
        </html>
        """
        return self.send_email(employer_email, subject, html)

    def send_application_status_email(self, worker_email: str, worker_name: str,
                                       job_title: str, status: str) -> bool:
        """Notify worker of application status."""
        status_emoji = {"accepted": "✅", "rejected": "❌", "shortlisted": "⭐"}
        subject = f"Application Update: {job_title}"
        html = f"""
        <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Application {status.title()}</h2>
            <p>Hello {worker_name},</p>
            <p>Your application for <strong>{job_title}</strong> has been <strong>{status}</strong>.</p>
            <a href="https://workforge.co.ke/worker/applications" 
               style="background: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
                View Status
            </a>
        </body>
        </html>
        """
        return self.send_email(worker_email, subject, html)

    def send_payment_received_email(self, worker_email: str, worker_name: str,
                                     amount: float, job_title: str) -> bool:
        """Notify worker of payment received."""
        subject = f"Payment Received: KES {amount:,.0f}"
        html = f"""
        <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #27ae60;">Payment Received! 💰</h2>
            <p>Hello {worker_name},</p>
            <p>You've received <strong>KES {amount:,.0f}</strong> for: {job_title}</p>
            <a href="https://workforge.co.ke/worker/payments" 
               style="background: #27ae60; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
                View Payments
            </a>
        </body>
        </html>
        """
        return self.send_email(worker_email, subject, html)

    def send_password_reset_email(self, email: str, name: str, reset_link: str) -> bool:
        """Send password reset email."""
        subject = "Reset Your WorkForge Password"
        html = f"""
        <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Password Reset Request</h2>
            <p>Hello {name},</p>
            <p>Click the button below to reset your password:</p>
            <a href="{reset_link}" 
               style="background: #e74c3c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
                Reset Password
            </a>
            <p style="color: #7f8c8d; margin-top: 20px;">
                This link expires in 1 hour. If you didn't request this, please ignore.
            </p>
        </body>
        </html>
        """
        return self.send_email(email, subject, html)

    def send_password_reset_code_email(self, email: str, name: str, code: str) -> bool:
        """Send password reset code email."""
        subject = "Your WorkForge Password Reset Code"
        html = f"""
        <html>
        <body style="font-family: Arial, sans-serif; padding: 20px; color: #1f2937;">
            <h2>Password Reset Code</h2>
            <p>Hello {name},</p>
            <p>Use the verification code below to reset your password:</p>
            <div style="margin: 20px 0; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #0A2540;">
                {code}
            </div>
            <p>This code expires in 10 minutes.</p>
            <p style="color: #6b7280;">If you did not request this, you can ignore this email.</p>
        </body>
        </html>
        """
        text = f"Hello {name}, your WorkForge password reset code is {code}. It expires in 10 minutes."
        return self.send_email(email, subject, html, text)

    def send_email_verification_code(self, email: str, name: str, code: str) -> bool:
        """Send email verification code."""
        subject = "Verify Your WorkForge Email"
        html = f"""
        <html>
        <body style="font-family: Arial, sans-serif; padding: 20px; color: #1f2937;">
            <h2>Verify Your Email</h2>
            <p>Hello {name},</p>
            <p>Use this code to verify your WorkForge account:</p>
            <div style="margin: 20px 0; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #0A2540;">
                {code}
            </div>
            <p>This code expires in 10 minutes.</p>
        </body>
        </html>
        """
        text = f"Hello {name}, your WorkForge email verification code is {code}. It expires in 10 minutes."
        return self.send_email(email, subject, html, text)


email_service = EmailService()
