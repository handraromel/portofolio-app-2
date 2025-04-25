import logging
from app import db
from app.models.product import ProductBrand
from sqlalchemy import or_, and_
from datetime import datetime

logger = logging.getLogger('app.services.product.brand')


class ProductBrandService:
    @staticmethod
    def get_all(page=1, per_page=10, search=None, start_date=None, end_date=None):
        """
        Retrieve all product brands with filtering and pagination
        """
        query = ProductBrand.query

        if search:
            query = query.filter(or_(
                ProductBrand.name.ilike(f'%{search}%'),
                ProductBrand.id.cast(db.String).ilike(f'%{search}%')
            ))
            logger.debug(
                f"Filtering product brands with search term: {search}")

        if start_date and end_date:
            start = datetime.strptime(start_date, '%Y-%m-%d')
            end = datetime.strptime(end_date, '%Y-%m-%d')
            query = query.filter(and_(
                ProductBrand.created_at >= start,
                ProductBrand.created_at <= end
            ))
            logger.debug(
                f"Filtering product brands by date range: {start_date} to {end_date}")

        brands = query.order_by(ProductBrand.id).paginate(
            page=page, per_page=per_page)

        return {
            'items': brands.items,
            'total': brands.total,
            'pages': brands.pages,
            'current_page': brands.page
        }

    @staticmethod
    def get_by_id(brand_id):
        """
        Retrieve a product brand by UUID
        """
        return ProductBrand.query.get(brand_id)

    @staticmethod
    def create(brand_data):
        """
        Create a new product brand
        """
        # Check if brand ID already exists
        if ProductBrand.query.filter(ProductBrand.id == brand_data['id']).first():
            logger.warning(
                f"Creation failed - product brand ID already exists: {brand_data['id']}")
            return None, "Product brand ID already exists"

        # Check if brand name already exists
        # if ProductBrand.query.filter(ProductBrand.name == brand_data['name']).first():
        #     logger.warning(
        #         f"Creation failed - product brand name already exists: {brand_data['name']}")
        #     return None, "Product brand name already exists"

        try:
            new_brand = ProductBrand(
                id=brand_data['id'],
                name=brand_data['name']
            )

            db.session.add(new_brand)
            db.session.commit()

            logger.info(
                f"Product brand created successfully: ID {new_brand.id}")
            return new_brand, None
        except Exception as e:
            db.session.rollback()
            logger.exception(f"Error creating product brand: {str(e)}")
            return None, "An error occurred while creating product brand"

    @staticmethod
    def update(brand_id, brand_data):
        """
        Update an existing product brand
        """
        brand = ProductBrand.query.get(brand_id)

        if not brand:
            logger.warning(
                f"Update failed - product brand not found: {brand_id}")
            return None, "Product brand not found"

        # Check if updated name already exists (if changed)
        if 'name' in brand_data and brand_data['name'] != brand.name:
            if ProductBrand.query.filter(ProductBrand.name == brand_data['name']).first():
                logger.warning(
                    f"Update failed - product brand name already exists: {brand_data['name']}")
                return None, "Product brand name already exists"

        try:
            brand.name = brand_data.get('name', brand.name)
            db.session.commit()

            logger.info(f"Product brand updated successfully: ID {brand_id}")
            return brand, None
        except Exception as e:
            db.session.rollback()
            logger.exception(
                f"Error updating product brand {brand_id}: {str(e)}")
            return None, "An error occurred while updating product brand"

    @staticmethod
    def delete(brand_id):
        """
        Delete a product brand
        """
        brand = ProductBrand.query.get(brand_id)

        if not brand:
            logger.warning(
                f"Deletion failed - product brand not found: {brand_id}")
            return False, "Product brand not found"

        # Check if brand is associated with any sales
        if hasattr(brand, 'sales') and len(brand.sales) > 0:
            logger.warning(
                f"Deletion failed - product brand {brand_id} is used in sales")
            return False, "Cannot delete product brand that is being used in sales"

        try:
            # Store name for logging before deletion
            brand_name = brand.name
            brand_id_value = brand.id

            db.session.delete(brand)
            db.session.commit()

            logger.info(
                f"Product brand deleted successfully: ID {brand_id_value}, name {brand_name}")
            return True, None
        except Exception as e:
            db.session.rollback()
            logger.exception(
                f"Error deleting product brand {brand_id}: {str(e)}")
            return False, "An error occurred while deleting product brand"
