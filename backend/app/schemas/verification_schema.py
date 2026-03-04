# ----- FILE: backend/app/schemas/verification_schema.py -----
from marshmallow import Schema, fields, validate


class VerificationSchema(Schema):
    id = fields.Int(dump_only=True)
    worker_id = fields.Int(required=True)
    verification_type = fields.Str(
        required=True, validate=validate.Length(min=2, max=100)
    )
    document_url = fields.Str(required=True, validate=validate.Length(min=1, max=500))
    status = fields.Str(dump_only=True)
    reviewed_by = fields.Int(dump_only=True)
    review_notes = fields.Str(dump_only=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)


class VerificationCreateSchema(VerificationSchema):
    pass


class VerificationUpdateSchema(Schema):
    status = fields.Str(
        required=True,
        validate=validate.OneOf(["pending", "approved", "rejected"]),
    )
    review_notes = fields.Str()
