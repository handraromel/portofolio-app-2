import logging
from flask import jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.sale import SaleService
from app.schemas.sale_schemas import SaleSchema
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
        sale_data, error = SaleService.create(data)

        if error:
            return jsonify({"msg": error, "success": False}), 400

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
def get_daily_sales():
    current_user_id = get_jwt_identity()
    logger.info(f"Daily sales summary requested by user ID: {current_user_id}")

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

        # Get daily sales data
        sales_data = SaleService.get_daily_sales(
            date_value=date_str, year=year, month=month, day=day,
            brand_id=brand_id, group_id=group_id,
            division_id=division_id, category_id=category_id
        )

        logger.info(
            f"Successfully retrieved daily sales summary for {sales_data['date']}")
        return jsonify(sales_data), 200

    except Exception as e:
        logger.exception(f"Error retrieving daily sales summary: {str(e)}")
        return jsonify({"msg": "An error occurred while retrieving daily sales", "success": False}), 500


@jwt_required()
def get_mtd_sales():
    current_user_id = get_jwt_identity()
    logger.info(
        f"Month-to-date sales summary requested by user ID: {current_user_id}")

    try:
        # Extract query parameters
        date_str = request.args.get('date')
        year = request.args.get('year', type=int)
        month = request.args.get('month', type=int)
        brand_id = request.args.get('brand_id')
        group_id = request.args.get('group_id')
        division_id = request.args.get('division_id')
        category_id = request.args.get('category_id')

        # Get MTD sales data
        sales_data = SaleService.get_mtd_sales(
            date_value=date_str, year=year, month=month,
            brand_id=brand_id, group_id=group_id,
            division_id=division_id, category_id=category_id
        )

        logger.info(
            f"Successfully retrieved MTD sales summary for {sales_data['month']}")
        return jsonify(sales_data), 200

    except Exception as e:
        logger.exception(f"Error retrieving MTD sales summary: {str(e)}")
        return jsonify({"msg": "An error occurred while retrieving MTD sales", "success": False}), 500
