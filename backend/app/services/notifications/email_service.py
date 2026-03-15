from flask import current_app
from typing import Optional
import smtplib
import ssl
import json
from urllib import request as urllib_request
from urllib import error as urllib_error
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText


class EmailService:
    def _resend_config(self):
        return {
            "provider": (current_app.config.get("EMAIL_PROVIDER") or "auto").lower(),
            "api_key": current_app.config.get("RESEND_API_KEY"),
            "from_email": current_app.config.get("RESEND_FROM_EMAIL") or current_app.config.get("MAIL_DEFAULT_SENDER"),
            "api_url": current_app.config.get("RESEND_API_URL", "https://api.resend.com/emails"),
        }

    def _send_via_resend(self, to_email: str, subject: str, html_content: str,
                         text_content: Optional[str] = None) -> bool:
        cfg = self._resend_config()
        if not cfg["api_key"] or not cfg["from_email"]:
            return False

        payload = {
            "from": cfg["from_email"],
            "to": [to_email],
            "subject": subject,
            "html": html_content,
            "text": text_content or "",
        }

        body = json.dumps(payload).encode("utf-8")
        req = urllib_request.Request(
            cfg["api_url"],
            data=body,
            headers={
                "Authorization": f"Bearer {cfg['api_key']}",
                "Content-Type": "application/json",
            },
            method="POST",
        )

        try:
            with urllib_request.urlopen(req, timeout=15) as resp:
                status = getattr(resp, "status", 0)
                return 200 <= int(status) < 300
        except urllib_error.HTTPError as exc:
            current_app.logger.error(f"Resend HTTP error: {exc.code} {exc.reason}")
            return False
        except Exception as exc:
            current_app.logger.error(f"Resend send failed: {exc}")
            return False

    def _smtp_config(self):
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
        try:
            resend_cfg = self._resend_config()

            # Prefer API-based delivery when configured, since SMTP ports are often blocked on cloud VMs.
            if resend_cfg["provider"] in ("resend", "auto") and resend_cfg["api_key"]:
                if self._send_via_resend(to_email, subject, html_content, text_content):
                    return True
                if resend_cfg["provider"] == "resend":
                    return False

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
            with smtplib.SMTP(cfg["server"], cfg["port"], timeout=15) as smtp:
                if cfg["use_tls"]:
                    smtp.starttls(context=context)
                smtp.login(cfg["username"], cfg["password"])
                smtp.sendmail(msg["From"], to_email, msg.as_string())
            return True
        except Exception as e:
            current_app.logger.error(f"Email send failed: {e}")
            return False

    def send_template(self, to_email: str, template_id: str, dynamic_data: dict) -> bool:
        current_app.logger.info(f"[EMAIL] send_template not implemented for SMTP, template={template_id}")
        return False

    # === Common Email Templates ===

    def send_welcome_email(self, email: str, name: str, user_type: str) -> bool:
        subject = "Welcome to WorkForge!"
        html = f"""<html><body style="font-family:Arial,sans-serif;padding:20px;">
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
        html = f"""<html><body style="font-family:Arial,sans-serif;padding:20px;">
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
        html = f"""<html><body style="font-family:Arial,sans-serif;padding:20px;">
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
        html = f"""<html><body style="font-family:Arial,sans-serif;padding:20px;">
            <h2 style="color:#27ae60;">Payment Received!</h2>
            <p>Hello {worker_name},</p>
            <p>You received <strong>KES {amount:,.0f}</strong> for: {job_title}</p>
            <a href="https://workforge.co.ke/worker/payments"
               style="background:#27ae60;color:white;padding:12px 24px;text-decoration:none;border-radius:4px;">
                View Payments
            </a>
        </body></html>"""
        return self.send_email(worker_email, subject, html)

    def send_password_reset_code_email(self, email: str, name: str, code: str) -> bool:
        subject = "Your WorkForge Password Reset Code"
        html = f"""<html><body style="font-family:Arial,sans-serif;padding:20px;color:#1f2937;">
            <h2>Password Reset Code</h2>
            <p>Hello {name},</p>
            <p>Use the code below to reset your password:</p>
            <div style="margin:20px 0;font-size:32px;font-weight:700;letter-spacing:8px;color:#0A2540;">{code}</div>
            <p>This code expires in 10 minutes.</p>
            <p style="color:#6b7280;">If you did not request this, ignore this email.</p>
        </body></html>"""
        text = f"Hello {name}, your WorkForge password reset code is {code}. Expires in 10 minutes."
        return self.send_email(email, subject, html, text)

    def send_email_verification_code(self, email: str, name: str, code: str) -> bool:
        subject = "Verify Your WorkForge Email"
        html = f"""<html><body style="font-family:Arial,sans-serif;padding:20px;color:#1f2937;">
            <h2>Verify Your Email</h2>
            <p>Hello {name},</p>
            <p>Use this code to verify your WorkForge account:</p>
            <div style="margin:20px 0;font-size:32px;font-weight:700;letter-spacing:8px;color:#0A2540;">{code}</div>
            <p>This code expires in 10 minutes.</p>
        </body></html>"""
        text = f"Hello {name}, your WorkForge email verification code is {code}. Expires in 10 minutes."
        return self.send_email(email, subject, html, text)


email_service = EmailService()
