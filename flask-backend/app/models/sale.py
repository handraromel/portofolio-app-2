from app import db
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid


class Sale(db.Model):
    __tablename__ = "sales"

    uuid = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sale_qty = db.Column(db.Integer, nullable=False, default=0)
    discounted_amt = db.Column(db.Numeric(12, 2), nullable=False, default=0.00)
    sale_amt = db.Column(db.Numeric(12, 2), nullable=False, default=0.00)
    sku = db.Column(db.String(50), nullable=True)
    item_no = db.Column(db.String(50), nullable=True)
    input_date = db.Column(db.Date, nullable=False)
    description = db.Column(db.String(255), nullable=True)

    # Foreign Keys
    product_brand_id = db.Column(UUID(as_uuid=True), db.ForeignKey(
        "product_brands.uuid"), nullable=False)
    product_group_id = db.Column(UUID(as_uuid=True), db.ForeignKey(
        "product_groups.uuid"), nullable=False)
    product_division_id = db.Column(UUID(as_uuid=True), db.ForeignKey(
        "product_divisions.uuid"), nullable=False)
    product_category_id = db.Column(UUID(as_uuid=True), db.ForeignKey(
        "product_categories.uuid"), nullable=False)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey(
        "users.id"), nullable=True)

    created_at = db.Column(db.DateTime, default=func.now())
    updated_at = db.Column(
        db.DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    brand = db.relationship(
        "ProductBrand", backref=db.backref("sales", lazy=True))
    group = db.relationship(
        "ProductGroup", backref=db.backref("sales", lazy=True))
    division = db.relationship(
        "ProductDivision", backref=db.backref("sales", lazy=True))
    category = db.relationship(
        "ProductCategory", backref=db.backref("sales", lazy=True))
    user = db.relationship("User", backref=db.backref("sales", lazy=True))

    def __repr__(self):
        return f"<Sale {self.uuid} - {self.sku}>"
