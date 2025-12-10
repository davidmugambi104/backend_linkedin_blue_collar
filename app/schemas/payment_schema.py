# ----- FILE: backend/app/schemas/payment_schema.py -----
from marshmallow import Schema, fields, validate, validates, ValidationError
from ..models import PaymentStatus

class PaymentSchema(Schema):
    id = fields.Int(dump_only=True)
    job_id = fields.Int(required=True)
    employer_id = fields.Int(dump_only=True)  # We get this from the job
    worker_id = fields.Int(dump_only=True)    # We get this from the job
    amount = fields.Float(required=True, validate=validate.Range(min=0.01))
    platform_fee = fields.Float(dump_only=True)  # Calculated by the system
    net_amount = fields.Float(dump_only=True)    # Calculated by the system
    status = fields.Str(dump_only=True)          # Cannot set status directly on create
    transaction_id = fields.Str()
    payment_method = fields.Str()
    paid_at = fields.DateTime(dump_only=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)

    @validates('job_id')
    def validate_job_id(self, value):
        from ..models import Job
        from ..models.job import JobStatus

        job = Job.query.get(value)
        if not job:
            raise ValidationError('Job does not exist.')
        # Check if the job is completed
        if job.status != JobStatus.COMPLETED:
            raise ValidationError('Payments can only be created for completed jobs.')

class PaymentCreateSchema(PaymentSchema):
    pass  # Same as PaymentSchema, but we might want to exclude some fields in the future

class PaymentUpdateSchema(Schema):
    status = fields.Str(validate=validate.OneOf([status.value for status in PaymentStatus]))
    transaction_id = fields.Str()
    payment_method = fields.Str()
    paid_at = fields.DateTime()
# ----- END FILE -----
