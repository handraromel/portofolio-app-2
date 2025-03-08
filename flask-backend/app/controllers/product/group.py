import logging
from flask import jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.product.group import ProductGroupService
from app.schemas.product_schemas import ProductGroupSchema
from app.utils.decorators import admin_required, handle_validation_error

logger = logging.getLogger('app.controllers.product.group')

product_group_schema = ProductGroupSchema()


@jwt_required()
def get_all():
    current_user_id = get_jwt_identity()
    logger.info(
        f"Product group listing requested by user ID: {current_user_id}")

    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        search = request.args.get('search', '')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')

        # Use the service
        groups_data = ProductGroupService.get_all(
            page=page, per_page=per_page,
            search=search, start_date=start_date, end_date=end_date
        )

        result = {
            'groups': [{
                'uuid': str(group.uuid),
                'id': group.id,
                'name': group.name,
                'created_at': group.created_at.isoformat() if group.created_at else None,
                'updated_at': group.updated_at.isoformat() if group.updated_at else None
            } for group in groups_data['items']],
            'total': groups_data['total'],
            'pages': groups_data['pages'],
            'current_page': groups_data['current_page']
        }

        logger.info(
            f"Retrieved {len(groups_data['items'])} product groups (page {page}/{groups_data['pages']})")
        return jsonify(result), 200

    except Exception as e:
        logger.exception(f"Error retrieving product groups: {str(e)}")
        return jsonify({"msg": "An error occurred while retrieving product groups", "success": False}), 500


@jwt_required()
def get_by_id(group_id):
    current_user_id = get_jwt_identity()
    logger.info(
        f"User ID {current_user_id} requesting details for product group ID: {group_id}")

    try:
        group = ProductGroupService.get_by_id(group_id)
        if not group:
            logger.warning(f"Product group not found: {group_id}")
            return jsonify({"msg": "Product group not found", "success": False}), 404

        result = {
            'uuid': str(group.uuid),
            'id': group.id,
            'name': group.name,
            'created_at': group.created_at.isoformat() if group.created_at else None,
            'updated_at': group.updated_at.isoformat() if group.updated_at else None
        }

        logger.info(f"Successfully retrieved product group: {group_id}")
        return jsonify(result), 200

    except Exception as e:
        logger.exception(
            f"Error retrieving product group {group_id}: {str(e)}")
        return jsonify({"msg": "An error occurred while retrieving product group", "success": False}), 500


@admin_required()
@jwt_required()
@handle_validation_error
def create():
    current_user_id = get_jwt_identity()
    logger.info(
        f"Product group creation attempt by admin ID: {current_user_id}")

    try:
        data = product_group_schema.load(request.json)
        group, error = ProductGroupService.create(data)

        if error:
            return jsonify({"msg": error, "success": False}), 400

        result = {
            'uuid': str(group.uuid),
            'id': group.id,
            'name': group.name,
            'created_at': group.created_at.isoformat() if group.created_at else None,
            'updated_at': group.updated_at.isoformat() if group.updated_at else None
        }

        logger.info(
            f"Product group created successfully: ID {group.id}, name {group.name}")
        return jsonify({"group": result, "success": True}), 201

    except Exception as e:
        logger.exception(f"Error creating product group: {str(e)}")
        return jsonify({"msg": "An error occurred while creating product group", "success": False}), 500


@admin_required()
@jwt_required()
@handle_validation_error
def update(group_id):
    current_user_id = get_jwt_identity()
    logger.info(
        f"Product group update attempt by admin ID {current_user_id} for group ID: {group_id}")

    try:
        # Use partial=True for updates, so not all fields are required
        data = product_group_schema.load(request.json, partial=True)
        group, error = ProductGroupService.update(group_id, data)

        if error:
            return jsonify({"msg": error, "success": False}), 404 if error == "Product group not found" else 400

        result = {
            'uuid': str(group.uuid),
            'id': group.id,
            'name': group.name,
            'created_at': group.created_at.isoformat() if group.created_at else None,
            'updated_at': group.updated_at.isoformat() if group.updated_at else None
        }

        logger.info(f"Product group updated successfully: ID {group_id}")
        return jsonify({"group": result, "success": True}), 200

    except Exception as e:
        logger.exception(f"Error updating product group {group_id}: {str(e)}")
        return jsonify({"msg": "An error occurred while updating product group", "success": False}), 500


@admin_required()
@jwt_required()
def delete(group_id):
    current_user_id = get_jwt_identity()
    logger.info(
        f"Product group deletion attempt by admin ID {current_user_id} for group ID: {group_id}")

    try:
        success, error = ProductGroupService.delete(group_id)

        if not success:
            status_code = 404 if error == "Product group not found" else 400
            return jsonify({"msg": error, "success": False}), status_code

        logger.info(f"Product group deleted successfully: ID {group_id}")
        return jsonify({"msg": "Product group deleted successfully", "success": True}), 200

    except Exception as e:
        logger.exception(f"Error deleting product group {group_id}: {str(e)}")
        return jsonify({"msg": "An error occurred while deleting product group", "success": False}), 500
