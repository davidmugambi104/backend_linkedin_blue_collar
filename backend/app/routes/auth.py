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
from ..services.notifications.email_service import email_service
from datetime import datetime, timedelta
import random
import string
from marshmallow import ValidationError
from sqlalchemy.exc import IntegrityError

auth_bp = Blueprint("auth", __name__)

def _request_json():
  return request.get_json(silent=True) or {}


def _login_rate_limit_key():
  payload = _request_json()
  email = str(payload.get("email", "")).strip().lower()
  if email:
    return f"login:{request.remote_addr}:{email}"
  return f"login:{request.remote_addr}"


def _generate_numeric_code(length=6):
  return "".join(random.choices(string.digits, k=length))


def _issue_email_verification_code(user):
  code = _generate_numeric_code()
  user.email_verification_code = code
  user.email_verification_expires = datetime.utcnow() + timedelta(minutes=10)
  db.session.commit()
  email_service.send_email_verification_code(user.email, user.username, code)
  return code


def _should_expose_auth_debug_codes():
  return bool(current_app.config.get("EXPOSE_AUTH_DEBUG_CODES"))


def _require_admin_confirmation(action_name):
  if not current_app.config.get("REQUIRE_ADMIN_CONFIRMATION", True):
    return None

  expected = current_app.config.get("ADMIN_ACTION_CONFIRMATION_TOKEN")
  if not expected:
    return None

  provided = request.headers.get("X-Admin-Confirm")
  if provided != expected:
    return jsonify(
      {
        "error": "Admin confirmation required",
        "message": f"Missing or invalid X-Admin-Confirm for action '{action_name}'",
      }
    ), 403

  return None


