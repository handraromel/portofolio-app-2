from marshmallow import Schema, fields, validate


class ProductBrandSchema(Schema):
    id = fields.Integer(required=True)
    name = fields.Str(required=True, validate=validate.Length(min=1, max=100))


class ProductGroupSchema(Schema):
    id = fields.Integer(required=True)
    name = fields.Str(required=True, validate=validate.Length(min=1, max=100))


class ProductDivisionSchema(Schema):
    name = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    alias = fields.Str(validate=validate.Length(max=100), allow_none=True)


class ProductCategorySchema(Schema):
    name = fields.Str(required=True, validate=validate.Length(min=1, max=100))
