import logging
import os
from flask import jsonify, request, send_file
from datetime import date, datetime, timedelta
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.sale import SaleService
from app.schemas.sale_schemas import SaleSchema
from app.services.sale_import_export import SaleImportExportService
from app.services.activity import ActivityService
from app.utils.decorators import admin_required, handle_validation_error

logger = logging.getLogger('app.controllers.sale')

sale_schema = SaleSchema()


@jwt_required()
def get_all():
    current_user_id = get_jwt_identity()
    logger.info(f"Sales listing requested by user ID: {current_user_id}")

    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        search = request.args.get('search', '')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        brand_id = request.args.get('brand_id')
        group_id = request.args.get('group_id')
        division_id = request.args.get('division_id')
        category_id = request.args.get('category_id')

        # Use the service
        sales_data = SaleService.get_all(
            page=page, per_page=per_page,
            search=search, start_date=start_date, end_date=end_date,
            brand_id=brand_id, group_id=group_id,
            division_id=division_id, category_id=category_id
        )

        result = {
            'sales': [{
                'uuid': str(item['sale'].uuid),
                'sale_qty': item['sale'].sale_qty,
                'discounted_amt': float(item['sale'].discounted_amt),
                'sale_amt': float(item['sale'].sale_amt),
                'sku': item['sale'].sku,
                'item_no': item['sale'].item_no,
                'input_date': item['sale'].input_date.isoformat(),
                'description': item['sale'].description,
                'created_at': item['sale'].created_at.isoformat() if item['sale'].created_at else None,
                'updated_at': item['sale'].updated_at.isoformat() if item['sale'].updated_at else None,
                'gross_sales': item['gross_sales'],
                'nett_sales': item['nett_sales'],
                'tax_rate': item['tax_rate'],
                'tax_amount': item['tax_amount'],
                'nett_sales_after_tax': item['nett_sales_after_tax'],
                'brand': {
                    'uuid': str(item['sale'].brand.uuid),
                    'id': item['sale'].brand.id,
                    'name': item['sale'].brand.name
                },
                'group': {
                    'uuid': str(item['sale'].group.uuid),
                    'id': item['sale'].group.id,
                    'name': item['sale'].group.name
                },
                'division': {
                    'uuid': str(item['sale'].division.uuid),
                    'name': item['sale'].division.name,
                    'alias': item['sale'].division.alias
                },
                'category': {
                    'uuid': str(item['sale'].category.uuid),
                    'name': item['sale'].category.name
                },
                'user': {
                    'uuid': str(item['sale'].user.id) if item['sale'].user else None,
                    'name': f"{item['sale'].user.first_name} {item['sale'].user.last_name}" if item['sale'].user and item['sale'].user.first_name and item['sale'].user.last_name else None,
                    'username': item['sale'].user.username if item['sale'].user else None
                }
            } for item in sales_data['items']],
            'total': sales_data['total'],
            'pages': sales_data['pages'],
            'current_page': sales_data['current_page']
        }

        logger.info(
            f"Retrieved {len(sales_data['items'])} sales (page {page}/{sales_data['pages']})")
        return jsonify(result), 200

    except Exception as e:
        logger.exception(f"Error retrieving sales: {str(e)}")
        return jsonify({"msg": "An error occurred while retrieving sales", "success": False}), 500


@jwt_required()
def get_by_id(sale_id):
    current_user_id = get_jwt_identity()
    logger.info(
        f"User ID {current_user_id} requesting details for sale ID: {sale_id}")

    try:
        sale_data = SaleService.get_by_id(sale_id)
        if not sale_data:
            logger.warning(f"Sale not found: {sale_id}")
            return jsonify({"msg": "Sale not found", "success": False}), 404

        sale = sale_data['sale']

        result = {
            'uuid': str(sale.uuid),
            'sale_qty': sale.sale_qty,
            'discounted_amt': float(sale.discounted_amt),
            'sale_amt': float(sale.sale_amt),
            'sku': sale.sku,
            'item_no': sale.item_no,
            'input_date': sale.input_date.isoformat(),
            'description': sale.description,
            'created_at': sale.created_at.isoformat() if sale.created_at else None,
            'updated_at': sale.updated_at.isoformat() if sale.updated_at else None,
            'gross_sales': sale_data['gross_sales'],
            'nett_sales': sale_data['nett_sales'],
            'tax_rate': sale_data['tax_rate'],
            'tax_amount': sale_data['tax_amount'],
            'nett_sales_after_tax': sale_data['nett_sales_after_tax'],
            'brand': {
                'uuid': str(sale.brand.uuid),
                'id': sale.brand.id,
                'name': sale.brand.name
            },
            'group': {
                'uuid': str(sale.group.uuid),
                'id': sale.group.id,
                'name': sale.group.name
            },
            'division': {
                'uuid': str(sale.division.uuid),
                'name': sale.division.name,
                'alias': sale.division.alias
            },
            'category': {
                'uuid': str(sale.category.uuid),
                'name': sale.category.name
            }
        }

        logger.info(f"Successfully retrieved sale: {sale_id}")
        return jsonify(result), 200

    except Exception as e:
        logger.exception(f"Error retrieving sale {sale_id}: {str(e)}")
        return jsonify({"msg": "An error occurred while retrieving sale", "success": False}), 500


