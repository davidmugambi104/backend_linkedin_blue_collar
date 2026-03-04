# ----- FILE: backend/app/schemas/user_schema.py -----
from marshmallow import Schema, fields, validate, ValidationError
from ..models.user import User, UserRole


class UserSchema(Schema):
    id = fields.Int(dump_only=True)
    username = fields.Str(required=True, validate=validate.Length(min=3, max=80))
    email = fields.Email(required=True)
    password = fields.Str(
        required=True, load_only=True, validate=validate.Length(min=6)
    )
    role = fields.Str(
        required=True, validate=validate.OneOf([role.value for role in UserRole])
    )
    phone = fields.Str(validate=validate.Length(min=10, max=20))
    is_phone_verified = fields.Bool(dump_only=True)
    is_active = fields.Bool(dump_only=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)


class UserLoginSchema(Schema):
    email = fields.Email(required=True)
    password = fields.Str(required=True, load_only=True)


class UserUpdateSchema(Schema):
    username = fields.Str(validate=validate.Length(min=3, max=80))
    email = fields.Email()
    phone = fields.Str(validate=validate.Length(min=10, max=20))
