# ----- FILE: backend/app/schemas/review_schema.py -----
from marshmallow import Schema, fields, validate


class ReviewSchema(Schema):
    id = fields.Int(dump_only=True)
    job_id = fields.Int(required=True)
    worker_id = fields.Int(dump_only=True)
    employer_id = fields.Int(dump_only=True)
    rating = fields.Int(required=True, validate=validate.Range(min=1, max=5))
    comment = fields.Str()
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)


class ReviewCreateSchema(ReviewSchema):
    reviewee_id = fields.Int(required=True)
    reviewer_type = fields.Str(required=True, validate=validate.OneOf(["employer", "worker"]))
