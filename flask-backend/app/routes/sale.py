from flask import Blueprint
from app.controllers import sale

bp = Blueprint('sale', __name__)

# Basic CRUD routes
bp.route('', methods=['GET'])(sale.get_all)
bp.route('/<uuid:sale_id>', methods=['GET'])(sale.get_by_id)
bp.route('/create', methods=['POST'])(sale.create)
bp.route('/<uuid:sale_id>', methods=['PUT'])(sale.update)
bp.route('/<uuid:sale_id>', methods=['DELETE'])(sale.delete)

# Analytics routes
bp.route('/daily', methods=['GET'])(sale.get_daily_sales)
bp.route('/mtd', methods=['GET'])(sale.get_mtd_sales)
