# ----- FILE: backend/app/schemas/employer_schema.py -----
from marshmallow import Schema, fields, validate


class EmployerSchema(Schema):
    id = fields.Int(dump_only=True)
    user_id = fields.Int(dump_only=True)
    company_name = fields.Str(required=True, validate=validate.Length(min=2, max=200))
    description = fields.Str()
    location_lat = fields.Float()
    location_lng = fields.Float()
    address = fields.Str()
    phone = fields.Str(validate=validate.Length(min=10, max=20))
    website = fields.Str(validate=validate.URL())
    logo = fields.Str()
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)


class EmployerUpdateSchema(Schema):
    company_name = fields.Str(validate=validate.Length(min=2, max=200))
    description = fields.Str()
    location_lat = fields.Float()
    location_lng = fields.Float()
    address = fields.Str()
    phone = fields.Str(validate=validate.Length(min=10, max=20))
    website = fields.Str(validate=validate.URL())
    logo = fields.Str()


# ----- END FILE -----