@admin_required()
@jwt_required()
@handle_validation_error
def create():
    current_user_id = get_jwt_identity()
    logger.info(f"Sale creation attempt by admin ID: {current_user_id}")

    try:
        data = sale_schema.load(request.json)

        # Add the current user ID to the sale data
        data['user_id'] = current_user_id

        sale_data, error = SaleService.create(data)

        if error:
            return jsonify({"msg": error, "success": False}), 400

        sale = sale_data['sale']

        # Log activity AFTER the sale is created (moved from before the creation)
        ActivityService.log_activity(
            user_id=current_user_id,
            type="sale_created",
            message=f"New sale {sale.sku or 'item'} added for {sale.brand.name}",
            entity_id=str(sale.uuid),
            entity_type="sale"
        )

        result = {
            'uuid': str(sale.uuid),
            'sale_qty': sale.sale_qty,
            'discounted_amt': float(sale.discounted_amt),
            'sale_amt': float(sale.sale_amt),
            'sku': sale.sku,
            'item_no': sale.item_no,
            'input_date': sale.input_date.isoformat(),
            'description': sale.description,
            'created_at': sale.created_at.isoformat() if sale.created_at else None,
            'updated_at': sale.updated_at.isoformat() if sale.updated_at else None,
            'gross_sales': sale_data['gross_sales'],
            'nett_sales': sale_data['nett_sales'],
            'tax_rate': sale_data['tax_rate'],
            'tax_amount': sale_data['tax_amount'],
            'nett_sales_after_tax': sale_data['nett_sales_after_tax'],
            'brand': {
                'uuid': str(sale.brand.uuid),
                'id': sale.brand.id,
                'name': sale.brand.name
            },
            'group': {
                'uuid': str(sale.group.uuid),
                'id': sale.group.id,
                'name': sale.group.name
            },
            'division': {
                'uuid': str(sale.division.uuid),
                'name': sale.division.name,
                'alias': sale.division.alias
            },
            'category': {
                'uuid': str(sale.category.uuid),
                'name': sale.category.name
            },
            # Add user information
            'user': {
                'uuid': str(sale.user.id) if sale.user else None,
                'name': f"{sale.user.first_name} {sale.user.last_name}" if sale.user and sale.user.first_name and sale.user.last_name else None,
                'username': sale.user.username if sale.user else None
            }
        }

        logger.info(f"Sale created successfully: ID {sale.uuid}")
        return jsonify({"sale": result, "success": True}), 201

    except Exception as e:
        logger.exception(f"Error creating sale: {str(e)}")
        return jsonify({"msg": "An error occurred while creating sale", "success": False}), 500


