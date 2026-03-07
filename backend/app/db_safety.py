from sqlalchemy import event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session
from datetime import datetime
import hashlib
import hmac
import json


_listeners_registered = False


def strip_audit_integrity(new_values):
    if not isinstance(new_values, dict):
        return new_values
    return {k: v for k, v in new_values.items() if k != "_integrity"}


def compute_audit_integrity_hash(
    signing_key,
    *,
    audit_id,
    user_id,
    action,
    entity_type,
    entity_id,
    timestamp,
    old_values,
    new_values,
    prev_hash,
):
    payload = {
        "id": int(audit_id) if audit_id is not None else None,
        "user_id": int(user_id) if user_id is not None else None,
        "action": action,
        "entity_type": entity_type,
        "entity_id": int(entity_id) if entity_id is not None else None,
        "timestamp": timestamp.isoformat() if isinstance(timestamp, datetime) else str(timestamp),
        "old_values": old_values,
        "new_values": strip_audit_integrity(new_values),
        "prev_hash": prev_hash,
    }
    canonical = json.dumps(payload, sort_keys=True, separators=(",", ":"), default=str)
    return hmac.new(
        str(signing_key).encode("utf-8"),
        canonical.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()


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
    audit_signing_key = (
        app.config.get("AUDIT_EXPORT_SIGNING_KEY")
        or app.config.get("SECRET_KEY")
        or "change-me"
    )

    if not soft_delete_enforced:
        _listeners_registered = True
        return

    def _before_flush(session, flush_context, instances):
        from .models.login_log import AuditLog

        for instance in list(session.deleted):
            table_name = getattr(instance, "__tablename__", None)
            if table_name == "audit_logs":
                raise ValueError("Audit logs are immutable and cannot be deleted.")

        for instance in list(session.dirty):
            table_name = getattr(instance, "__tablename__", None)
            if table_name == "audit_logs" and session.is_modified(instance, include_collections=False):
                raise ValueError("Audit logs are immutable and cannot be modified.")

        new_audits = [
            instance
            for instance in list(session.new)
            if getattr(instance, "__tablename__", None) == "audit_logs"
        ]
        if new_audits:
            with session.no_autoflush:
                last_audit = session.query(AuditLog).order_by(AuditLog.timestamp.desc(), AuditLog.id.desc()).first()

            prev_hash = None
            if last_audit and isinstance(last_audit.new_values, dict):
                prev_hash = (last_audit.new_values.get("_integrity") or {}).get("hash")

            assigned_ids = set()
            ordered_audits = sorted(
                new_audits,
                key=lambda item: (
                    item.timestamp or datetime.utcnow(),
                    int(item.id) if getattr(item, "id", None) is not None else 0,
                ),
            )
            for audit in ordered_audits:
                if audit.timestamp is None:
                    audit.timestamp = datetime.utcnow()

                if audit.id is None:
                    candidate_id = int(datetime.utcnow().timestamp() * 1000000)
                    while candidate_id in assigned_ids:
                        candidate_id += 1
                    audit.id = candidate_id
                assigned_ids.add(int(audit.id))

                next_hash = compute_audit_integrity_hash(
                    audit_signing_key,
                    audit_id=audit.id,
                    user_id=audit.user_id,
                    action=audit.action,
                    entity_type=audit.entity_type,
                    entity_id=audit.entity_id,
                    timestamp=audit.timestamp,
                    old_values=audit.old_values,
                    new_values=audit.new_values,
                    prev_hash=prev_hash,
                )

                base_new_values = audit.new_values if isinstance(audit.new_values, dict) else {"_raw": audit.new_values}
                base_new_values = strip_audit_integrity(base_new_values)
                base_new_values["_integrity"] = {
                    "v": 1,
                    "algo": "hmac-sha256",
                    "prev_hash": prev_hash,
                    "hash": next_hash,
                    "stamped_at": datetime.utcnow().isoformat(),
                }
                audit.new_values = base_new_values
                prev_hash = next_hash

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