def _mask_phone(phone):
  if not phone:
    return None
  value = str(phone)
  if len(value) <= 4:
    return "*" * len(value)
  return ("*" * (len(value) - 4)) + value[-4:]


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
    try:
      data = schema.load(_request_json())
    except ValidationError as exc:
      return jsonify({"error": "Validation error", "details": exc.messages}), 400
    except ValueError as exc:
      return jsonify({"error": str(exc)}), 400

    # Create user
    user = User(
        username=data["username"], 
        email=data["email"], 
        role=UserRole(data["role"]),
      phone=data.get("phone"),
      is_email_verified=False,
    )
    user.set_password(data["password"])

    db.session.add(user)
    try:
      db.session.commit()
    except IntegrityError:
      db.session.rollback()
      return jsonify({"error": "User with this email or username already exists"}), 400

    # Audit log
    log_audit(user.id, "user_registered", "user", user.id, {"email": user.email, "role": user.role.value})

    # Create profile based on role
    if user.role == UserRole.WORKER:
        worker = Worker(user_id=user.id, full_name=user.username)
        db.session.add(worker)
    elif user.role == UserRole.EMPLOYER:
        employer = Employer(user_id=user.id, company_name=user.username)
        db.session.add(employer)

    try:
      db.session.commit()
    except IntegrityError:
      db.session.rollback()
      return jsonify({"error": "Failed to create profile"}), 400

    verification_code = _issue_email_verification_code(user)

    return (
      jsonify(
        {
          "message": "User created successfully. Verify your email to continue.",
          "user": user.to_dict(),
          "requires_email_verification": True,
          "email": user.email,
          **({"verification_code": verification_code} if _should_expose_auth_debug_codes() else {}),
        }
      ),
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
        code = _generate_numeric_code()
        user.reset_code = code
        user.reset_code_expires = datetime.utcnow() + timedelta(minutes=10)
        db.session.commit()
        
        # Send via SMS if phone exists
        sms_sent = False
        if user.phone:
            sms_sent = bool(sms_service.send_sms(
                user.phone, 
                f"Your WorkForge password reset code is: {code}. Valid for 10 minutes."
            ))

        email_sent = bool(email_service.send_password_reset_code_email(user.email, user.username, code))

        if not sms_sent and not email_sent:
            current_app.logger.warning(
                "No reset-code delivery channel succeeded for user_id=%s. Use admin support fallback.",
                user.id,
            )
        
        # In development, also return the code
        if _should_expose_auth_debug_codes():
            return jsonify({"message": "Password reset code sent", "code": code}), 200
    
    return jsonify({"message": "If an account exists with this email, a reset code has been sent"}), 200


@auth_bp.route("/email-verification/request", methods=["POST"])
@limiter.limit("3 per minute")
def request_email_verification():
    data = _request_json()
    email = str(data.get("email", "")).strip().lower()

    if not email:
        return jsonify({"error": "Email is required"}), 400

    user = User.query.filter_by(email=email).first()

    if not user:
        return jsonify({"message": "If an account exists with this email, a verification code has been sent"}), 200

    if user.is_email_verified:
        return jsonify({"message": "Email is already verified", "verified": True}), 200

    code = _issue_email_verification_code(user)
    payload = {"message": "Verification code sent", "email": user.email}
    if _should_expose_auth_debug_codes():
        payload["verification_code"] = code
    return jsonify(payload), 200


@auth_bp.route("/email-verification/verify", methods=["POST"])
@limiter.limit("5 per minute", key_func=_login_rate_limit_key)
def verify_email_verification():
    data = _request_json()
    email = str(data.get("email", "")).strip().lower()
    code = str(data.get("code", "")).strip()

    if not email or not code:
        return jsonify({"error": "Email and code are required"}), 400

    user = User.query.filter_by(email=email).first()

    if not user:
        return jsonify({"error": "Invalid verification request"}), 400

    if user.is_email_verified:
        return jsonify({"message": "Email already verified", "verified": True, "user": user.to_dict()}), 200

    if not user.email_verification_code or user.email_verification_code != code:
        return jsonify({"error": "Invalid verification code"}), 400

    if not user.email_verification_expires or user.email_verification_expires < datetime.utcnow():
        return jsonify({"error": "Verification code has expired"}), 400

    user.is_email_verified = True
    user.email_verification_code = None
    user.email_verification_expires = None
    db.session.commit()

    return jsonify({"message": "Email verified successfully", "verified": True, "user": user.to_dict()}), 200


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


  @auth_bp.route("/password-reset/admin/recovery-code", methods=["POST"])
  @jwt_required()
  @admin_required
  @limiter.limit("10 per hour")
  def admin_issue_password_reset_code():
    """Admin-only support fallback for password reset when delivery channels are unavailable.

    Requires X-Admin-Confirm header when REQUIRE_ADMIN_CONFIRMATION is enabled.
    """
    confirm_error = _require_admin_confirmation("admin_password_reset_recovery_code")
    if confirm_error:
      return confirm_error

    data = _request_json()
    email = str(data.get("email", "")).strip().lower()
    reason = str(data.get("reason", "")).strip()

    if not email:
      return jsonify({"error": "Email is required"}), 400
    if not reason:
      return jsonify({"error": "Reason is required"}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
      return jsonify({"error": "User not found"}), 404

    code = _generate_numeric_code()
    expires_at = datetime.utcnow() + timedelta(minutes=10)
    user.reset_code = code
    user.reset_code_expires = expires_at
    db.session.commit()

    admin_id = int(get_jwt_identity())
    log_audit(
      admin_id,
      "admin_password_reset_code_issued",
      "user",
      user.id,
      {
        "target_email": user.email,
        "target_phone_masked": _mask_phone(user.phone),
        "reason": reason,
        "expires_at": expires_at.isoformat(),
      },
    )

    return jsonify(
      {
        "message": "Recovery code issued for support handoff",
        "email": user.email,
        "code": code,
        "expires_at": expires_at.isoformat(),
        "delivery_hint": {
          "phone_masked": _mask_phone(user.phone),
          "private_handoff_required": True,
        },
      }
    ), 200


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


