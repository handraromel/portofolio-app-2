from marshmallow import Schema, fields, validate


class RegisterSchema(Schema):
    username = fields.Str(
        required=True, validate=validate.Length(min=3, max=20))
    email = fields.Email(required=True)
    password = fields.Str(
        required=True, validate=validate.Length(min=8, max=20))
    first_name = fields.Str(validate=validate.Length(max=20))
    last_name = fields.Str(validate=validate.Length(max=20))


class LoginSchema(Schema):
    username = fields.Str(
        required=True, validate=validate.Length(min=3, max=20))
    password = fields.Str(
        required=True, validate=validate.Length(min=8, max=20))


class ForgotPasswordSchema(Schema):
    email = fields.Email(required=True)
