import logging
from flask import jsonify, request, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.product.group import ProductGroupService
from app.schemas.product_schemas import ProductGroupSchema
from app.utils.decorators import admin_required, handle_validation_error
from app.services.product.group_import import GroupImportService

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


@admin_required()
@jwt_required()
def validate_import():
    """Upload and validate a group import file (phase 1)"""
    current_user_id = get_jwt_identity()
    logger.info(f"Group import validation started by user: {current_user_id}")

    if 'file' not in request.files:
        logger.warning("No file part in the request")
        return jsonify({"msg": "No file part", "success": False}), 400

    file = request.files['file']
    if file.filename == '':
        logger.warning("No file selected")
        return jsonify({"msg": "No file selected", "success": False}), 400

    # Check file extension
    if not file.filename.endswith(('.xlsx', '.xls', '.csv')):
        logger.warning(f"Invalid file format: {file.filename}")
        return jsonify({"msg": "Invalid file format. Please upload XLSX, XLS, or CSV file.", "success": False}), 400

    try:
        # Call service to validate the file
        result = GroupImportService.validate_groups_from_file(
            file, current_user_id)
        logger.info(
            f"Group import validation completed: {result['success_count']} valid, {result['error_count']} errors")

        # Return with the expected structure for frontend
        return jsonify({
            "success": True,
            "message": "Group data validated successfully",
            "details": {
                "import_id": str(result['import_id']),
                "total_records": result['total_count'],
                "success_count": result['success_count'],
                "error_count": result['error_count'],
                "errors": result['errors'],
                "has_more_errors": result['has_more_errors']
            }
        }), 200
    except ValueError as e:
        logger.warning(f"Validation error: {str(e)}")
        return jsonify({"msg": str(e), "success": False}), 400
    except Exception as e:
        logger.exception(f"Error during group import validation: {str(e)}")
        return jsonify({"msg": "An error occurred during group import validation", "success": False}), 500


@admin_required()
@jwt_required()
def confirm_import():
    """Confirm and process a validated group import (phase 2)"""
    current_user_id = get_jwt_identity()
    logger.info(
        f"Group import confirmation started by user: {current_user_id}")

    data = request.get_json()
    if not data or 'import_id' not in data:
        logger.warning("Missing import_id in request")
        return jsonify({"msg": "Missing import_id", "success": False}), 400

    import_id = data['import_id']

    try:
        # Call service to confirm the import
        result = GroupImportService.confirm_import(
            import_id, current_user_id)

        if not result['success']:
            logger.warning(
                f"Import confirmation failed: {result.get('error', 'Unknown error')}")
            return jsonify({
                "msg": result.get('error', 'Import confirmation failed'),
                "success": False
            }), 400

        logger.info(
            f"Group import confirmed successfully: {result['count']} of {result['total']} groups imported")
        return jsonify({
            "success": True,
            "msg": f"Successfully imported {result['count']} groups",
            "count": result['count'],
            "total": result['total'],
            "failed": result.get('failed', 0),
            "errors": result.get('errors', [])
        }), 200
    except Exception as e:
        logger.exception(f"Error during group import confirmation: {str(e)}")
        return jsonify({"msg": "An error occurred during group import confirmation", "success": False}), 500


@jwt_required()
def cancel_import():
    """Cancel a pending import and clean up temporary data"""
    current_user_id = get_jwt_identity()
    logger.info(
        f"Import cancellation requested by admin ID: {current_user_id}")

    try:
        # Get the import ID from the request
        data = request.get_json()
        if not data or 'import_id' not in data:
            return jsonify({"msg": "Import ID is required", "success": False}), 400

        import_id = data['import_id']

        # Delete the temporary import from the TempImport model
        from app.models.temp_import import TempImport
        if TempImport.delete_import(import_id, current_user_id):
            return jsonify({
                "success": True,
                "msg": "Import cancelled successfully"
            }), 200
        else:
            return jsonify({
                "success": False,
                "msg": "Import not found or already processed"
            }), 404

    except Exception as e:
        logger.exception(f"Error cancelling import: {str(e)}")
        return jsonify({
            "msg": f"An error occurred while cancelling import: {str(e)}",
            "success": False
        }), 500


@jwt_required()
def get_sample_file():
    """Generate and download a sample group import file"""
    current_user_id = get_jwt_identity()
    logger.info(
        f"Sample group import file requested by user: {current_user_id}")

    try:
        file_path, filename, mimetype = GroupImportService.create_sample_file()

        logger.info(f"Sample file created: {file_path}")
        return send_file(
            file_path,
            mimetype=mimetype,
            as_attachment=True,
            download_name=filename
        )
    except Exception as e:
        logger.exception(f"Error generating sample file: {str(e)}")
        return jsonify({"msg": "An error occurred while generating sample file", "success": False}), 500
