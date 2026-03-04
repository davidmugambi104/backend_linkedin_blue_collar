# ----- FILE: backend/app/utils/helpers.py -----
import json
from datetime import datetime, date
from flask import jsonify
from flask_jwt_extended import get_jwt_identity


class JSONEncoder(json.JSONEncoder):
    """Custom JSON encoder for Flask that handles dates and datetimes."""

    def default(self, obj):
        if isinstance(obj, (date, datetime)):
            return obj.isoformat()
        return super().default(obj)


def success_response(data=None, message="Success", status_code=200):
    """Return a standardized success response."""
    response = {"success": True, "message": message, "data": data}
    return jsonify(response), status_code


def error_response(message="An error occurred", errors=None, status_code=400):
    """Return a standardized error response."""
    response = {"success": False, "message": message, "errors": errors or {}}
    return jsonify(response), status_code


def paginate_query(query, page=1, per_page=20):
    """Paginate a SQLAlchemy query."""
    paginated = query.paginate(page=page, per_page=per_page, error_out=False)
    return {
        "items": [item.to_dict() for item in paginated.items],
        "page": paginated.page,
        "per_page": paginated.per_page,
        "total": paginated.total,
        "pages": paginated.pages,
    }


def validate_required_fields(data, required_fields):
    """Validate that required fields are present in data."""
    missing_fields = [
        field for field in required_fields if field not in data or data[field] is None
    ]
    if missing_fields:
        return False, f"Missing required fields: {', '.join(missing_fields)}"
    return True, ""


def sanitize_input(input_string):
    """Basic input sanitization to prevent XSS attacks."""
    if not input_string:
        return input_string

    # Replace potentially dangerous characters
    sanitized = input_string.replace("&", "&amp;")  # & should be replaced first
    sanitized = sanitized.replace("<", "&lt;").replace(">", "&gt;")
    sanitized = sanitized.replace('"', "&quot;").replace("'", "&#x27;")

    return sanitized


def format_currency(amount):
    """Format a number as currency."""
    if amount is None:
        return "$0.00"
    return f"${amount:,.2f}"


def get_time_ago(dt):
    """Get a human-readable time ago string."""
    if not dt:
        return "Never"

    now = datetime.utcnow()
    diff = now - dt

    if diff.days > 365:
        years = diff.days // 365
        return f"{years} year{'s' if years > 1 else ''} ago"
    elif diff.days > 30:
        months = diff.days // 30
        return f"{months} month{'s' if months > 1 else ''} ago"
    elif diff.days > 0:
        return f"{diff.days} day{'s' if diff.days > 1 else ''} ago"
    elif diff.seconds > 3600:
        hours = diff.seconds // 3600
        return f"{hours} hour{'s' if hours > 1 else ''} ago"
    elif diff.seconds > 60:
        minutes = diff.seconds // 60
        return f"{minutes} minute{'s' if minutes > 1 else ''} ago"
    else:
        return "Just now"


def generate_username_from_email(email):
    """Generate a username from an email address."""
    if not email:
        return None

    # Take the part before @ and replace non-alphanumeric characters
    username = email.split("@")[0]
    username = "".join(c for c in username if c.isalnum() or c in "._-")

    # Ensure username is not empty
    if not username:
        username = "user"

    return username.lower()


def get_current_user_id():
    """Get the current user ID from JWT token as an integer.
    
    Since JWT tokens store the identity as a string, this helper
    converts it back to an integer for database queries.
    """
    jwt_identity = get_jwt_identity()
    if jwt_identity is None:
        return None
    return int(jwt_identity) if isinstance(jwt_identity, str) else jwt_identity
