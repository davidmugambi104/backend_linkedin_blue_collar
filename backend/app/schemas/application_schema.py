# ----- FILE: backend/app/schemas/application_schema.py -----
from marshmallow import Schema, fields, validate, validates, ValidationError
from ..models.application import ApplicationStatus


class ApplicationSchema(Schema):
    id = fields.Int(dump_only=True)
    job_id = fields.Int(required=True)
    worker_id = fields.Int(dump_only=True)
    status = fields.Str(dump_only=True)  # Cannot set status directly on create
    cover_letter = fields.Str()
    proposed_rate = fields.Float(validate=validate.Range(min=0))
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)

    @validates("job_id")
    def validate_job_id(self, value):
        from ..models import Job

        if not Job.query.get(value):
            raise ValidationError("Job does not exist.")


class ApplicationCreateSchema(ApplicationSchema):
    pass  # Same as ApplicationSchema, but we might want to exclude some fields in the future


class ApplicationUpdateSchema(Schema):
    status = fields.Str(
        validate=validate.OneOf([status.value for status in ApplicationStatus])
    )
    cover_letter = fields.Str()
    proposed_rate = fields.Float(validate=validate.Range(min=0))


# ----- END FILE -----
