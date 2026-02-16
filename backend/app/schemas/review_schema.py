# ----- FILE: backend/app/schemas/review_schema.py -----
from marshmallow import Schema, fields, validate, validates, ValidationError


class ReviewSchema(Schema):
    id = fields.Int(dump_only=True)
    job_id = fields.Int(required=True)
    worker_id = fields.Int(dump_only=True)  # We get this from the job
    employer_id = fields.Int(dump_only=True)  # We get this from the job
    rating = fields.Int(required=True, validate=validate.Range(min=1, max=5))
    comment = fields.Str()
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)

    @validates("job_id")
    def validate_job_id(self, value):
        from ..models import Job
        from ..models.job import JobStatus

        job = Job.query.get(value)
        if not job:
            raise ValidationError("Job does not exist.")
        # Check if the job is completed
        if job.status != JobStatus.COMPLETED:
            raise ValidationError("Reviews can only be submitted for completed jobs.")


class ReviewCreateSchema(ReviewSchema):
    pass  # Same as ReviewSchema


# ----- END FILE -----
