# ----- FILE: backend/app/schemas/message_schema.py -----
from marshmallow import Schema, fields, validate, validates, ValidationError
from ..models import User


class MessageSchema(Schema):
    id = fields.Int(dump_only=True)
    conversation_id = fields.Str(dump_only=True)
    sender_id = fields.Int(dump_only=True)
    receiver_id = fields.Int(required=True)
    content = fields.Str(required=True, validate=validate.Length(min=1, max=5000))
    is_read = fields.Bool(dump_only=True)
    created_at = fields.DateTime(dump_only=True)

    @validates("receiver_id")
    def validate_receiver_id(self, value):
        if not User.query.get(value):
            raise ValidationError("Receiver does not exist.")


class MessageCreateSchema(MessageSchema):
    pass  # Same as MessageSchema, but we might want to exclude some fields in the future


# ----- END FILE -----
