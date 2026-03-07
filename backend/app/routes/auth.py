# ----- FILE: backend/app/routes/auth.py -----
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt_identity,
    get_jwt,
)
from ..extensions import db, jwt, limiter
from ..extensions import redis_cache
from ..models.user import UserRole
from ..models import User, Worker, Employer
from ..models.login_log import LoginLog, AuditLog
from ..schemas import UserSchema, UserLoginSchema
from ..utils.permissions import admin_required
from ..services.sms_service import sms_service
from datetime import datetime, timedelta
import random
import string

auth_bp = Blueprint("auth", __name__)

def _request_json():
  return request.get_json(silent=True) or {}


def _login_rate_limit_key():
  payload = _request_json()
  email = str(payload.get("email", "")).strip().lower()
  if email:
    return f"login:{request.remote_addr}:{email}"
  return f"login:{request.remote_addr}"


def _revoke_token(jwt_payload):
  jti = jwt_payload.get("jti")
  exp = jwt_payload.get("exp")
  if not jti or not exp:
    return

  now = int(datetime.utcnow().timestamp())
  ttl = max(exp - now, 1)
  redis_cache.setex(f"token_blacklist:{jti}", ttl, "1")


def _is_token_revoked(jwt_payload):
  jti = jwt_payload.get("jti")
  if not jti:
    return False
  return bool(redis_cache.get(f"token_blacklist:{jti}"))


def log_audit(user_id, action, entity_type=None, entity_id=None, new_values=None):
    """Log action to audit table"""
    try:
        audit = AuditLog(
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            new_values=new_values,
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')
        )
        db.session.add(audit)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Audit logging failed: {e}")


@auth_bp.route("/register", methods=["POST"])
@limiter.limit("5 per minute")
def register():
    """Register a new user
    ---
    tags:
      - Authentication
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - username
            - email
            - password
            - role
          properties:
            username:
              type: string
            email:
              type: string
              format: email
            password:
              type: string
              minLength: 6
            role:
              type: string
              enum: [worker, employer]
            phone:
              type: string
    responses:
      201:
        description: User created successfully
      400:
        description: Validation error
    """
    schema = UserSchema()
    data = schema.load(_request_json())

    # Create user
    user = User(
        username=data["username"], 
        email=data["email"], 
        role=UserRole(data["role"]),
        phone=data.get("phone")
    )
    user.set_password(data["password"])

    db.session.add(user)
    db.session.commit()

    # Audit log
    log_audit(user.id, "user_registered", "user", user.id, {"email": user.email, "role": user.role.value})

    # Create profile based on role
    if user.role == UserRole.WORKER:
        worker = Worker(user_id=user.id, full_name=user.username)
        db.session.add(worker)
    elif user.role == UserRole.EMPLOYER:
        employer = Employer(user_id=user.id, company_name=user.username)
        db.session.add(employer)

    db.session.commit()

    return (
        jsonify({"message": "User created successfully", "user": user.to_dict()}),
        201,
    )


@auth_bp.route("/login", methods=["POST"])
@limiter.limit("10 per minute", key_func=_login_rate_limit_key)
def login():
    """Login user
    ---
    tags:
      - Authentication
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - email
            - password
          properties:
            email:
              type: string
              format: email
            password:
              type: string
    responses:
      200:
        description: Login successful
        schema:
          properties:
            access_token:
              type: string
            refresh_token:
              type: string
            user:
              type: object
      401:
        description: Invalid credentials
    """
    schema = UserLoginSchema()
    data = schema.load(_request_json())

    user = User.query.filter_by(email=data["email"]).first()
    if not user or not user.check_password(data["password"]):
        if user:
            db.session.add(
                LoginLog(
                    user_id=user.id,
                    ip_address=request.remote_addr,
                    user_agent=request.headers.get("User-Agent"),
                    success=False,
                )
            )
            db.session.commit()
        return jsonify({"error": "Invalid email or password"}), 401

    if not user.is_active:
        # Log failed attempt
        log_audit(user.id, "login_failed", "user", user.id, {"reason": "account_deactivated"})
        db.session.add(
            LoginLog(
                user_id=user.id,
                ip_address=request.remote_addr,
                user_agent=request.headers.get("User-Agent"),
                success=False,
            )
        )
        db.session.commit()
        return jsonify({"error": "Account is deactivated"}), 403

    # Log successful login
    log_audit(user.id, "login_success", "user", user.id)
    db.session.add(
        LoginLog(
            user_id=user.id,
            ip_address=request.remote_addr,
            user_agent=request.headers.get("User-Agent"),
            success=True,
        )
    )
    db.session.commit()

    # Create tokens
    access_token = create_access_token(
        identity=str(user.id), additional_claims={"role": user.role.value}
    )
    refresh_token = create_refresh_token(identity=str(user.id))

    return (
        jsonify(
            {
                "access_token": access_token,
                "refresh_token": refresh_token,
                "user": user.to_dict(),
            }
        ),
        200,
    )


