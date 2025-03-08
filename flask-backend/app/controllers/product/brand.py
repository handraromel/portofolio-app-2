import logging
from flask import jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.product.brand import ProductBrandService
from app.schemas.product_schemas import ProductBrandSchema
from app.utils.decorators import admin_required, handle_validation_error

logger = logging.getLogger('app.controllers.product.brand')

product_brand_schema = ProductBrandSchema()


@jwt_required()
def get_all():
    current_user_id = get_jwt_identity()
    logger.info(
        f"Product brand listing requested by user ID: {current_user_id}")

    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        search = request.args.get('search', '')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')

        # Use the service
        brands_data = ProductBrandService.get_all(
            page=page, per_page=per_page,
            search=search, start_date=start_date, end_date=end_date
        )

        result = {
            'brands': [{
                'uuid': str(brand.uuid),
                'id': brand.id,
                'name': brand.name,
                'created_at': brand.created_at.isoformat() if brand.created_at else None,
                'updated_at': brand.updated_at.isoformat() if brand.updated_at else None
            } for brand in brands_data['items']],
            'total': brands_data['total'],
            'pages': brands_data['pages'],
            'current_page': brands_data['current_page']
        }

        logger.info(
            f"Retrieved {len(brands_data['items'])} product brands (page {page}/{brands_data['pages']})")
        return jsonify(result), 200

    except Exception as e:
        logger.exception(f"Error retrieving product brands: {str(e)}")
        return jsonify({"msg": "An error occurred while retrieving product brands", "success": False}), 500


@jwt_required()
def get_by_id(brand_id):
    current_user_id = get_jwt_identity()
    logger.info(
        f"User ID {current_user_id} requesting details for product brand ID: {brand_id}")

    try:
        brand = ProductBrandService.get_by_id(brand_id)
        if not brand:
            logger.warning(f"Product brand not found: {brand_id}")
            return jsonify({"msg": "Product brand not found", "success": False}), 404

        result = {
            'uuid': str(brand.uuid),
            'id': brand.id,
            'name': brand.name,
            'created_at': brand.created_at.isoformat() if brand.created_at else None,
            'updated_at': brand.updated_at.isoformat() if brand.updated_at else None
        }

        logger.info(f"Successfully retrieved product brand: {brand_id}")
        return jsonify(result), 200

    except Exception as e:
        logger.exception(
            f"Error retrieving product brand {brand_id}: {str(e)}")
        return jsonify({"msg": "An error occurred while retrieving product brand", "success": False}), 500


@admin_required()
@jwt_required()
@handle_validation_error
def create():
    current_user_id = get_jwt_identity()
    logger.info(
        f"Product brand creation attempt by admin ID: {current_user_id}")

    try:
        data = product_brand_schema.load(request.json)
        brand, error = ProductBrandService.create(data)

        if error:
            return jsonify({"msg": error, "success": False}), 400

        result = {
            'uuid': str(brand.uuid),
            'id': brand.id,
            'name': brand.name,
            'created_at': brand.created_at.isoformat() if brand.created_at else None,
            'updated_at': brand.updated_at.isoformat() if brand.updated_at else None
        }

        logger.info(
            f"Product brand created successfully: ID {brand.id}, name {brand.name}")
        return jsonify({"brand": result, "success": True}), 201

    except Exception as e:
        logger.exception(f"Error creating product brand: {str(e)}")
        return jsonify({"msg": "An error occurred while creating product brand", "success": False}), 500


@admin_required()
@jwt_required()
@handle_validation_error
def update(brand_id):
    current_user_id = get_jwt_identity()
    logger.info(
        f"Product brand update attempt by admin ID {current_user_id} for brand ID: {brand_id}")

    try:
        # Use partial=True for updates, so not all fields are required
        data = product_brand_schema.load(request.json, partial=True)
        brand, error = ProductBrandService.update(brand_id, data)

        if error:
            return jsonify({"msg": error, "success": False}), 404 if error == "Product brand not found" else 400

        result = {
            'uuid': str(brand.uuid),
            'id': brand.id,
            'name': brand.name,
            'created_at': brand.created_at.isoformat() if brand.created_at else None,
            'updated_at': brand.updated_at.isoformat() if brand.updated_at else None
        }

        logger.info(f"Product brand updated successfully: ID {brand_id}")
        return jsonify({"brand": result, "success": True}), 200

    except Exception as e:
        logger.exception(f"Error updating product brand {brand_id}: {str(e)}")
        return jsonify({"msg": "An error occurred while updating product brand", "success": False}), 500


@admin_required()
@jwt_required()
def delete(brand_id):
    current_user_id = get_jwt_identity()
    logger.info(
        f"Product brand deletion attempt by admin ID {current_user_id} for brand ID: {brand_id}")

    try:
        success, error = ProductBrandService.delete(brand_id)

        if not success:
            status_code = 404 if error == "Product brand not found" else 400
            return jsonify({"msg": error, "success": False}), status_code

        logger.info(f"Product brand deleted successfully: ID {brand_id}")
        return jsonify({"msg": "Product brand deleted successfully", "success": True}), 200

    except Exception as e:
        logger.exception(f"Error deleting product brand {brand_id}: {str(e)}")
        return jsonify({"msg": "An error occurred while deleting product brand", "success": False}), 500
