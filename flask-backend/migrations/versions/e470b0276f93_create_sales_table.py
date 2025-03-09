"""create_sales_table

Revision ID: e470b0276f93
Revises: cf7b9a1a27db
Create Date: 2025-03-09 09:04:48.366893

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


# revision identifiers, used by Alembic.
revision = 'e470b0276f93'
down_revision = 'cf7b9a1a27db'
branch_labels = None
depends_on = None


def upgrade():
    # Create sales table with all necessary columns but no product_info_id
    op.create_table('sales',
                    sa.Column('uuid', UUID(as_uuid=True), nullable=False),
                    sa.Column('id', sa.Integer(), nullable=False),
                    sa.Column('name', sa.String(length=100), nullable=False),
                    sa.Column('sale_qty', sa.Integer(), nullable=False),
                    sa.Column('discount_amt', sa.Numeric(
                        precision=10, scale=2), nullable=False),
                    sa.Column('sale_amt', sa.Numeric(
                        precision=10, scale=2), nullable=False),
                    sa.Column('sku', sa.String(length=50), nullable=True),
                    sa.Column('item_no', sa.String(length=50), nullable=True),
                    sa.Column('description', sa.String(
                        length=255), nullable=True),
                    sa.Column('product_brand_id', UUID(
                        as_uuid=True), nullable=False),
                    sa.Column('product_group_id', UUID(
                        as_uuid=True), nullable=False),
                    sa.Column('product_division_id', UUID(
                        as_uuid=True), nullable=False),
                    sa.Column('product_category_id', UUID(
                        as_uuid=True), nullable=False),
                    sa.Column('created_at', sa.DateTime(), nullable=True),
                    sa.Column('updated_at', sa.DateTime(), nullable=True),
                    sa.ForeignKeyConstraint(['product_brand_id'], [
                        'product_brands.uuid'], ),
                    sa.ForeignKeyConstraint(['product_category_id'], [
                        'product_categories.uuid'], ),
                    sa.ForeignKeyConstraint(['product_division_id'], [
                        'product_divisions.uuid'], ),
                    sa.ForeignKeyConstraint(['product_group_id'], [
                        'product_groups.uuid'], ),
                    sa.PrimaryKeyConstraint('uuid'),
                    sa.UniqueConstraint('id')
                    )


def downgrade():
    op.drop_table('sales')
