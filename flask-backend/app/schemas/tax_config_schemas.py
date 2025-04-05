from marshmallow import Schema, fields, validate, validates, ValidationError
from datetime import date


class TaxConfigurationSchema(Schema):
    name = fields.String(
        required=True, validate=validate.Length(min=2, max=100))
    tax_rate = fields.Decimal(required=True, places=2,
                              validate=validate.Range(min=0, max=100))
    effective_from = fields.Date(required=True)
    effective_until = fields.Date(required=False, allow_none=True)
    description = fields.String(
        required=False, allow_none=True, validate=validate.Length(max=255))
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)

    @validates('effective_until')
    def validate_effective_until(self, effective_until):
        if effective_until and self.context.get('effective_from'):
            if effective_until < self.context.get('effective_from'):
                raise ValidationError(
                    "Effective until date must be after effective from date")

        # Check if effective_until is in the past when creating a new record
        if effective_until and effective_until < date.today() and not self.context.get('is_update', False):
            raise ValidationError(
                "Effective until date cannot be in the past for new tax configurations")
