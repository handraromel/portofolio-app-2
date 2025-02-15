from marshmallow import Schema, fields, validate


class CreateUserSchema(Schema):
    username = fields.Str(
        required=True, validate=validate.Length(min=3, max=80))
    email = fields.Email(required=True)
    first_name = fields.Str(
        required=True, validate=validate.Length(min=1, max=80))
    last_name = fields.Str(
        required=True, validate=validate.Length(min=1, max=80))
    password = fields.Str(
        required=True, validate=validate.Length(min=8, max=20))
    role = fields.Str(
        required=True, validate=validate.OneOf(['admin', 'user']))


class UpdateProfileSchema(Schema):
    username = fields.Str(
        required=True, validate=validate.Length(min=3, max=20))
    email = fields.Email(required=True)
    first_name = fields.Str(validate=validate.Length(max=20))
    last_name = fields.Str(validate=validate.Length(max=20))
    role = fields.Str(
        required=True,
        validate=validate.OneOf(['admin', 'user', 'superadmin'])
    )


class UpdatePasswordSchema(Schema):
    new_password = fields.Str(
        required=True, validate=validate.Length(min=8, max=20))


class UpdateRoleSchema(Schema):
    new_role = fields.Str(required=True)