@auth_bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    current_user = get_jwt_identity()
    user = User.query.get(int(current_user))

    if not user or not user.is_active:
        return jsonify({"error": "User not found or inactive"}), 401

    new_access_token = create_access_token(
        identity=str(user.id), additional_claims={"role": user.role.value}
    )
    return jsonify({"access_token": new_access_token}), 200


@auth_bp.route("/logout", methods=["POST"])
@jwt_required()
def logout():
    jwt_payload = get_jwt()
    _revoke_token(jwt_payload)
    
    # Audit log
    user_id = int(get_jwt_identity())
    log_audit(user_id, "logout", "user", user_id)
    
    return jsonify({"message": "Successfully logged out"}), 200


@auth_bp.route("/logout/refresh", methods=["POST"])
@jwt_required(refresh=True)
def logout_refresh():
    jwt_payload = get_jwt()
    _revoke_token(jwt_payload)
    return jsonify({"message": "Refresh token revoked"}), 200


# JWT callback to check blacklist
@jwt.token_in_blocklist_loader
def check_if_token_in_blacklist(jwt_header, jwt_payload):
    return _is_token_revoked(jwt_payload)


# Admin route to activate/deactivate users
@auth_bp.route("/admin/users/<int:user_id>/activate", methods=["PUT"])
@jwt_required()
@admin_required
def toggle_user_activation(user_id):
    user = User.query.get_or_404(user_id)
    admin_id = int(get_jwt_identity())

    data = _request_json()
    if "is_active" not in data:
        return jsonify({"error": "Missing is_active field"}), 400

    user.is_active = data["is_active"]
    db.session.commit()

    # Audit log
    log_audit(
        admin_id, 
        f"user_{'activated' if user.is_active else 'deactivated'}", 
        "user", 
        user_id,
        {"is_active": user.is_active}
    )

    return (
        jsonify(
            {
                "message": f"User {'activated' if user.is_active else 'deactivated'}",
                "user": user.to_dict(),
            }
        ),
        200,
    )


# Password Reset - Request reset code
@auth_bp.route("/password-reset/request", methods=["POST"])
@limiter.limit("3 per minute")
def request_password_reset():
    data = _request_json()
    email = data.get("email")
    
    if not email:
        return jsonify({"error": "Email is required"}), 400
    
    user = User.query.filter_by(email=email).first()
    
    # Always return success to prevent email enumeration
    if user:
        # Generate 6-digit code
        code = "".join(random.choices(string.digits, k=6))
        user.reset_code = code
        user.reset_code_expires = datetime.utcnow() + timedelta(minutes=10)
        db.session.commit()
        
        # Send via SMS if phone exists
        if user.phone:
            sms_service.send_sms(
                user.phone, 
                f"Your WorkForge password reset code is: {code}. Valid for 10 minutes."
            )
        
        # In development, also return the code
        if current_app.config.get("DEBUG"):
            return jsonify({"message": "Password reset code sent", "code": code}), 200
    
    return jsonify({"message": "If an account exists with this email, a reset code has been sent"}), 200


# Password Reset - Verify code and reset
@auth_bp.route("/password-reset/verify", methods=["POST"])
@limiter.limit("5 per minute", key_func=_login_rate_limit_key)
def verify_password_reset():
    data = _request_json()
    email = data.get("email")
    code = data.get("code")
    new_password = data.get("new_password")
    
    if not all([email, code, new_password]):
        return jsonify({"error": "Email, code, and new_password are required"}), 400
    
    user = User.query.filter_by(email=email).first()
    
    if not user or not user.reset_code:
        return jsonify({"error": "Invalid reset request"}), 400
    
    if user.reset_code != code:
        return jsonify({"error": "Invalid reset code"}), 400
    
    if user.reset_code_expires < datetime.utcnow():
        return jsonify({"error": "Reset code has expired"}), 400
    
    # Reset password
    user.set_password(new_password)
    user.reset_code = None
    user.reset_code_expires = None
    db.session.commit()
    
    return jsonify({"message": "Password reset successfully"}), 200


# Change password (when logged in)
@auth_bp.route("/password/change", methods=["POST"])
@jwt_required()
@limiter.limit("10 per hour")
def change_password():
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    
    data = _request_json()
    current_password = data.get("current_password")
    new_password = data.get("new_password")
    
    if not all([current_password, new_password]):
        return jsonify({"error": "Current password and new password are required"}), 400
    
    if not user.check_password(current_password):
        return jsonify({"error": "Current password is incorrect"}), 401
    
    user.set_password(new_password)
    db.session.commit()
    
    return jsonify({"message": "Password changed successfully"}), 200


