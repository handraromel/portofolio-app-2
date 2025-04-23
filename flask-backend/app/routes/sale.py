from flask import Blueprint
from app.controllers import sale

bp = Blueprint('sale', __name__)

# Basic CRUD routes
bp.route('', methods=['GET'])(sale.get_all)
bp.route('/<uuid:sale_id>', methods=['GET'])(sale.get_by_id)
bp.route('/create', methods=['POST'])(sale.create)
bp.route('/<uuid:sale_id>', methods=['PUT'])(sale.update)
bp.route('/<uuid:sale_id>', methods=['DELETE'])(sale.delete)
bp.route('/delete-multiple', methods=['POST'])(sale.delete_multiple)

# Brand-based analytics routes
bp.route('/daily/by-brand', methods=['GET'])(sale.get_daily_sales_by_brand)
bp.route('/mtd/by-brand', methods=['GET'])(sale.get_mtd_sales_by_brand)

# Import/Export routes
bp.route('/import', methods=['POST'])(sale.validate_import)
bp.route('/import/confirm', methods=['POST'])(sale.confirm_import)
bp.route('/import/cancel', methods=['POST'])(sale.cancel_import)
bp.route('/export', methods=['GET'])(sale.export_sales)
bp.route('/import/sample', methods=['GET'])(sale.get_import_sample)
bp.route('/import/incremental/start',
         methods=['POST'])(sale.start_incremental_import)
bp.route('/import/incremental/next', methods=['POST'])(sale.import_next_record)
bp.route('/import/incremental/progress',
         methods=['GET'])(sale.get_import_progress)
bp.route('/import/incremental/finish',
         methods=['POST'])(sale.finish_incremental_import)
