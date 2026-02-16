# ----- FILE: backend/app/schemas/verification_schema.py -----
from marshmallow import Schema, fields, validate, validates, ValidationError
from ..models.verification import VerificationStatus


class VerificationSchema(Schema):
    id = fields.Int(dump_only=True)
    worker_id = fields.Int(required=True)
    verification_type = fields.Str(
        required=True, validate=validate.Length(min=2, max=100)
    )
    document_url = fields.Str(required=True, validate=validate.Length(min=1, max=500))
    status = fields.Str(dump_only=True)  # Only admin can update status
    reviewed_by = fields.Int(dump_only=True)
    review_notes = fields.Str(dump_only=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)

    @validates("worker_id")
    def validate_worker_id(self, value):
        from ..models import Worker

        if not Worker.query.get(value):
            raise ValidationError("Worker does not exist.")


class VerificationCreateSchema(VerificationSchema):
    pass  # Same as VerificationSchema


class VerificationUpdateSchema(Schema):
    status = fields.Str(
        required=True,
        validate=validate.OneOf([status.value for status in VerificationStatus]),
    )
    review_notes = fields.Str()
