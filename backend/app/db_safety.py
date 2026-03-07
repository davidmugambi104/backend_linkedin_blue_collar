from sqlalchemy import event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session


_listeners_registered = False


@event.listens_for(Engine, "connect")
def _enable_sqlite_foreign_keys(dbapi_connection, connection_record):
    module_name = dbapi_connection.__class__.__module__
    if "sqlite3" not in module_name:
        return

    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


def register_database_safety(app):
    global _listeners_registered
    if _listeners_registered:
        return

    soft_delete_enforced = app.config.get("DB_ENFORCE_SOFT_DELETE", True)
    allow_hard_delete = app.config.get("ALLOW_HARD_DELETE", False)
    protected_tables = set(app.config.get("PROTECTED_DELETE_TABLES") or set())
    fallback_status_by_table = {
        "jobs": "CANCELLED",
        "applications": "WITHDRAWN",
    }

    if not soft_delete_enforced:
        _listeners_registered = True
        return

    def _before_flush(session, flush_context, instances):
        for instance in list(session.deleted):
            table_name = getattr(instance, "__tablename__", None)
            if table_name == "audit_logs":
                raise ValueError("Audit logs are immutable and cannot be deleted.")

        for instance in list(session.dirty):
            table_name = getattr(instance, "__tablename__", None)
            if table_name == "audit_logs" and session.is_modified(instance, include_collections=False):
                raise ValueError("Audit logs are immutable and cannot be modified.")

        if allow_hard_delete:
            return

        for instance in list(session.deleted):
            table_name = getattr(instance, "__tablename__", None)
            if not table_name or table_name not in protected_tables:
                continue

            converted = False

            if hasattr(instance, "is_active"):
                setattr(instance, "is_active", False)
                converted = True
            elif hasattr(instance, "status") and table_name in fallback_status_by_table:
                current_status = getattr(instance, "status")
                target_status_name = fallback_status_by_table[table_name]
                status_enum_class = current_status.__class__ if current_status is not None else None
                if status_enum_class and hasattr(status_enum_class, target_status_name):
                    setattr(instance, "status", getattr(status_enum_class, target_status_name))
                    converted = True

            if converted:
                session.add(instance)
                continue

            raise ValueError(
                f"Hard delete is blocked for protected table '{table_name}'. "
                "Use a non-destructive update strategy."
            )

    event.listen(Session, "before_flush", _before_flush)
    _listeners_registered = True
