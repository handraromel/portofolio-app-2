import logging
from app import db
from app.models.product import ProductCategory
from sqlalchemy import or_, and_
from datetime import datetime

logger = logging.getLogger('app.services.product.category')


class ProductCategoryService:
    @staticmethod
    def get_all(page=1, per_page=10, search=None, start_date=None, end_date=None):
        """
        Retrieve all product categories with filtering and pagination
        """
        query = ProductCategory.query

        if search:
            query = query.filter(
                ProductCategory.name.ilike(f'%{search}%')
            )
            logger.debug(
                f"Filtering product categories with search term: {search}")

        if start_date and end_date:
            start = datetime.strptime(start_date, '%Y-%m-%d')
            end = datetime.strptime(end_date, '%Y-%m-%d')
            query = query.filter(and_(
                ProductCategory.created_at >= start,
                ProductCategory.created_at <= end
            ))
            logger.debug(
                f"Filtering product categories by date range: {start_date} to {end_date}")

        categories = query.order_by(ProductCategory.name).paginate(
            page=page, per_page=per_page)

        return {
            'items': categories.items,
            'total': categories.total,
            'pages': categories.pages,
            'current_page': categories.page
        }

    @staticmethod
    def get_by_id(category_id):
        """
        Retrieve a product category by UUID
        """
        return ProductCategory.query.get(category_id)

    @staticmethod
    def create(category_data):
        """
        Create a new product category
        """
        # Check if category name already exists
        if ProductCategory.query.filter(ProductCategory.name == category_data['name']).first():
            logger.warning(
                f"Creation failed - product category name already exists: {category_data['name']}")
            return None, "Product category name already exists"

        try:
            new_category = ProductCategory(
                name=category_data['name']
            )

            db.session.add(new_category)
            db.session.commit()

            logger.info(
                f"Product category created successfully: {new_category.name}")
            return new_category, None
        except Exception as e:
            db.session.rollback()
            logger.exception(f"Error creating product category: {str(e)}")
            return None, "An error occurred while creating product category"

    @staticmethod
    def update(category_id, category_data):
        """
        Update an existing product category
        """
        category = ProductCategory.query.get(category_id)

        if not category:
            logger.warning(
                f"Update failed - product category not found: {category_id}")
            return None, "Product category not found"

        # Check if updated name already exists (if changed)
        if 'name' in category_data and category_data['name'] != category.name:
            if ProductCategory.query.filter(ProductCategory.name == category_data['name']).first():
                logger.warning(
                    f"Update failed - product category name already exists: {category_data['name']}")
                return None, "Product category name already exists"

        try:
            category.name = category_data.get('name', category.name)
            db.session.commit()

            logger.info(
                f"Product category updated successfully: ID {category_id}")
            return category, None
        except Exception as e:
            db.session.rollback()
            logger.exception(
                f"Error updating product category {category_id}: {str(e)}")
            return None, "An error occurred while updating product category"

    @staticmethod
    def delete(category_id):
        """
        Delete a product category
        """
        category = ProductCategory.query.get(category_id)

        if not category:
            logger.warning(
                f"Deletion failed - product category not found: {category_id}")
            return False, "Product category not found"

        # Check if category is associated with any sales
        if hasattr(category, 'sales') and len(category.sales) > 0:
            logger.warning(
                f"Deletion failed - product category {category_id} is used in sales")
            return False, "Cannot delete product category that is being used in sales"

        try:
            # Store name for logging before deletion
            category_name = category.name

            db.session.delete(category)
            db.session.commit()

            logger.info(
                f"Product category deleted successfully: name {category_name}")
            return True, None
        except Exception as e:
            db.session.rollback()
            logger.exception(
                f"Error deleting product category {category_id}: {str(e)}")
            return False, "An error occurred while deleting product category"