@admin_required()
@jwt_required()
@handle_validation_error
def update(sale_id):
    current_user_id = get_jwt_identity()
    logger.info(
        f"Sale update attempt by admin ID {current_user_id} for sale ID: {sale_id}")

    try:
        # Use partial=True for updates, so not all fields are required
        data = sale_schema.load(request.json, partial=True)
        sale_data, error = SaleService.update(sale_id, data)

        if error:
            status_code = 404 if error == "Sale not found" else 400
            return jsonify({"msg": error, "success": False}), status_code

        sale = sale_data['sale']

        result = {
            'uuid': str(sale.uuid),
            'sale_qty': sale.sale_qty,
            'discounted_amt': float(sale.discounted_amt),
            'sale_amt': float(sale.sale_amt),
            'sku': sale.sku,
            'item_no': sale.item_no,
            'input_date': sale.input_date.isoformat(),
            'description': sale.description,
            'created_at': sale.created_at.isoformat() if sale.created_at else None,
            'updated_at': sale.updated_at.isoformat() if sale.updated_at else None,
            'gross_sales': sale_data['gross_sales'],
            'nett_sales': sale_data['nett_sales'],
            'tax_rate': sale_data['tax_rate'],
            'tax_amount': sale_data['tax_amount'],
            'nett_sales_after_tax': sale_data['nett_sales_after_tax'],
            'brand': {
                'uuid': str(sale.brand.uuid),
                'id': sale.brand.id,
                'name': sale.brand.name
            },
            'group': {
                'uuid': str(sale.group.uuid),
                'id': sale.group.id,
                'name': sale.group.name
            },
            'division': {
                'uuid': str(sale.division.uuid),
                'name': sale.division.name,
                'alias': sale.division.alias
            },
            'category': {
                'uuid': str(sale.category.uuid),
                'name': sale.category.name
            }
        }

        logger.info(f"Sale updated successfully: ID {sale_id}")
        return jsonify({"sale": result, "success": True}), 200

    except Exception as e:
        logger.exception(f"Error updating sale {sale_id}: {str(e)}")
        return jsonify({"msg": "An error occurred while updating sale", "success": False}), 500


@admin_required()
@jwt_required()
def delete(sale_id):
    current_user_id = get_jwt_identity()
    logger.info(
        f"Sale deletion attempt by admin ID {current_user_id} for sale ID: {sale_id}")

    try:
        success, error = SaleService.delete(sale_id)

        if not success:
            status_code = 404 if error == "Sale not found" else 400
            return jsonify({"msg": error, "success": False}), status_code

        logger.info(f"Sale deleted successfully: ID {sale_id}")
        return jsonify({"msg": "Sale deleted successfully", "success": True}), 200

    except Exception as e:
        logger.exception(f"Error deleting sale {sale_id}: {str(e)}")
        return jsonify({"msg": "An error occurred while deleting sale", "success": False}), 500


@jwt_required()
def get_daily_sales_by_brand():
    current_user_id = get_jwt_identity()
    logger.info(
        f"Daily sales by brand summary requested by user ID: {current_user_id}")

    try:
        # Extract query parameters
        date_str = request.args.get('date')
        year = request.args.get('year', type=int)
        month = request.args.get('month', type=int)
        day = request.args.get('day', type=int)
        brand_id = request.args.get('brand_id')
        group_id = request.args.get('group_id')
        division_id = request.args.get('division_id')
        category_id = request.args.get('category_id')

        # Get daily sales data grouped by brand
        sales_data = SaleService.get_daily_sales_by_brand(
            date_value=date_str, year=year, month=month, day=day,
            brand_id=brand_id, group_id=group_id,
            division_id=division_id, category_id=category_id
        )

        # Add metadata about the comparison method
        response_data = {
            "data": sales_data,
            "meta": {
                "comparison_method": "day_of_week_aligned",
                "description": "Last year's date is calculated as 364 days prior (52 weeks) to maintain day-of-week alignment"
            }
        }

        logger.info(
            f"Successfully retrieved daily sales by brand summary for {sales_data['date']}, compared to {sales_data['last_year_date']} (day-of-week aligned)")
        return jsonify(response_data), 200

    except Exception as e:
        logger.exception(
            f"Error retrieving daily sales by brand summary: {str(e)}")
        return jsonify({"msg": f"An error occurred: {str(e)}", "success": False}), 500


@jwt_required()
def get_mtd_sales_by_brand():
    current_user_id = get_jwt_identity()
    logger.info(
        f"Month-to-date sales by brand summary requested by user ID: {current_user_id}")

    try:
        # Extract query parameters
        date_str = request.args.get('date')
        year = request.args.get('year', type=int)
        month = request.args.get('month', type=int)
        brand_id = request.args.get('brand_id')
        group_id = request.args.get('group_id')
        division_id = request.args.get('division_id')
        category_id = request.args.get('category_id')
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)

        # Get MTD sales data grouped by brand
        sales_data = SaleService.get_mtd_sales_by_brand(
            date_value=date_str, year=year, month=month,
            brand_id=brand_id, group_id=group_id,
            division_id=division_id, category_id=category_id,
            page=page, per_page=per_page
        )

        logger.info(
            f"Successfully retrieved MTD sales by brand summary for {sales_data['month']}")
        return jsonify({"data": sales_data, "success": True}), 200

    except Exception as e:
        logger.exception(
            f"Error retrieving MTD sales by brand summary: {str(e)}")
        return jsonify({"msg": "An error occurred while retrieving MTD sales by brand", "success": False}), 500


