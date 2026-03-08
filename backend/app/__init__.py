# ----- FILE: backend/app/__init__.py -----
from flask import Flask
from flask_cors import CORS
from flask_socketio import SocketIO
from flask_migrate import Migrate
import logging
from logging.handlers import RotatingFileHandler
import os
from sqlalchemy import text

from .config import config_by_name
from .extensions import db, jwt, migrate, socketio, limiter
from .routes import register_blueprints
from .db_safety import register_database_safety
from .security_middleware import register_security_middleware
from flasgger import Swagger


def _configure_limiter_storage_fallback(app):
    configured_uri = app.config.get("RATELIMIT_STORAGE_URI", "")
    if not isinstance(configured_uri, str) or not configured_uri.startswith("redis://"):
        return

    try:
        import redis
        client = redis.Redis.from_url(configured_uri, decode_responses=True)
        client.ping()
    except Exception as exc:
        app.config["RATELIMIT_STORAGE_URI"] = "memory://"
        app.logger.warning(
            "Rate limiter storage fallback enabled (memory://) because Redis is unavailable: %s",
            str(exc),
        )


def _ensure_sqlite_schema_compatibility(app):
    db_uri = str(app.config.get("SQLALCHEMY_DATABASE_URI") or "")
    if not db_uri.startswith("sqlite"):
        return

    try:
        with app.app_context():
            columns = db.session.execute(text("PRAGMA table_info(users)")).fetchall()
            column_names = {str(row[1]) for row in columns}
            if "admin_role" not in column_names:
                db.session.execute(
                    text("ALTER TABLE users ADD COLUMN admin_role VARCHAR(20) DEFAULT 'OPS_ADMIN'")
                )

            db.session.execute(
                text("UPDATE users SET admin_role='SUPER_ADMIN' WHERE admin_role='super_admin'")
            )
            db.session.execute(
                text("UPDATE users SET admin_role='OPS_ADMIN' WHERE admin_role='ops_admin'")
            )
            db.session.execute(
                text("UPDATE users SET admin_role='TRUST_SAFETY' WHERE admin_role='trust_safety'")
            )
            db.session.execute(
                text("UPDATE users SET admin_role='FINANCE' WHERE admin_role='finance'")
            )
            db.session.execute(
                text("UPDATE users SET admin_role='OPS_ADMIN' WHERE lower(role)='admin' AND (admin_role IS NULL OR admin_role='')")
            )
            db.session.commit()
            app.logger.warning("Applied SQLite schema compatibility fix for users.admin_role")
    except Exception as exc:
        app.logger.warning("SQLite schema compatibility check skipped/failed: %s", str(exc))


def create_app(config_name=None):
    app = Flask(__name__)  # FIXED: name → __name__
    app.url_map.strict_slashes = False

    # Load configuration
    if config_name is None:
        config_name = os.getenv("FLASK_ENV", "development")
    app.config.from_object(config_by_name[config_name])

    _configure_limiter_storage_fallback(app)

    # Initialize extensions
    db.init_app(app)
    _ensure_sqlite_schema_compatibility(app)
    register_database_safety(app)
    jwt.init_app(app)
    migrate.init_app(app, db)
    limiter.init_app(app)
    socketio.init_app(app, cors_allowed_origins=app.config["CORS_ORIGINS"])
    register_security_middleware(app)
    
    # Initialize Swagger
    swagger = Swagger(app, template={
        "info": {
            "title": "WorkForge API",
            "description": "WorkForge Workforce Platform API Documentation",
            "version": "1.0.0"
        },
        "securityDefinitions": {
            "Bearer": {
                "type": "apiKey",
                "name": "Authorization",
                "in": "header",
                "description": "JWT token. Example: Bearer <token>"
            }
        }
    })
    CORS(
        app,
        resources={
            r"/api/*": {
                "origins": app.config["CORS_ORIGINS"],
                "allow_headers": ["Content-Type", "Authorization"],
                "methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
            }
        },
        supports_credentials=True,
    )

    # Configure logging
    if not app.debug and not app.testing:
        if not os.path.exists("logs"):
            os.mkdir("logs")
        file_handler = RotatingFileHandler(
            "logs/app.log", maxBytes=10240, backupCount=10
        )
        file_handler.setFormatter(
            logging.Formatter(
                "%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]"
            )
        )
        file_handler.setLevel(logging.INFO)
        app.logger.addHandler(file_handler)
        app.logger.setLevel(logging.INFO)
        app.logger.info("Application startup")

    # Register blueprints
    register_blueprints(app)

    # Import and register socket events
    from .sockets import chat, notifications

    chat.register_socket_events()
    notifications.register_notification_handlers()

    # Shell context for flask cli
    @app.shell_context_processor
    def shell_context():
        return {
            "db": db,
            "User": models.user.User,
            "Worker": models.worker.Worker,
            "Employer": models.employer.Employer,
            "Job": models.job.Job,
            "Application": models.application.Application,
            "Review": models.review.Review,
            "Message": models.message.Message,
            "Skill": models.skill.Skill,
            "WorkerSkill": models.worker_skill.WorkerSkill,
            "Verification": models.verification.Verification,
            "Payment": models.payment.Payment,
        }

    return app  # FIXED: indentation


# This import is at the bottom to avoid circular imports
from . import models
