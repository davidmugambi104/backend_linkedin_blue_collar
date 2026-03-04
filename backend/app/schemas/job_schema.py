# ----- FILE: backend/app/schemas/job_schema.py -----
from marshmallow import Schema, fields, validate, ValidationError
from datetime import datetime
from ..models.job import JobStatus


class JobSchema(Schema):
    id = fields.Int(dump_only=True)
    employer_id = fields.Int(dump_only=True)
    title = fields.Str(required=True, validate=validate.Length(min=3, max=200))
    description = fields.Str(required=True)
    required_skill_id = fields.Int(required=True)
    location_lat = fields.Float()
    location_lng = fields.Float()
    address = fields.Str()
    pay_min = fields.Float(validate=validate.Range(min=0))
    pay_max = fields.Float(validate=validate.Range(min=0))
    pay_type = fields.Str(validate=validate.OneOf(["hourly", "daily", "fixed"]))
    status = fields.Str(dump_only=True)
    expiration_date = fields.DateTime()
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)


class JobCreateSchema(JobSchema):
    pass


class JobUpdateSchema(Schema):
    title = fields.Str(validate=validate.Length(min=3, max=200))
    description = fields.Str()
    required_skill_id = fields.Int()
    location_lat = fields.Float()
    location_lng = fields.Float()
    address = fields.Str()
    pay_min = fields.Float(validate=validate.Range(min=0))
    pay_max = fields.Float(validate=validate.Range(min=0))
    pay_type = fields.Str(validate=validate.OneOf(["hourly", "daily", "fixed"]))
    status = fields.Str(validate=validate.OneOf([status.value for status in JobStatus]))
    expiration_date = fields.DateTime()


class JobSearchSchema(Schema):
    title = fields.Str()
    skill_id = fields.Int()
    location_lat = fields.Float()
    location_lng = fields.Float()
    radius_km = fields.Float(validate=validate.Range(min=0))
    pay_min = fields.Float(validate=validate.Range(min=0))
    pay_max = fields.Float(validate=validate.Range(min=0))
    status = fields.Str(validate=validate.OneOf([status.value for status in JobStatus]))
    employer_id = fields.Int()


# ----- END FILE -----
