# ----- FILE: backend/app/schemas/user_schema.py -----
from marshmallow import Schema, fields, validate, validates, ValidationError
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
    is_active = fields.Bool(dump_only=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)

    @validates("username")
    def validate_username(self, value, **kwargs):
        if User.query.filter_by(username=value).first():
            raise ValidationError("Username already exists.")

    @validates("email")
    def validate_email(self, value, **kwargs):
        if User.query.filter_by(email=value).first():
            raise ValidationError("Email already exists.")


class UserLoginSchema(Schema):
    email = fields.Email(required=True)
    password = fields.Str(required=True, load_only=True)


class UserUpdateSchema(Schema):
    username = fields.Str(validate=validate.Length(min=3, max=80))
    email = fields.Email()

    @validates("username")
    def validate_username(self, value, **kwargs):
        # Check if the new username is already taken by another user
        user = self.context.get("user")
        if (
            user
            and User.query.filter(User.id != user.id, User.username == value).first()
        ):
            raise ValidationError("Username already exists.")

    @validates("email")
    def validate_email(self, value, **kwargs):
        user = self.context.get("user")
        if user and User.query.filter(User.id != user.id, User.email == value).first():
            raise ValidationError("Email already exists.")
