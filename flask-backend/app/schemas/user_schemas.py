from marshmallow import Schema, fields, validate


class UpdateProfileSchema(Schema):
    username = fields.Str(
        required=True, validate=validate.Length(min=3, max=20))
    email = fields.Email(required=True)
    first_name = fields.Str(validate=validate.Length(max=20))
    last_name = fields.Str(validate=validate.Length(max=20))


class UpdatePasswordSchema(Schema):
    new_password = fields.Str(
        required=True, validate=validate.Length(min=8, max=20))


class UpdateRoleSchema(Schema):
    new_role = fields.Str(required=True)
