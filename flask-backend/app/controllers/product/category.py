import logging
from flask import jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.product.category import ProductCategoryService
from app.schemas.product_schemas import ProductCategorySchema
from app.utils.decorators import admin_required, handle_validation_error

logger = logging.getLogger('app.controllers.product.category')

product_category_schema = ProductCategorySchema()


@jwt_required()
def get_all():
    current_user_id = get_jwt_identity()
    logger.info(
        f"Product category listing requested by user ID: {current_user_id}")

    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        search = request.args.get('search', '')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')

        # Use the service
        categories_data = ProductCategoryService.get_all(
            page=page, per_page=per_page,
            search=search, start_date=start_date, end_date=end_date
        )

        result = {
            'categories': [{
                'uuid': str(category.uuid),
                'name': category.name,
                'created_at': category.created_at.isoformat() if category.created_at else None,
                'updated_at': category.updated_at.isoformat() if category.updated_at else None
            } for category in categories_data['items']],
            'total': categories_data['total'],
            'pages': categories_data['pages'],
            'current_page': categories_data['current_page']
        }

        logger.info(
            f"Retrieved {len(categories_data['items'])} product categories (page {page}/{categories_data['pages']})")
        return jsonify(result), 200

    except Exception as e:
        logger.exception(f"Error retrieving product categories: {str(e)}")
        return jsonify({"msg": "An error occurred while retrieving product categories", "success": False}), 500


@jwt_required()
def get_by_id(category_id):
    current_user_id = get_jwt_identity()
    logger.info(
        f"User ID {current_user_id} requesting details for product category ID: {category_id}")

    try:
        category = ProductCategoryService.get_by_id(category_id)
        if not category:
            logger.warning(f"Product category not found: {category_id}")
            return jsonify({"msg": "Product category not found", "success": False}), 404

        result = {
            'uuid': str(category.uuid),
            'name': category.name,
            'created_at': category.created_at.isoformat() if category.created_at else None,
            'updated_at': category.updated_at.isoformat() if category.updated_at else None
        }

        logger.info(f"Successfully retrieved product category: {category_id}")
        return jsonify(result), 200

    except Exception as e:
        logger.exception(
            f"Error retrieving product category {category_id}: {str(e)}")
        return jsonify({"msg": "An error occurred while retrieving product category", "success": False}), 500


@admin_required()
@jwt_required()
@handle_validation_error
def create():
    current_user_id = get_jwt_identity()
    logger.info(
        f"Product category creation attempt by admin ID: {current_user_id}")

    try:
        data = product_category_schema.load(request.json)
        category, error = ProductCategoryService.create(data)

        if error:
            return jsonify({"msg": error, "success": False}), 400

        result = {
            'uuid': str(category.uuid),
            'name': category.name,
            'created_at': category.created_at.isoformat() if category.created_at else None,
            'updated_at': category.updated_at.isoformat() if category.updated_at else None
        }

        logger.info(
            f"Product category created successfully: name {category.name}")
        return jsonify({"category": result, "success": True}), 201

    except Exception as e:
        logger.exception(f"Error creating product category: {str(e)}")
        return jsonify({"msg": "An error occurred while creating product category", "success": False}), 500


@admin_required()
@jwt_required()
@handle_validation_error
def update(category_id):
    current_user_id = get_jwt_identity()
    logger.info(
        f"Product category update attempt by admin ID {current_user_id} for category ID: {category_id}")

    try:
        # Use partial=True for updates, so not all fields are required
        data = product_category_schema.load(request.json, partial=True)
        category, error = ProductCategoryService.update(category_id, data)

        if error:
            return jsonify({"msg": error, "success": False}), 404 if error == "Product category not found" else 400

        result = {
            'uuid': str(category.uuid),
            'name': category.name,
            'created_at': category.created_at.isoformat() if category.created_at else None,
            'updated_at': category.updated_at.isoformat() if category.updated_at else None
        }

        logger.info(f"Product category updated successfully: ID {category_id}")
        return jsonify({"category": result, "success": True}), 200

    except Exception as e:
        logger.exception(
            f"Error updating product category {category_id}: {str(e)}")
        return jsonify({"msg": "An error occurred while updating product category", "success": False}), 500


@admin_required()
@jwt_required()
def delete(category_id):
    current_user_id = get_jwt_identity()
    logger.info(
        f"Product category deletion attempt by admin ID {current_user_id} for category ID: {category_id}")

    try:
        success, error = ProductCategoryService.delete(category_id)

        if not success:
            status_code = 404 if error == "Product category not found" else 400
            return jsonify({"msg": error, "success": False}), status_code

        logger.info(f"Product category deleted successfully: ID {category_id}")
        return jsonify({"msg": "Product category deleted successfully", "success": True}), 200

    except Exception as e:
        logger.exception(
            f"Error deleting product category {category_id}: {str(e)}")
        return jsonify({"msg": "An error occurred while deleting product category", "success": False}), 500
