import logging
from app import db
from app.models.product import ProductDivision
from sqlalchemy import or_, and_
from datetime import datetime

logger = logging.getLogger('app.services.product.division')


class ProductDivisionService:
    @staticmethod
    def get_all(page=1, per_page=10, search=None, start_date=None, end_date=None):
        """
        Retrieve all product divisions with filtering and pagination
        """
        query = ProductDivision.query

        if search:
            query = query.filter(or_(
                ProductDivision.name.ilike(f'%{search}%'),
                ProductDivision.alias.ilike(f'%{search}%')
            ))
            logger.debug(
                f"Filtering product divisions with search term: {search}")

        if start_date and end_date:
            start = datetime.strptime(start_date, '%Y-%m-%d')
            end = datetime.strptime(end_date, '%Y-%m-%d')
            query = query.filter(and_(
                ProductDivision.created_at >= start,
                ProductDivision.created_at <= end
            ))
            logger.debug(
                f"Filtering product divisions by date range: {start_date} to {end_date}")

        divisions = query.order_by(ProductDivision.name).paginate(
            page=page, per_page=per_page)

        return {
            'items': divisions.items,
            'total': divisions.total,
            'pages': divisions.pages,
            'current_page': divisions.page
        }

    @staticmethod
    def get_by_id(division_id):
        """
        Retrieve a product division by UUID
        """
        return ProductDivision.query.get(division_id)

    @staticmethod
    def create(division_data):
        """
        Create a new product division
        """
        # Check if division name already exists
        if ProductDivision.query.filter(ProductDivision.name == division_data['name']).first():
            logger.warning(
                f"Creation failed - product division name already exists: {division_data['name']}")
            return None, "Product division name already exists"

        try:
            new_division = ProductDivision(
                name=division_data['name'],
                alias=division_data.get('alias')
            )

            db.session.add(new_division)
            db.session.commit()

            logger.info(
                f"Product division created successfully: {new_division.name}")
            return new_division, None
        except Exception as e:
            db.session.rollback()
            logger.exception(f"Error creating product division: {str(e)}")
            return None, "An error occurred while creating product division"

    @staticmethod
    def update(division_id, division_data):
        """
        Update an existing product division
        """
        division = ProductDivision.query.get(division_id)

        if not division:
            logger.warning(
                f"Update failed - product division not found: {division_id}")
            return None, "Product division not found"

        # Check if updated name already exists (if changed)
        if 'name' in division_data and division_data['name'] != division.name:
            if ProductDivision.query.filter(ProductDivision.name == division_data['name']).first():
                logger.warning(
                    f"Update failed - product division name already exists: {division_data['name']}")
                return None, "Product division name already exists"

        try:
            division.name = division_data.get('name', division.name)
            division.alias = division_data.get('alias', division.alias)
            db.session.commit()

            logger.info(
                f"Product division updated successfully: ID {division_id}")
            return division, None
        except Exception as e:
            db.session.rollback()
            logger.exception(
                f"Error updating product division {division_id}: {str(e)}")
            return None, "An error occurred while updating product division"

    @staticmethod
    def delete(division_id):
        """
        Delete a product division
        """
        division = ProductDivision.query.get(division_id)

        if not division:
            logger.warning(
                f"Deletion failed - product division not found: {division_id}")
            return False, "Product division not found"

        # Check if division is associated with any sales
        if hasattr(division, 'sales') and len(division.sales) > 0:
            logger.warning(
                f"Deletion failed - product division {division_id} is used in sales")
            return False, "Cannot delete product division that is being used in sales"

        try:
            # Store name for logging before deletion
            division_name = division.name

            db.session.delete(division)
            db.session.commit()

            logger.info(
                f"Product division deleted successfully: name {division_name}")
            return True, None
        except Exception as e:
            db.session.rollback()
            logger.exception(
                f"Error deleting product division {division_id}: {str(e)}")
            return False, "An error occurred while deleting product division"
