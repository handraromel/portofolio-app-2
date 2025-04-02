import logging
from flask import jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.tax_config import TaxConfigurationService
from app.schemas.tax_config_schemas import TaxConfigurationSchema
from app.utils.decorators import admin_required, handle_validation_error
from datetime import datetime

logger = logging.getLogger('app.controllers.tax_config')

tax_config_schema = TaxConfigurationSchema()


@jwt_required()
def get_all():
    current_user_id = get_jwt_identity()
    logger.info(
        f"Tax configuration listing requested by user ID: {current_user_id}")

    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        search = request.args.get('search', '')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')

        # Use the service
        tax_configs_data = TaxConfigurationService.get_all(
            page=page, per_page=per_page,
            search=search, start_date=start_date, end_date=end_date
        )

        result = {
            'tax_configurations': [{
                'uuid': str(tax_config.uuid),
                'name': tax_config.name,
                'tax_rate': float(tax_config.tax_rate),
                'effective_from': tax_config.effective_from.isoformat() if tax_config.effective_from else None,
                'effective_until': tax_config.effective_until.isoformat() if tax_config.effective_until else None,
                'description': tax_config.description,
                'created_at': tax_config.created_at.isoformat() if tax_config.created_at else None,
                'updated_at': tax_config.updated_at.isoformat() if tax_config.updated_at else None,
                'is_active': _is_tax_config_active(tax_config)
            } for tax_config in tax_configs_data['items']],
            'total': tax_configs_data['total'],
            'pages': tax_configs_data['pages'],
            'current_page': tax_configs_data['current_page']
        }

        logger.info(
            f"Retrieved {len(tax_configs_data['items'])} tax configurations (page {page}/{tax_configs_data['pages']})")
        return jsonify(result), 200

    except Exception as e:
        logger.exception(f"Error retrieving tax configurations: {str(e)}")
        return jsonify({"msg": "An error occurred while retrieving tax configurations", "success": False}), 500


@jwt_required()
def get_by_id(tax_config_id):
    current_user_id = get_jwt_identity()
    logger.info(
        f"User ID {current_user_id} requesting details for tax configuration ID: {tax_config_id}")

    try:
        tax_config = TaxConfigurationService.get_by_id(tax_config_id)
        if not tax_config:
            logger.warning(f"Tax configuration not found: {tax_config_id}")
            return jsonify({"msg": "Tax configuration not found", "success": False}), 404

        result = {
            'uuid': str(tax_config.uuid),
            'name': tax_config.name,
            'tax_rate': float(tax_config.tax_rate),
            'effective_from': tax_config.effective_from.isoformat() if tax_config.effective_from else None,
            'effective_until': tax_config.effective_until.isoformat() if tax_config.effective_until else None,
            'description': tax_config.description,
            'created_at': tax_config.created_at.isoformat() if tax_config.created_at else None,
            'updated_at': tax_config.updated_at.isoformat() if tax_config.updated_at else None,
            'is_active': _is_tax_config_active(tax_config)
        }

        logger.info(
            f"Successfully retrieved tax configuration: {tax_config_id}")
        return jsonify(result), 200

    except Exception as e:
        logger.exception(
            f"Error retrieving tax configuration {tax_config_id}: {str(e)}")
        return jsonify({"msg": "An error occurred while retrieving tax configuration", "success": False}), 500


@jwt_required()
def get_current_tax():
    """Get the currently active tax rate"""
    current_user_id = get_jwt_identity()
    logger.info(
        f"Current tax rate requested by user ID: {current_user_id}")

    try:
        tax_rate = TaxConfigurationService.get_current_tax_rate()

        result = {
            'tax_rate': tax_rate
        }

        logger.info(f"Successfully retrieved current tax rate: {tax_rate}%")
        return jsonify(result), 200

    except Exception as e:
        logger.exception(f"Error retrieving current tax rate: {str(e)}")
        return jsonify({"msg": "An error occurred while retrieving current tax rate", "success": False}), 500


