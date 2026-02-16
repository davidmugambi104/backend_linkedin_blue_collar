# ----- FILE: backend/app/services/auth_service.py -----
from ..extensions import db
from ..models import User, UserRole


class AuthService:
    @staticmethod
    def register_user(username, email, password, role):
        """Register a new user."""
        # Check if user already exists
        if User.query.filter_by(username=username).first():
            return None, "Username already exists"

        if User.query.filter_by(email=email).first():
            return None, "Email already exists"

        # Create user
        user = User(username=username, email=email, role=UserRole(role))
        user.set_password(password)

        db.session.add(user)
        db.session.commit()

        # Create profile based on role
        if user.role == UserRole.WORKER:
            from ..models import Worker

            worker = Worker(user_id=user.id, full_name=user.username)
            db.session.add(worker)
        elif user.role == UserRole.EMPLOYER:
            from ..models import Employer

            employer = Employer(user_id=user.id, company_name=user.username)
            db.session.add(employer)

        db.session.commit()

        return user, None

    @staticmethod
    def authenticate_user(email, password):
        """Authenticate a user."""
        user = User.query.filter_by(email=email).first()
        if not user or not user.check_password(password):
            return None, "Invalid email or password"

        if not user.is_active:
            return None, "Account is deactivated"

        return user, None

    @staticmethod
    def get_user_by_id(user_id):
        """Get user by ID."""
        return User.query.get(user_id)

    @staticmethod
    def update_user(user_id, data):
        """Update user profile."""
        user = User.query.get(user_id)
        if not user:
            return None, "User not found"

        # Check for duplicate username
        if "username" in data and data["username"] != user.username:
            existing = User.query.filter_by(username=data["username"]).first()
            if existing:
                return None, "Username already exists"

        # Check for duplicate email
        if "email" in data and data["email"] != user.email:
            existing = User.query.filter_by(email=data["email"]).first()
            if existing:
                return None, "Email already exists"

        for key, value in data.items():
            setattr(user, key, value)

        db.session.commit()
        return user, None

    @staticmethod
    def deactivate_user(user_id, admin_id):
        """Deactivate a user (admin only)."""
        admin = User.query.get(admin_id)
        if not admin or admin.role != UserRole.ADMIN:
            return None, "Admin access required"

        user = User.query.get(user_id)
        if not user:
            return None, "User not found"

        user.is_active = False
        db.session.commit()

        return user, None

    @staticmethod
    def activate_user(user_id, admin_id):
        """Activate a user (admin only)."""
        admin = User.query.get(admin_id)
        if not admin or admin.role != UserRole.ADMIN:
            return None, "Admin access required"

        user = User.query.get(user_id)
        if not user:
            return None, "User not found"

        user.is_active = True
        db.session.commit()

        return user, None
