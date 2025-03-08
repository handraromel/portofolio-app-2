import logging
from flask import jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.product.division import ProductDivisionService
from app.schemas.product_schemas import ProductDivisionSchema
from app.utils.decorators import admin_required, handle_validation_error

logger = logging.getLogger('app.controllers.product.division')

product_division_schema = ProductDivisionSchema()


@jwt_required()
def get_all():
    current_user_id = get_jwt_identity()
    logger.info(
        f"Product division listing requested by user ID: {current_user_id}")

    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        search = request.args.get('search', '')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')

        # Use the service
        divisions_data = ProductDivisionService.get_all(
            page=page, per_page=per_page,
            search=search, start_date=start_date, end_date=end_date
        )

        result = {
            'divisions': [{
                'uuid': str(division.uuid),
                'name': division.name,
                'alias': division.alias,
                'created_at': division.created_at.isoformat() if division.created_at else None,
                'updated_at': division.updated_at.isoformat() if division.updated_at else None
            } for division in divisions_data['items']],
            'total': divisions_data['total'],
            'pages': divisions_data['pages'],
            'current_page': divisions_data['current_page']
        }

        logger.info(
            f"Retrieved {len(divisions_data['items'])} product divisions (page {page}/{divisions_data['pages']})")
        return jsonify(result), 200

    except Exception as e:
        logger.exception(f"Error retrieving product divisions: {str(e)}")
        return jsonify({"msg": "An error occurred while retrieving product divisions", "success": False}), 500


@jwt_required()
def get_by_id(division_id):
    current_user_id = get_jwt_identity()
    logger.info(
        f"User ID {current_user_id} requesting details for product division ID: {division_id}")

    try:
        division = ProductDivisionService.get_by_id(division_id)
        if not division:
            logger.warning(f"Product division not found: {division_id}")
            return jsonify({"msg": "Product division not found", "success": False}), 404

        result = {
            'uuid': str(division.uuid),
            'name': division.name,
            'alias': division.alias,
            'created_at': division.created_at.isoformat() if division.created_at else None,
            'updated_at': division.updated_at.isoformat() if division.updated_at else None
        }

        logger.info(f"Successfully retrieved product division: {division_id}")
        return jsonify(result), 200

    except Exception as e:
        logger.exception(
            f"Error retrieving product division {division_id}: {str(e)}")
        return jsonify({"msg": "An error occurred while retrieving product division", "success": False}), 500


@admin_required()
@jwt_required()
@handle_validation_error
def create():
    current_user_id = get_jwt_identity()
    logger.info(
        f"Product division creation attempt by admin ID: {current_user_id}")

    try:
        data = product_division_schema.load(request.json)
        division, error = ProductDivisionService.create(data)

        if error:
            return jsonify({"msg": error, "success": False}), 400

        result = {
            'uuid': str(division.uuid),
            'name': division.name,
            'alias': division.alias,
            'created_at': division.created_at.isoformat() if division.created_at else None,
            'updated_at': division.updated_at.isoformat() if division.updated_at else None
        }

        logger.info(
            f"Product division created successfully: name {division.name}")
        return jsonify({"division": result, "success": True}), 201

    except Exception as e:
        logger.exception(f"Error creating product division: {str(e)}")
        return jsonify({"msg": "An error occurred while creating product division", "success": False}), 500


@admin_required()
@jwt_required()
@handle_validation_error
def update(division_id):
    current_user_id = get_jwt_identity()
    logger.info(
        f"Product division update attempt by admin ID {current_user_id} for division ID: {division_id}")

    try:
        # Use partial=True for updates, so not all fields are required
        data = product_division_schema.load(request.json, partial=True)
        division, error = ProductDivisionService.update(division_id, data)

        if error:
            return jsonify({"msg": error, "success": False}), 404 if error == "Product division not found" else 400

        result = {
            'uuid': str(division.uuid),
            'name': division.name,
            'alias': division.alias,
            'created_at': division.created_at.isoformat() if division.created_at else None,
            'updated_at': division.updated_at.isoformat() if division.updated_at else None
        }

        logger.info(f"Product division updated successfully: ID {division_id}")
        return jsonify({"division": result, "success": True}), 200

    except Exception as e:
        logger.exception(
            f"Error updating product division {division_id}: {str(e)}")
        return jsonify({"msg": "An error occurred while updating product division", "success": False}), 500


@admin_required()
@jwt_required()
def delete(division_id):
    current_user_id = get_jwt_identity()
    logger.info(
        f"Product division deletion attempt by admin ID {current_user_id} for division ID: {division_id}")

    try:
        success, error = ProductDivisionService.delete(division_id)

        if not success:
            status_code = 404 if error == "Product division not found" else 400
            return jsonify({"msg": error, "success": False}), status_code

        logger.info(f"Product division deleted successfully: ID {division_id}")
        return jsonify({"msg": "Product division deleted successfully", "success": True}), 200

    except Exception as e:
        logger.exception(
            f"Error deleting product division {division_id}: {str(e)}")
        return jsonify({"msg": "An error occurred while deleting product division", "success": False}), 500