@admin_required()
@jwt_required()
@handle_validation_error
def create():
    current_user_id = get_jwt_identity()
    logger.info(
        f"Tax configuration creation attempt by admin ID: {current_user_id}")

    try:
        # Create a context dictionary
        context = {
            'effective_from': datetime.strptime(request.json.get('effective_from'), '%Y-%m-%d').date()
            if request.json.get('effective_from') else None
        }

        # Create a new instance of the schema with the context
        schema_instance = TaxConfigurationSchema(context=context)

        # Use this instance to load the data
        data = schema_instance.load(request.json)
        tax_config, error = TaxConfigurationService.create(data)

        if error:
            return jsonify({"msg": error, "success": False}), 400

        result = {
            'uuid': tax_config.uuid,
            'name': tax_config.name,
            'tax_rate': float(tax_config.tax_rate),
            'effective_from': tax_config.effective_from.isoformat() if tax_config.effective_from else None,
            'effective_until': tax_config.effective_until.isoformat() if tax_config.effective_until else None,
            'description': tax_config.description,
            'created_at': tax_config.created_at.isoformat() if tax_config.created_at else None,
            'updated_at': tax_config.updated_at.isoformat() if tax_config.updated_at else None
        }

        logger.info(
            f"Tax configuration created successfully: ID {tax_config.uuid}")
        return jsonify({"tax_configuration": result, "success": True}), 201

    except Exception as e:
        logger.exception(f"Error creating tax configuration: {str(e)}")
        return jsonify({"msg": "An error occurred while creating tax configuration", "success": False}), 500


@admin_required()
@jwt_required()
@handle_validation_error
def update(tax_config_id):
    current_user_id = get_jwt_identity()
    logger.info(
        f"Tax configuration update attempt by admin ID {current_user_id} for tax config ID: {tax_config_id}")

    try:
        tax_config = TaxConfigurationService.get_by_id(tax_config_id)
        if not tax_config:
            logger.warning(
                f"Tax configuration not found for update: {tax_config_id}")
            return jsonify({"msg": "Tax configuration not found", "success": False}), 404

        # Create context for validation
        context = {
            'effective_from': datetime.strptime(request.json.get('effective_from'), '%Y-%m-%d').date()
            if request.json.get('effective_from') else tax_config.effective_from,
            'is_update': True
        }

        # Create schema with context
        schema_instance = TaxConfigurationSchema(context=context, partial=True)

        # Load data with the schema instance
        data = schema_instance.load(request.json)
        updated_tax_config, error = TaxConfigurationService.update(
            tax_config_id, data)

        if error:
            return jsonify({"msg": error, "success": False}), 404 if error == "Tax configuration not found" else 400

        result = {
            'uuid': updated_tax_config.uuid,
            'name': updated_tax_config.name,
            'tax_rate': float(updated_tax_config.tax_rate),
            'effective_from': updated_tax_config.effective_from.isoformat() if updated_tax_config.effective_from else None,
            'effective_until': updated_tax_config.effective_until.isoformat() if updated_tax_config.effective_until else None,
            'description': updated_tax_config.description,
            'created_at': updated_tax_config.created_at.isoformat() if updated_tax_config.created_at else None,
            'updated_at': updated_tax_config.updated_at.isoformat() if updated_tax_config.updated_at else None
        }

        logger.info(
            f"Tax configuration updated successfully: ID {tax_config_id}")
        return jsonify({"tax_configuration": result, "success": True}), 200

    except Exception as e:
        logger.exception(
            f"Error updating tax configuration {tax_config_id}: {str(e)}")
        return jsonify({"msg": "An error occurred while updating tax configuration", "success": False}), 500


@admin_required()
@jwt_required()
def delete(tax_config_id):
    current_user_id = get_jwt_identity()
    logger.info(
        f"Tax configuration deletion attempt by admin ID {current_user_id} for tax config ID: {tax_config_id}")

    try:
        success, error = TaxConfigurationService.delete(tax_config_id)

        if not success:
            status_code = 404 if error == "Tax configuration not found" else 400
            return jsonify({"msg": error, "success": False}), status_code

        logger.info(
            f"Tax configuration deleted successfully: ID {tax_config_id}")
        return jsonify({"msg": "Tax configuration deleted successfully", "success": True}), 200

    except Exception as e:
        logger.exception(
            f"Error deleting tax configuration {tax_config_id}: {str(e)}")
        return jsonify({"msg": "An error occurred while deleting tax configuration", "success": False}), 500


def _is_tax_config_active(tax_config):
    """Helper function to determine if a tax configuration is currently active"""
    today = datetime.now().date()
    return (tax_config.effective_from <= today and
            (tax_config.effective_until is None or tax_config.effective_until >= today))
