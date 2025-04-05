from marshmallow import Schema, fields, validate, validates, ValidationError
from datetime import date


class SaleSchema(Schema):
    sale_qty = fields.Integer(required=True, validate=validate.Range(min=0))
    discounted_amt = fields.Decimal(
        required=True, places=2, validate=validate.Range(min=0))
    sale_amt = fields.Decimal(required=True, places=2,
                              validate=validate.Range(min=0))
    sku = fields.String(required=False, allow_none=True,
                        validate=validate.Length(max=50))
    item_no = fields.String(required=False, allow_none=True,
                            validate=validate.Length(max=50))
    input_date = fields.Date(required=True)
    description = fields.String(
        required=False, allow_none=True, validate=validate.Length(max=255))

    # Required relationships
    product_brand_id = fields.UUID(required=True)
    product_group_id = fields.UUID(required=True)
    product_division_id = fields.UUID(required=True)
    product_category_id = fields.UUID(required=True)

    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)

    # Computed fields (only for serialization)
    gross_sales = fields.Decimal(dump_only=True)
    nett_sales = fields.Decimal(dump_only=True)
    nett_sales_after_tax = fields.Decimal(dump_only=True)
    tax_amount = fields.Decimal(dump_only=True)
    tax_rate = fields.Decimal(dump_only=True)

    # Relationship objects for responses
    brand = fields.Nested("ProductBrandSchema", dump_only=True)
    group = fields.Nested("ProductGroupSchema", dump_only=True)
    division = fields.Nested("ProductDivisionSchema", dump_only=True)
    category = fields.Nested("ProductCategorySchema", dump_only=True)

    @validates('input_date')
    def validate_input_date(self, input_date):
        # You can add custom date validation logic here
        # For example, prevent future dates or limit how far back dates can go
        if input_date > date.today():
            raise ValidationError("Input date cannot be in the future")
