from marshmallow import Schema, fields, validate


class RegisterSchema(Schema):
    username = fields.Str(
        required=True, validate=validate.Length(min=3, max=20))
    email = fields.Email(required=True)
    first_name = fields.Str(
        required=True, validate=validate.Length(min=1, max=50))
    last_name = fields.Str(
        required=True, validate=validate.Length(min=1, max=50))
    password = fields.Str(
        required=True, validate=validate.Length(min=8, max=20))


class LoginSchema(Schema):
    username = fields.Str(
        required=True, validate=validate.Length(min=3, max=20))
    password = fields.Str(
        required=True, validate=validate.Length(min=8, max=20))


class ForgotPasswordSchema(Schema):
    email = fields.Email(required=True)
