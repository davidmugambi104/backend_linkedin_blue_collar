# ----- FILE: backend/app/config.py -----
import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY") or "dev-secret-key-change-in-production"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        "pool_recycle": int(os.environ.get("DB_POOL_RECYCLE_SECONDS", "1800")),
    }
    DB_ENFORCE_SOFT_DELETE = os.environ.get("DB_ENFORCE_SOFT_DELETE", "true").lower() == "true"
    ALLOW_HARD_DELETE = os.environ.get("ALLOW_HARD_DELETE", "false").lower() == "true"
    ALLOW_DESTRUCTIVE_OPERATIONS = os.environ.get("ALLOW_DESTRUCTIVE_OPERATIONS", "false").lower() == "true"
    REQUIRE_ADMIN_CONFIRMATION = os.environ.get("REQUIRE_ADMIN_CONFIRMATION", "true").lower() == "true"
    ADMIN_ACTION_CONFIRMATION_TOKEN = os.environ.get("ADMIN_ACTION_CONFIRMATION_TOKEN")
    TWO_PERSON_APPROVAL_ENABLED = os.environ.get("TWO_PERSON_APPROVAL_ENABLED", "true").lower() == "true"
    ADMIN_APPROVAL_TTL_SECONDS = int(os.environ.get("ADMIN_APPROVAL_TTL_SECONDS", "1800"))
    ADMIN_APPROVAL_POLICY_OVERRIDES = os.environ.get("ADMIN_APPROVAL_POLICY_OVERRIDES", "")
    ADMIN_APPROVAL_PERMISSION_OVERRIDES = os.environ.get("ADMIN_APPROVAL_PERMISSION_OVERRIDES", "")
    ADMIN_APPROVAL_RATE_LIMIT = os.environ.get("ADMIN_APPROVAL_RATE_LIMIT", "30 per minute")
    ADMIN_APPROVAL_REVIEW_RATE_LIMIT = os.environ.get("ADMIN_APPROVAL_REVIEW_RATE_LIMIT", "20 per minute")
    SECURITY_EVENTS_RATE_LIMIT = os.environ.get("SECURITY_EVENTS_RATE_LIMIT", "60 per minute")
    SECURITY_EVENTS_MAX_SINCE_HOURS = int(os.environ.get("SECURITY_EVENTS_MAX_SINCE_HOURS", "720"))
    SECURITY_EVENTS_CURSOR_TTL_SECONDS = int(os.environ.get("SECURITY_EVENTS_CURSOR_TTL_SECONDS", str(60 * 60 * 24)))
    DB_BACKUP_RATE_LIMIT = os.environ.get("DB_BACKUP_RATE_LIMIT", "5 per hour")
    DB_BACKUP_VERIFY_RATE_LIMIT = os.environ.get("DB_BACKUP_VERIFY_RATE_LIMIT", "30 per minute")
    DB_BACKUP_CATALOG_RATE_LIMIT = os.environ.get("DB_BACKUP_CATALOG_RATE_LIMIT", "60 per minute")
    ADMIN_IDEMPOTENCY_ENABLED = os.environ.get("ADMIN_IDEMPOTENCY_ENABLED", "true").lower() == "true"
    ADMIN_IDEMPOTENCY_TTL_SECONDS = int(os.environ.get("ADMIN_IDEMPOTENCY_TTL_SECONDS", "3600"))
    AUDIT_LOG_MAX_EXPORT_ROWS = int(os.environ.get("AUDIT_LOG_MAX_EXPORT_ROWS", "5000"))
    AUDIT_LOG_MAX_PAGE_SIZE = int(os.environ.get("AUDIT_LOG_MAX_PAGE_SIZE", "200"))
    AUDIT_EXPORT_SIGNING_KEY = os.environ.get("AUDIT_EXPORT_SIGNING_KEY")
    MAX_CONTENT_LENGTH = int(os.environ.get("MAX_CONTENT_LENGTH", str(2 * 1024 * 1024)))
    RATELIMIT_STORAGE_URI = (
        os.environ.get("RATELIMIT_STORAGE_URI")
        or os.environ.get("SOCKETIO_MESSAGE_QUEUE")
        or "redis://localhost:6379/1"
    )
    RATELIMIT_HEADERS_ENABLED = True
    PROTECTED_DELETE_TABLES = {
        table.strip()
        for table in os.environ.get(
            "PROTECTED_DELETE_TABLES",
            "users,jobs,applications,reviews,skills,workers,employers,payments,messages,document_verifications,verification_codes",
        ).split(",")
        if table.strip()
    }
    JWT_SECRET_KEY = (
        os.environ.get("JWT_SECRET_KEY") or "jwt-secret-key-change-in-production"
    )
    JWT_ACCESS_TOKEN_EXPIRES = 3600  # 1 hour
    JWT_REFRESH_TOKEN_EXPIRES = 86400  # 24 hours
    JWT_TOKEN_LOCATION = ["headers"]
    JWT_HEADER_NAME = "Authorization"
    JWT_HEADER_TYPE = "Bearer"
    JWT_BLACKLIST_ENABLED = True
    JWT_BLACKLIST_TOKEN_CHECKS = ["access", "refresh"]
    CORS_ORIGINS = os.environ.get(
        "CORS_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173"
    ).split(",")
    SOCKETIO_MESSAGE_QUEUE = os.environ.get(
        "SOCKETIO_MESSAGE_QUEUE", "redis://localhost:6379/0"
    )
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
    }

    DB_PROTECT_MODE = os.environ.get("DB_PROTECT_MODE", "true").lower() == "true"
    ALLOW_DESTRUCTIVE_OPERATIONS = (
        os.environ.get("ALLOW_DESTRUCTIVE_OPERATIONS", "false").lower() == "true"
    )
    DB_BACKUP_DIR = os.environ.get("DB_BACKUP_DIR", "instance/backups")


class DevelopmentConfig(Config):
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = os.environ.get("DEV_DATABASE_URL") or "sqlite:///dev.db"


class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = os.environ.get("TEST_DATABASE_URL") or "sqlite:///test.db"


class ProductionConfig(Config):
    DEBUG = False
    
    def __init__(self):
        self.SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL")
        if not self.SQLALCHEMY_DATABASE_URI:
            raise ValueError("DATABASE_URL environment variable is required for production")
        super().__init__()


config_by_name = {
    "development": DevelopmentConfig,
    "testing": TestingConfig,
    "production": ProductionConfig,
    "default": DevelopmentConfig,
}
# ----- END FILE -----
