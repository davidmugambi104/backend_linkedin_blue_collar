"""
Admin Permission System
- Role definitions
- Permission matrix
- Decorators for enforcement
"""
from functools import wraps
from flask import jsonify, request
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from app.models.user import User, UserRole
from app.extensions import db


# ============== ADMIN ROLES ==============

class AdminRole:
    """Admin role definitions"""
    SUPER_ADMIN = "super_admin"
    OPS_ADMIN = "ops_admin"
    TRUST_SAFETY = "trust_safety"
    FINANCE = "finance"


# ============== PERMISSIONS ==============

class Permission:
    """Permission constants"""
    # Users
    USERS_VIEW = "users:view"
    USERS_EDIT = "users:edit"
    USERS_SUSPEND = "users:suspend"
    USERS_RESET_VERIFICATION = "users:reset_verification"
    
    # Jobs
    JOBS_VIEW = "jobs:view"
    JOBS_MODERATE = "jobs:moderate"
    JOBS_UNPUBLISH = "jobs:unpublish"
    
    # Applications
    APPLICATIONS_VIEW = "applications:view"
    APPLICATIONS_MODERATE = "applications:moderate"
    
    # Verifications
    VERIFICATIONS_VIEW = "verifications:view"
    VERIFICATIONS_APPROVE = "verifications:approve"
    VERIFICATIONS_REJECT = "verifications:reject"
    VERIFICATIONS_BULK = "verifications:bulk"
    
    # Disputes
    DISPUTES_VIEW = "disputes:view"
    DISPUTES_RESOLVE = "disputes:resolve"
    DISPUTES_ASSIGN = "disputes:assign"
    
    # Payments
    PAYMENTS_VIEW = "payments:view"
    PAYMENTS_REFUND = "payments:refund"
    PAYMENTS_RECONCILE = "payments:reconcile"
    
    # Finance
    FINANCE_VIEW = "finance:view"
    FINANCE_EXPORT = "finance:export"
    
    # Fraud
    FRAUD_VIEW = "fraud:view"
    FRAUD_INVESTIGATE = "fraud:investigate"
    FRAUD_BLOCK = "fraud:block"
    
    # Admin Management
    ADMIN_VIEW = "admin:view"
    ADMIN_EDIT = "admin:edit"
    
    # Audit
    AUDIT_VIEW = "audit:view"
    AUDIT_EXPORT = "audit:export"
    
    # Settings
    SETTINGS_VIEW = "settings:view"
    SETTINGS_EDIT = "settings:edit"


# ============== ROLE-PERMISSION MATRIX ==============

ROLE_PERMISSIONS = {
    AdminRole.SUPER_ADMIN: [
        # All permissions
        "users:view", "users:edit", "users:suspend", "users:reset_verification",
        "jobs:view", "jobs:moderate", "jobs:unpublish",
        "applications:view", "applications:moderate",
        "verifications:view", "verifications:approve", "verifications:reject", "verifications:bulk",
        "disputes:view", "disputes:resolve", "disputes:assign",
        "payments:view", "payments:refund", "payments:reconcile",
        "finance:view", "finance:export",
        "fraud:view", "fraud:investigate", "fraud:block",
        "admin:view", "admin:edit",
        "audit:view", "audit:export",
        "settings:view", "settings:edit",
    ],
    AdminRole.OPS_ADMIN: [
        "users:view", "users:edit", "users:suspend", "users:reset_verification",
        "jobs:view", "jobs:moderate", "jobs:unpublish",
        "applications:view", "applications:moderate",
        "verifications:view", "verifications:approve", "verifications:reject", "verifications:bulk",
        "disputes:view", "disputes:resolve", "disputes:assign",
        "payments:view",
        "audit:view",
        "settings:view",
    ],
    AdminRole.TRUST_SAFETY: [
        "users:view", "users:suspend",
        "jobs:view", "jobs:moderate", "jobs:unpublish",
        "verifications:view", "verifications:approve", "verifications:reject",
        "disputes:view", "disputes:resolve", "disputes:assign",
        "fraud:view", "fraud:investigate", "fraud:block",
        "audit:view",
    ],
    AdminRole.FINANCE: [
        "users:view",
        "jobs:view",
        "payments:view", "payments:refund", "payments:reconcile",
        "finance:view", "finance:export",
        "audit:view",
    ],
}


# ============== HELPER FUNCTIONS ==============

def get_admin_role(user: User) -> str:
    """Get admin role from user record"""
    # Check if user has admin role attribute
    return getattr(user, 'admin_role', None) or AdminRole.OPS_ADMIN


def has_permission(user: User, permission: str) -> bool:
    """Check if user has a specific permission"""
    if user.role != UserRole.ADMIN:
        return False
    
    admin_role = get_admin_role(user)
    permissions = ROLE_PERMISSIONS.get(admin_role, [])
    return permission in permissions


def get_user_permissions(user: User) -> list:
    """Get all permissions for a user"""
    if user.role != UserRole.ADMIN:
        return []
    
    admin_role = get_admin_role(user)
    return ROLE_PERMISSIONS.get(admin_role, [])


# ============== DECORATORS ==============

def require_admin_role(*allowed_roles):
    """
    Decorator to require specific admin roles
    
    Usage:
        @require_admin_role('super_admin', 'ops_admin')
        def admin_view():
            ...
    """
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            user = User.query.get(int(user_id))
            
            if not user:
                return jsonify({"error": "User not found"}), 404
            
            if user.role != UserRole.ADMIN:
                return jsonify({"error": "Admin access required"}), 403
            
            admin_role = get_admin_role(user)
            if admin_role not in allowed_roles:
                return jsonify({
                    "error": "Insufficient permissions",
                    "required_roles": list(allowed_roles),
                    "your_role": admin_role
                }), 403
            
            # Store for use in route
            from flask import g
            g.current_admin = user
            g.admin_role = admin_role
            
            return f(*args, **kwargs)
        return wrapper
    return decorator


def require_permission(*required_permissions):
    """
    Decorator to require specific permissions
    
    Usage:
        @require_permission('users:view', 'users:edit')
        def manage_users():
            ...
    """
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            user = User.query.get(int(user_id))
            
            if not user:
                return jsonify({"error": "User not found"}), 404
            
            if user.role != UserRole.ADMIN:
                return jsonify({"error": "Admin access required"}), 403
            
            # Check each required permission
            user_permissions = get_user_permissions(user)
            missing = [p for p in required_permissions if p not in user_permissions]
            
            if missing:
                return jsonify({
                    "error": "Insufficient permissions",
                    "required": list(required_permissions),
                    "missing": missing,
                    "your_permissions": user_permissions
                }), 403
            
            # Store for use in route
            from flask import g
            g.current_admin = user
            
            return f(*args, **kwargs)
        return wrapper
    return decorator


# ============== ADMIN AUDIT LOG ==============

def log_admin_action(admin_user: User, action: str, entity_type: str = None, 
                     entity_id: int = None, old_values: dict = None, 
                     new_values: dict = None, reason: str = None):
    """Log admin action to audit trail"""
    from app.models.login_log import AuditLog
    
    try:
        audit = AuditLog(
            user_id=admin_user.id,
            action=f"admin_{action}",
            entity_type=entity_type,
            entity_id=entity_id,
            old_values=old_values,
            new_values=new_values,
            ip_address=request.remote_addr,
            user_agent=request.headers.get("User-Agent"),
        )
        
        # Add metadata if provided
        if reason:
            audit.new_values = audit.new_values or {}
            audit.new_values['reason'] = reason
        
        db.session.add(audit)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        # Don't fail the request if audit logging fails
        pass
