"""create_product_tables

Revision ID: cf7b9a1a27db
Revises: af2110dbc8c4
Create Date: 2025-03-09 09:03:46.410455

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID
import uuid


# revision identifiers, used by Alembic.
revision = 'cf7b9a1a27db'
down_revision = 'af2110dbc8c4'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table('product_brands',
                    sa.Column('uuid', UUID(as_uuid=True), primary_key=True),
                    sa.Column('id', sa.Integer(), nullable=False),
                    sa.Column('name', sa.String(length=100), nullable=False),
                    sa.Column('created_at', sa.DateTime(), nullable=True),
                    sa.Column('updated_at', sa.DateTime(), nullable=True),
                    sa.PrimaryKeyConstraint('uuid'),
                    sa.UniqueConstraint('id')
                    )

    op.create_table('product_groups',
                    sa.Column('uuid', UUID(as_uuid=True), primary_key=True),
                    sa.Column('id', sa.Integer(), nullable=False),
                    sa.Column('name', sa.String(length=100), nullable=False),
                    sa.Column('created_at', sa.DateTime(), nullable=True),
                    sa.Column('updated_at', sa.DateTime(), nullable=True),
                    sa.PrimaryKeyConstraint('uuid'),
                    sa.UniqueConstraint('id')
                    )

    op.create_table('product_divisions',
                    sa.Column('uuid', UUID(as_uuid=True), primary_key=True),
                    sa.Column('name', sa.String(length=100), nullable=False),
                    sa.Column('alias', sa.String(length=100), nullable=True),
                    sa.Column('created_at', sa.DateTime(), nullable=True),
                    sa.Column('updated_at', sa.DateTime(), nullable=True),
                    sa.PrimaryKeyConstraint('uuid')
                    )

    op.create_table('product_categories',
                    sa.Column('uuid', UUID(as_uuid=True), primary_key=True),
                    sa.Column('name', sa.String(length=100), nullable=False),
                    sa.Column('created_at', sa.DateTime(), nullable=True),
                    sa.Column('updated_at', sa.DateTime(), nullable=True),
                    sa.PrimaryKeyConstraint('uuid')
                    )


def downgrade():
    op.drop_table('product_categories')
    op.drop_table('product_divisions')
    op.drop_table('product_groups')
    op.drop_table('product_brands')
