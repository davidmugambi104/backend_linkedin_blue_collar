# ----- FILE: backend/app/schemas/worker_schema.py -----
from marshmallow import Schema, fields, validate


class WorkerSchema(Schema):
    id = fields.Int(dump_only=True)
    user_id = fields.Int(dump_only=True)
    full_name = fields.Str(required=True, validate=validate.Length(min=2, max=200))
    bio = fields.Str()
    location_lat = fields.Float()
    location_lng = fields.Float()
    address = fields.Str()
    phone = fields.Str(validate=validate.Length(min=10, max=20))
    profile_picture = fields.Str()
    hourly_rate = fields.Float()
    is_verified = fields.Bool(dump_only=True)
    verification_score = fields.Int(dump_only=True)
    average_rating = fields.Float(dump_only=True)
    total_ratings = fields.Int(dump_only=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)


class WorkerUpdateSchema(Schema):
    full_name = fields.Str(validate=validate.Length(min=2, max=200))
    bio = fields.Str()
    location_lat = fields.Float()
    location_lng = fields.Float()
    address = fields.Str()
    phone = fields.Str(validate=validate.Length(min=10, max=20))
    profile_picture = fields.Str()
    hourly_rate = fields.Float()


class WorkerSkillSchema(Schema):
    id = fields.Int(dump_only=True)
    worker_id = fields.Int(dump_only=True)
    skill_id = fields.Int(required=True)
    proficiency_level = fields.Int(validate=validate.Range(min=1, max=5))
