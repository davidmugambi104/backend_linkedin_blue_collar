# ----- FILE: backend/app/schemas/skill_schema.py -----
from marshmallow import Schema, fields, validate


class SkillSchema(Schema):
    id = fields.Int(dump_only=True)
    name = fields.Str(required=True, validate=validate.Length(min=2, max=100))
    category = fields.Str(required=True, validate=validate.Length(min=2, max=100))