@admin_required()
@jwt_required()
def import_sales():
    """Import sales data from uploaded file"""
    current_user_id = get_jwt_identity()
    logger.info(f"Sales import initiated by admin ID: {current_user_id}")

    try:
        # Check if the post request has the file part
        if 'file' not in request.files:
            return jsonify({"msg": "No file part in the request", "success": False}), 400

        file = request.files['file']

        # If the user does not select a file, the browser submits an empty file without filename
        if file.filename == '':
            return jsonify({"msg": "No file selected", "success": False}), 400

        # Check if the file is allowed
        if not file.filename or '.' not in file.filename:
            return jsonify({"msg": "Invalid filename", "success": False}), 400

        extension = file.filename.rsplit('.', 1)[1].lower()
        if extension not in ['csv', 'xlsx', 'xls']:
            return jsonify({"msg": "File type not allowed. Please upload .xlsx, .xls or .csv file", "success": False}), 400

        # Process the import - pass the current user ID
        result = SaleImportExportService.import_sales_from_file(
            file, current_user_id)

        # Return the import results
        response = {
            "success": True,
            "message": f"Import completed: {result['success_count']} records imported successfully, {result['error_count']} failed",
            "details": {
                "total_records": result['total_count'],
                "success_count": result['success_count'],
                "error_count": result['error_count'],
                "errors": result['errors'],
                "has_more_errors": result['has_more_errors']
            }
        }

        logger.info(
            f"Sales import completed: {result['success_count']} successful, {result['error_count']} failed")
        return jsonify(response), 200

    except ValueError as ve:
        logger.error(f"Validation error during sales import: {str(ve)}")
        return jsonify({"msg": str(ve), "success": False}), 400
    except Exception as e:
        logger.exception(f"Error during sales import: {str(e)}")
        return jsonify({"msg": "An error occurred during import", "success": False}), 500


@jwt_required()
def export_sales():
    """Export sales data to Excel or CSV"""
    current_user_id = get_jwt_identity()
    logger.info(f"Sales export requested by user ID: {current_user_id}")

    try:
        # Get format from query parameters
        export_format = request.args.get('format', 'xlsx')
        if export_format not in ['xlsx', 'csv']:
            return jsonify({"msg": "Invalid format. Use 'xlsx' or 'csv'", "success": False}), 400

        # Extract filter parameters
        filters = {
            'search': request.args.get('search'),
            'start_date': request.args.get('start_date'),
            'end_date': request.args.get('end_date'),
            'brand_id': request.args.get('brand_id'),
            'group_id': request.args.get('group_id'),
            'division_id': request.args.get('division_id'),
            'category_id': request.args.get('category_id')
        }

        # Process the export
        export_result = SaleImportExportService.export_sales(
            format=export_format, filters=filters)

        logger.info(
            f"Sales export successful: {export_result['record_count']} records to {export_result['file_path']}")

        response = send_file(
            export_result['file_path'],
            as_attachment=True,
            download_name=export_result['filename'],
            mimetype=export_result['mimetype']
        )

        response.headers['Access-Control-Expose-Headers'] = 'Content-Disposition'

        return response

    except Exception as e:
        logger.exception(f"Error during sales export: {str(e)}")
        return jsonify({"msg": "An error occurred during export", "success": False}), 500


@jwt_required()
def get_import_sample():
    current_user_id = get_jwt_identity()
    logger.info(f"Sample import file requested by user ID: {current_user_id}")

    try:
        sample_result = SaleImportExportService.get_sample_file()

        logger.info(
            f"Sample import file provided: {sample_result['filename']}")

        response = send_file(
            sample_result['file_path'],
            as_attachment=True,
            download_name=sample_result['filename'],
            mimetype=sample_result['mimetype']
        )

        response.headers['Access-Control-Expose-Headers'] = 'Content-Disposition'

        return response

    except Exception as e:
        logger.exception(f"Error providing sample import file: {str(e)}")
        return jsonify({
            "msg": "An error occurred while generating the sample file",
            "success": False
        }), 500


