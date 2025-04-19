import logging
from flask import jsonify, request, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.product.brand import ProductBrandService
from app.schemas.product_schemas import ProductBrandSchema
from app.utils.decorators import admin_required, handle_validation_error
from app.services.product.brand_import import BrandImportService

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


@jwt_required()
@admin_required()
def validate_import():
    """Phase 1: Validate brand data from uploaded file"""
    current_user_id = get_jwt_identity()
    logger.info(f"Brand import validation started by user: {current_user_id}")

    if 'file' not in request.files:
        return jsonify({
            "success": False,
            "msg": "No file part in the request"
        }), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({
            "success": False,
            "msg": "No file selected"
        }), 400

    # Validate file extension
    if not file.filename.lower().endswith(('.csv', '.xlsx', '.xls')):
        return jsonify({
            "success": False,
            "msg": "Unsupported file format. Please upload CSV or Excel file."
        }), 400

    try:
        result = BrandImportService.validate_brands_from_file(
            file, current_user_id)

        # Format the response exactly as expected by the frontend
        return jsonify({
            "success": True,
            "message": "Brand data validated successfully",
            "details": {
                "import_id": str(result['import_id']),
                "total_records": result['total_count'],
                "success_count": result['success_count'],
                "error_count": result['error_count'],
                "errors": result['errors'],
                "has_more_errors": result['has_more_errors']
            }
        }), 200

    except Exception as e:
        logger.exception(f"Error validating brand import: {str(e)}")
        return jsonify({
            "success": False,
            "msg": str(e)
        }), 500


@admin_required()
@jwt_required()
def confirm_import():
    """Confirm and process a validated brand import (phase 2)"""
    current_user_id = get_jwt_identity()
    logger.info(
        f"Brand import confirmation started by user: {current_user_id}")

    data = request.get_json()
    if not data or 'import_id' not in data:
        logger.warning("Missing import_id in request")
        return jsonify({"msg": "Missing import_id", "success": False}), 400

    import_id = data['import_id']

    try:
        # Call service to confirm the import
        result = BrandImportService.confirm_import(
            import_id, current_user_id)

        if not result['success']:
            logger.warning(
                f"Import confirmation failed: {result.get('error', 'Unknown error')}")
            return jsonify({
                "msg": result.get('error', 'Import confirmation failed'),
                "success": False
            }), 400

        logger.info(
            f"Brand import confirmed successfully: {result['count']} of {result['total']} brands imported")
        return jsonify({
            "count": result['count'],
            "total": result['total'],
            "failed": result.get('failed', 0),
            "errors": result.get('errors', []),
            "success": True
        }), 200
    except Exception as e:
        logger.exception(f"Error during brand import confirmation: {str(e)}")
        return jsonify({"msg": "An error occurred during brand import confirmation", "success": False}), 500


@admin_required()
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
    """Generate and download a sample brand import file"""
    current_user_id = get_jwt_identity()
    logger.info(
        f"Sample brand import file requested by user: {current_user_id}")

    try:
        file_path, filename, mimetype = BrandImportService.create_sample_file()

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
