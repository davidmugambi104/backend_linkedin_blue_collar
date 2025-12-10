# ----- FILE: backend/app/utils/validators.py -----
import re
from flask import request
from ..extensions import db
from ..models import User, Skill

def validate_email_format(email):
    """Validate email format."""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'  # FIX: escaped dot
    return re.match(pattern, email) is not None

def validate_phone_number(phone):
    """Validate phone number format (basic international format)."""
    pattern = r'^\+?[1-9]\d{1,14}$'  # FIX: escaped +
    return re.match(pattern, phone) is not None

def validate_password_strength(password):
    """
    Validate password strength.

    Requirements:
    - At least 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one digit
    - At least one special character
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"

    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"

    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"

    if not re.search(r'\d', password):
        return False, "Password must contain at least one digit"

    if not re.search(r'[!@#$%^&*(),.?\":{}|<>]', password):
        return False, "Password must contain at least one special character"

    return True, "Password is strong"

def validate_username(username):
    """Validate username format."""
    pattern = r'^[a-zA-Z0-9._-]{3,50}$'
    return re.match(pattern, username) is not None

def validate_url(url):
    """Validate URL format."""
    pattern = r'^https?://(?:[-\w.]|(?:%[\da-fA-F]{2}))+'
    return re.match(pattern, url) is not None

def validate_latitude(lat):
    """Validate latitude value."""
    try:
        lat_float = float(lat)
        return -90.0 <= lat_float <= 90.0
    except (ValueError, TypeError):
        return False

def validate_longitude(lng):
    """Validate longitude value."""
    try:
        lng_float = float(lng)
        return -180.0 <= lng_float <= 180.0
    except (ValueError, TypeError):
        return False

def validate_rating(rating):
    """Validate rating value (1-5)."""
    try:
        rating_int = int(rating)
        return 1 <= rating_int <= 5
    except (ValueError, TypeError):
        return False

def validate_skill_exists(skill_id):
    """Check if a skill exists."""
    return Skill.query.get(skill_id) is not None

def validate_user_exists(user_id):
    """Check if a user exists."""
    return User.query.get(user_id) is not None

def validate_job_exists(job_id):
    """Check if a job exists."""
    from ..models import Job
    return Job.query.get(job_id) is not None

def validate_worker_exists(worker_id):
    """Check if a worker exists."""
    from ..models import Worker
    return Worker.query.get(worker_id) is not None

def validate_employer_exists(employer_id):
    """Check if an employer exists."""
    from ..models import Employer
    return Employer.query.get(employer_id) is not None

def validate_json_request():
    """Validate that the request has JSON content."""
    if not request.is_json:
        return False, "Request must be JSON"
    return True, ""

def validate_required_fields(data, required_fields):
    """
    Validate that required fields are present in data.

    Args:
        data: Dictionary of data
        required_fields: List of required field names

    Returns:
        Tuple (is_valid, error_message)
    """
    missing_fields = []
    for field in required_fields:
        if field not in data or data[field] is None or data[field] == '':
            missing_fields.append(field)

    if missing_fields:
        return False, f"Missing required fields: {', '.join(missing_fields)}"

    return True, ""