@jwt_required()
def validate_import():
    """Phase 1: Validate sales data from uploaded file"""
    current_user_id = get_jwt_identity()
    logger.info(
        f"Sales import validation initiated by admin ID: {current_user_id}")

    try:
        # Check if the post request has the file part
        if 'file' not in request.files:
            return jsonify({"msg": "No file part in the request", "success": False}), 400

        file = request.files['file']

        # If user doesn't select a file
        if file.filename == '':
            return jsonify({"msg": "No file selected", "success": False}), 400

        # Check if the file is allowed
        if not file.filename or '.' not in file.filename:
            return jsonify({"msg": "Invalid filename", "success": False}), 400

        extension = file.filename.rsplit('.', 1)[1].lower()
        if extension not in ['csv', 'xlsx', 'xls']:
            return jsonify({"msg": "File type not allowed. Please upload .xlsx, .xls or .csv file", "success": False}), 400

        # Process the validation (doesn't save to final database)
        result = SaleImportExportService.validate_sales_from_file(
            file, current_user_id)

        # Return the validation results
        response = {
            "success": True,
            "message": f"Import validation completed: {result['success_count']} records valid, {result['error_count']} failed",
            "details": {
                "import_id": str(result['import_id']),
                "total_records": result['total_count'],
                "success_count": result['success_count'],
                "error_count": result['error_count'],
                "errors": result['errors'],
                "has_more_errors": result['has_more_errors']
            }
        }

        logger.info(
            f"Sales import validation completed: {result['success_count']} valid, {result['error_count']} invalid")
        return jsonify(response), 200

    except ValueError as ve:
        logger.error(f"Validation error during sales import: {str(ve)}")
        return jsonify({"msg": str(ve), "success": False}), 400
    except Exception as e:
        logger.exception(f"Error during sales import validation: {str(e)}")
        return jsonify({"msg": "An error occurred during import validation", "success": False}), 500


@jwt_required()
def confirm_import():
    """Phase 2: Confirm and apply previously validated import data"""
    current_user_id = get_jwt_identity()
    logger.info(
        f"Import confirmation requested by admin ID: {current_user_id}")

    try:
        # Get the import ID from the request
        data = request.get_json()
        if not data or 'import_id' not in data:
            return jsonify({"msg": "Import ID is required", "success": False}), 400

        import_id = data['import_id']

        # Confirm the import
        result = SaleImportExportService.confirm_import(
            import_id, current_user_id)

        if not result['success']:
            return jsonify({"msg": result['error'], "success": False}), 400

        return jsonify({
            "success": True,
            "msg": f"Successfully imported {result['count']} records",
            "imported_count": result['count']
        }), 200

    except Exception as e:
        logger.exception(f"Error confirming import: {str(e)}")
        return jsonify({"msg": f"An error occurred while confirming import: {str(e)}", "success": False}), 500


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

# Add this function to handle bulk deletion


@admin_required()
@jwt_required()
def delete_multiple():
    """Delete multiple sale records"""
    current_user_id = get_jwt_identity()
    logger.info(f"Bulk sale deletion attempt by admin ID {current_user_id}")

    try:
        # Get sale IDs from request
        data = request.get_json()
        if not data or 'sale_ids' not in data:
            return jsonify({
                'success': False,
                'msg': 'No sale IDs provided',
                'error': 'Missing required parameter: sale_ids'
            }), 400

        sale_ids = data.get('sale_ids', [])
        if not sale_ids or not isinstance(sale_ids, list):
            return jsonify({
                'success': False,
                'msg': 'Invalid sale IDs format',
                'error': 'sale_ids must be a non-empty array'
            }), 400

        # Call service to delete multiple sales
        success_count, error_count, errors = SaleService.delete_multiple(
            sale_ids)

        if success_count > 0:
            return jsonify({
                'success': True,
                'msg': f'Successfully deleted {success_count} sales' +
                       (f', {error_count} failed' if error_count > 0 else ''),
                'details': {
                    'success_count': success_count,
                    'error_count': error_count,
                    'errors': errors
                       }
            }), 200
        else:
            return jsonify({
                'success': False,
                'msg': 'Failed to delete sales',
                'error': errors[0] if errors else 'Unknown error occurred'
            }), 400

    except Exception as e:
        logger.exception(f"Error in bulk delete endpoint: {str(e)}")
        return jsonify({
            'success': False,
            'msg': 'An error occurred during bulk deletion',
            'error': str(e)
        }), 500
