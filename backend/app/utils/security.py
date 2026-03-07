"""
Security utilities for WorkForge
- Rate limiting configuration
- Audit logging
- Role-based access control (RBAC)
- Request validation
"""
from functools import wraps
from flask import jsonify, request, g
from flask import session
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from datetime import datetime
import hmac
from ..extensions import db
import logging

logger = logging.getLogger(__name__)


# ============== RATE LIMITING ==============

def configure_rate_limits(limiter):
    """Configure rate limits for different endpoints"""
    
    # Auth endpoints - strict limits
    limiter.limit("5 per minute")(None)  # Default for auth
    limiter.limit("3 per minute", methods=["POST"])(None)
    
    # Custom limiters for sensitive endpoints
    limits = {
        'auth_login': '10 per minute',
        'auth_register': '5 per minute',
        'password_reset': '3 per minute',
        'payment': '20 per hour',
        'api': '100 per minute',
    }
    
    return limits


def get_rate_limit_key():
    """Get rate limit key based on user or IP"""
    try:
        verify_jwt_in_request(optional=True)
        user_id = get_jwt_identity()
        if user_id:
            return f"user:{user_id}"
    except:
        pass
    return f"ip:{request.remote_addr}"


# ============== AUDIT LOGGING ==============

def log_audit(user_id, action, entity_type=None, entity_id=None, 
              old_values=None, new_values=None):
    """Log an action to the audit table"""
    try:
        # Import here to avoid circular imports
        from app.models.login_log import AuditLog
        
        audit_entry = AuditLog(
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            old_values=old_values,
            new_values=new_values,
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')
        )
        db.session.add(audit_entry)
        db.session.commit()
    except Exception as e:
        logger.error(f"Audit logging failed: {e}")
        # Don't fail the request if audit logging fails


def audit_log(action, entity_type=None, entity_id=None):
    """
    Decorator for automatic audit logging
    
    Usage:
        @audit_log("user_updated", "user", lambda: g.current_user.id)
        def update_user():
            ...
    """
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            # Get user from JWT or None
            user_id = None
            try:
                verify_jwt_in_request(optional=True)
                user_id = get_jwt_identity()
            except:
                pass
            
            # Execute the function
            result = f(*args, **kwargs)
            
            # Log the action
            # Get entity_id dynamically if callable
            actual_entity_id = entity_id() if callable(entity_id) else entity_id
            
            log_audit(
                user_id=user_id,
                action=action,
                entity_type=entity_type,
                entity_id=actual_entity_id
            )
            
            return result
        return wrapper
    return decorator


class AuditLogger:
    """Class-based audit logger for more complex logging"""
    
    @staticmethod
    def log_login(user_id, success, method='password'):
        """Log user login attempt"""
        action = f"login_{'success' if success else 'failed'}"
        log_audit(
            user_id=user_id if success else None,
            action=action,
            new_values={'method': method, 'success': success}
        )
    
    @staticmethod
    def log_logout(user_id):
        """Log user logout"""
        log_audit(user_id=user_id, action="logout")
    
    @staticmethod
    def log_password_change(user_id):
        """Log password change"""
        log_audit(user_id=user_id, action="password_changed")
    
    @staticmethod
    def log_profile_update(user_id, old_data, new_data):
        """Log profile update"""
        log_audit(
            user_id=user_id,
            action="profile_updated",
            old_values=old_data,
            new_values=new_data
        )
    
    @staticmethod
    def log_payment(user_id, amount, payment_type):
        """Log payment action"""
        log_audit(
            user_id=user_id,
            action="payment_initiated",
            new_values={'amount': amount, 'type': payment_type}
        )
    
    @staticmethod
    def log_job_action(user_id, job_id, action):
        """Log job-related action"""
        log_audit(
            user_id=user_id,
            action=action,
            entity_type="job",
            entity_id=job_id
        )
    
    @staticmethod
    def log_admin_action(admin_user_id, action, target_type, target_id, details=None):
        """Log admin action"""
        log_audit(
            user_id=admin_user_id,
            action=f"admin_{action}",
            entity_type=target_type,
            entity_id=target_id,
            new_values=details
        )


# ============== ROLE-BASED ACCESS CONTROL ==============

def require_role(*roles):
    """
    Decorator to require specific roles
    
    Usage:
        @require_role('admin')
        def admin_only_view():
            ...
        
        @require_role('admin', 'employer')
        def employer_or_admin_view():
            ...
    """
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            
            # Get user from database
            from app.models.user import User
            user = User.query.get(user_id)
            
            if not user:
                return jsonify({"error": "User not found"}), 404
            
            role_value = user.role.value if hasattr(user.role, "value") else user.role
            if role_value not in roles:
                return jsonify({
                    "error": "Access denied",
                    "message": f"This action requires one of these roles: {', '.join(roles)}"
                }), 403
            
            # Store user in Flask g for use in route
            g.current_user = user
            return f(*args, **kwargs)
        return wrapper
    return decorator


def require_verified():
    """
    Decorator to require verified phone number
    
    Usage:
        @require_role('employer')
        @require_verified()
        def post_job():
            ...
    """
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            
            from app.models.user import User
            user = User.query.get(user_id)
            
            if not user:
                return jsonify({"error": "User not found"}), 404
            
            if not user.is_phone_verified:
                return jsonify({
                    "error": "Verification required",
                    "message": "Please verify your phone number to access this feature"
                }), 403
            
            return f(*args, **kwargs)
        return wrapper
    return decorator


# ============== INPUT VALIDATION ==============

def validate_phone(phone):
    """Validate Kenyan phone number format"""
    import re
    # Remove spaces, + country code
    phone = re.sub(r'\s+', '', phone)
    phone = phone.replace('+254', '0')
    
    # Check: starts with 0, has 9 or 10 digits
    if not re.match(r'^0[1-9]\d{8}$', phone):
        return False, "Invalid phone number format"
    
    return True, phone


def validate_email(email):
    """Validate email format"""
    import re
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(pattern, email):
        return False, "Invalid email format"
    return True, email


def sanitize_input(text, max_length=5000):
    """Sanitize user input"""
    if not text:
        return ""
    
    # Remove null bytes
    text = text.replace('\x00', '')
    
    # Trim to max length
    if len(text) > max_length:
        text = text[:max_length]
    
    return text.strip()


# ============== WEBHOOK VERIFICATION ==============

def verify_mpesa_signature(payload, signature, secret):
    """Verify M-Pesa webhook signature"""
    import hmac
    import hashlib
    
    # Create expected signature
    message = str(payload)
    expected = hmac.new(
        secret.encode(),
        message.encode(),
        hashlib.sha256
    ).hexdigest()
    
    # Constant-time comparison
    return hmac.compare_digest(expected, signature)


# ============== SECURITY HELPERS ==============

def is_safe_redirect_url(url):
    """Check if redirect URL is safe (prevent open redirect)"""
    from urllib.parse import urlparse
    
    if not url:
        return False
    
    parsed = urlparse(url)
    
    # Only allow relative URLs or same-domain URLs
    return parsed.netloc == '' or parsed.netloc == request.host


def generate_csrf_token():
    """Generate CSRF token"""
    import secrets
    return secrets.token_hex(32)


def verify_csrf_token(token):
    """Verify CSRF token"""
    session_token = session.get('csrf_token')
    if not session_token or not token:
        return False
    return hmac.compare_digest(token, session_token)
