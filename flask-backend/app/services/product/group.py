import logging
from app import db
from app.models.product import ProductGroup
from sqlalchemy import or_, and_
from datetime import datetime

logger = logging.getLogger('app.services.product.group')


class ProductGroupService:
    @staticmethod
    def get_all(page=1, per_page=10, search=None, start_date=None, end_date=None):
        """
        Retrieve all product groups with filtering and pagination
        """
        query = ProductGroup.query

        if search:
            query = query.filter(or_(
                ProductGroup.name.ilike(f'%{search}%'),
                ProductGroup.id.cast(db.String).ilike(f'%{search}%')
            ))
            logger.debug(
                f"Filtering product groups with search term: {search}")

        if start_date and end_date:
            start = datetime.strptime(start_date, '%Y-%m-%d')
            end = datetime.strptime(end_date, '%Y-%m-%d')
            query = query.filter(and_(
                ProductGroup.created_at >= start,
                ProductGroup.created_at <= end
            ))
            logger.debug(
                f"Filtering product groups by date range: {start_date} to {end_date}")

        groups = query.order_by(ProductGroup.id).paginate(
            page=page, per_page=per_page)

        return {
            'items': groups.items,
            'total': groups.total,
            'pages': groups.pages,
            'current_page': groups.page
        }

    @staticmethod
    def get_by_id(group_id):
        """
        Retrieve a product group by UUID
        """
        return ProductGroup.query.get(group_id)

    @staticmethod
    def create(group_data):
        """
        Create a new product group
        """
        # Check if group ID already exists
        if ProductGroup.query.filter(ProductGroup.id == group_data['id']).first():
            logger.warning(
                f"Creation failed - product group ID already exists: {group_data['id']}")
            return None, "Product group ID already exists"

        # Check if group name already exists
        if ProductGroup.query.filter(ProductGroup.name == group_data['name']).first():
            logger.warning(
                f"Creation failed - product group name already exists: {group_data['name']}")
            return None, "Product group name already exists"

        try:
            new_group = ProductGroup(
                id=group_data['id'],
                name=group_data['name']
            )

            db.session.add(new_group)
            db.session.commit()

            logger.info(
                f"Product group created successfully: ID {new_group.id}")
            return new_group, None
        except Exception as e:
            db.session.rollback()
            logger.exception(f"Error creating product group: {str(e)}")
            return None, "An error occurred while creating product group"

    @staticmethod
    def update(group_id, group_data):
        """
        Update an existing product group
        """
        group = ProductGroup.query.get(group_id)

        if not group:
            logger.warning(
                f"Update failed - product group not found: {group_id}")
            return None, "Product group not found"

        # Check if updated name already exists (if changed)
        if 'name' in group_data and group_data['name'] != group.name:
            if ProductGroup.query.filter(ProductGroup.name == group_data['name']).first():
                logger.warning(
                    f"Update failed - product group name already exists: {group_data['name']}")
                return None, "Product group name already exists"

        try:
            group.name = group_data.get('name', group.name)
            db.session.commit()

            logger.info(f"Product group updated successfully: ID {group_id}")
            return group, None
        except Exception as e:
            db.session.rollback()
            logger.exception(
                f"Error updating product group {group_id}: {str(e)}")
            return None, "An error occurred while updating product group"

    @staticmethod
    def delete(group_id):
        """
        Delete a product group
        """
        group = ProductGroup.query.get(group_id)

        if not group:
            logger.warning(
                f"Deletion failed - product group not found: {group_id}")
            return False, "Product group not found"

        # Check if group is associated with any sales
        if hasattr(group, 'sales') and len(group.sales) > 0:
            logger.warning(
                f"Deletion failed - product group {group_id} is used in sales")
            return False, "Cannot delete product group that is being used in sales"

        try:
            # Store name for logging before deletion
            group_name = group.name
            group_id_value = group.id

            db.session.delete(group)
            db.session.commit()

            logger.info(
                f"Product group deleted successfully: ID {group_id_value}, name {group_name}")
            return True, None
        except Exception as e:
            db.session.rollback()
            logger.exception(
                f"Error deleting product group {group_id}: {str(e)}")
            return False, "An error occurred while deleting product group"
