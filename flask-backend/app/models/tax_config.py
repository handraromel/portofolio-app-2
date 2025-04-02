from app import db
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid


class TaxConfiguration(db.Model):
    __tablename__ = "tax_configurations"

    uuid = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = db.Column(db.String(100), nullable=False)
    tax_rate = db.Column(db.Numeric(5, 2), nullable=False)
    effective_from = db.Column(db.Date, nullable=False)
    effective_until = db.Column(db.Date, nullable=True)
    description = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=func.now())
    updated_at = db.Column(
        db.DateTime, default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<TaxConfiguration {self.name}: {self.tax_rate}%>"
