from app import db
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid


class ProductBrand(db.Model):
    __tablename__ = "product_brands"

    uuid = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    id = db.Column(db.Integer, unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=func.now())
    updated_at = db.Column(
        db.DateTime, default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<ProductBrand {self.name}>"


class ProductGroup(db.Model):
    __tablename__ = "product_groups"

    uuid = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    id = db.Column(db.Integer, unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=func.now())
    updated_at = db.Column(
        db.DateTime, default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<ProductGroup {self.name}>"


class ProductDivision(db.Model):
    __tablename__ = "product_divisions"

    uuid = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = db.Column(db.String(100), nullable=False)
    alias = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=func.now())
    updated_at = db.Column(
        db.DateTime, default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<ProductDivision {self.name}>"


class ProductCategory(db.Model):
    __tablename__ = "product_categories"

    uuid = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=func.now())
    updated_at = db.Column(
        db.DateTime, default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<ProductCategory {self.name}>"
