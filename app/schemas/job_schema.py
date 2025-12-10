# ----- FILE: backend/app/schemas/job_schema.py -----
from marshmallow import Schema, fields, validate, validates, ValidationError
from datetime import datetime
from ..models import JobStatus

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
    pay_type = fields.Str(validate=validate.OneOf(['hourly', 'daily', 'fixed']))
    status = fields.Str(dump_only=True)  # We don't allow setting status via schema
    expiration_date = fields.DateTime()
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)

    @validates('required_skill_id')
    def validate_required_skill_id(self, value):
        from ..models import Skill
        if not Skill.query.get(value):
            raise ValidationError('Skill does not exist.')

    @validates('expiration_date')
    def validate_expiration_date(self, value):
        if value and value <= datetime.utcnow():
            raise ValidationError('Expiration date must be in the future.')

    @validates('pay_max')
    def validate_pay_range(self, value, data):
        if 'pay_min' in data and value is not None and data['pay_min'] is not None and value < data['pay_min']:
            raise ValidationError('Maximum pay must be greater than or equal to minimum pay.')

class JobCreateSchema(JobSchema):
    pass  # Same as JobSchema, but we might want to exclude some fields in the future

class JobUpdateSchema(Schema):
    title = fields.Str(validate=validate.Length(min=3, max=200))
    description = fields.Str()
    required_skill_id = fields.Int()
    location_lat = fields.Float()
    location_lng = fields.Float()
    address = fields.Str()
    pay_min = fields.Float(validate=validate.Range(min=0))
    pay_max = fields.Float(validate=validate.Range(min=0))
    pay_type = fields.Str(validate=validate.OneOf(['hourly', 'daily', 'fixed']))
    status = fields.Str(validate=validate.OneOf([status.value for status in JobStatus]))
    expiration_date = fields.DateTime()

    @validates('required_skill_id')
    def validate_required_skill_id(self, value):
        from ..models import Skill
        if not Skill.query.get(value):
            raise ValidationError('Skill does not exist.')

    @validates('expiration_date')
    def validate_expiration_date(self, value):
        if value and value <= datetime.utcnow():
            raise ValidationError('Expiration date must be in the future.')

    @validates('pay_max')
    def validate_pay_range(self, value, data):
        if 'pay_min' in data and value is not None and data['pay_min'] is not None and value < data['pay_min']:
            raise ValidationError('Maximum pay must be greater than or equal to minimum pay.')

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
