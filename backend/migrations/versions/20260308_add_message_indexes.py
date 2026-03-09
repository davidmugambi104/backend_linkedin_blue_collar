"""add message indexes

Revision ID: 20260308_add_message_indexes
Revises: bfcad48a09a7
Create Date: 2026-03-08
"""

from alembic import op
import sqlalchemy as sa


revision = "20260308_add_message_indexes"
down_revision = "bfcad48a09a7"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    dialect = bind.dialect.name

    op.create_index(
        "ix_messages_conversation_created",
        "messages",
        ["conversation_id", "created_at"],
        unique=False,
    )

    if dialect == "postgresql":
        op.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm")

        op.create_index(
            "ix_messages_unread",
            "messages",
            ["receiver_id", "is_read"],
            unique=False,
            postgresql_where=sa.text("is_read = false"),
        )

        op.create_index(
            "ix_messages_content_trgm",
            "messages",
            ["content"],
            unique=False,
            postgresql_using="gin",
            postgresql_ops={"content": "gin_trgm_ops"},
        )
    else:
        op.create_index(
            "ix_messages_unread",
            "messages",
            ["receiver_id", "is_read"],
            unique=False,
        )


def downgrade() -> None:
    bind = op.get_bind()
    dialect = bind.dialect.name

    if dialect == "postgresql":
        op.drop_index("ix_messages_content_trgm", table_name="messages")

    op.drop_index("ix_messages_unread", table_name="messages")
    op.drop_index("ix_messages_conversation_created", table_name="messages")
