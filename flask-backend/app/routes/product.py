from flask import Blueprint
from app.controllers.product import brand, group, division, category

bp = Blueprint('product', __name__)

# Brand routes
bp.route('/brands', methods=['GET'], endpoint='brand_get_all')(brand.get_all)
bp.route('/brands/<uuid:brand_id>',
         methods=['GET'], endpoint='brand_get_by_id')(brand.get_by_id)
bp.route('/brands', methods=['POST'], endpoint='brand_create')(brand.create)
bp.route('/brands/<uuid:brand_id>',
         methods=['PUT'], endpoint='brand_update')(brand.update)
bp.route('/brands/<uuid:brand_id>',
         methods=['DELETE'], endpoint='brand_delete')(brand.delete)

# Group routes
bp.route('/groups', methods=['GET'], endpoint='group_get_all')(group.get_all)
bp.route('/groups/<uuid:group_id>',
         methods=['GET'], endpoint='group_get_by_id')(group.get_by_id)
bp.route('/groups', methods=['POST'], endpoint='group_create')(group.create)
bp.route('/groups/<uuid:group_id>',
         methods=['PUT'], endpoint='group_update')(group.update)
bp.route('/groups/<uuid:group_id>',
         methods=['DELETE'], endpoint='group_delete')(group.delete)

# Division routes
bp.route('/divisions', methods=['GET'],
         endpoint='division_get_all')(division.get_all)
bp.route('/divisions/<uuid:division_id>',
         methods=['GET'], endpoint='division_get_by_id')(division.get_by_id)
bp.route('/divisions', methods=['POST'],
         endpoint='division_create')(division.create)
bp.route('/divisions/<uuid:division_id>',
         methods=['PUT'], endpoint='division_update')(division.update)
bp.route('/divisions/<uuid:division_id>',
         methods=['DELETE'], endpoint='division_delete')(division.delete)

# Category routes
bp.route('/categories', methods=['GET'],
         endpoint='category_get_all')(category.get_all)
bp.route('/categories/<uuid:category_id>',
         methods=['GET'], endpoint='category_get_by_id')(category.get_by_id)
bp.route('/categories', methods=['POST'],
         endpoint='category_create')(category.create)
bp.route('/categories/<uuid:category_id>',
         methods=['PUT'], endpoint='category_update')(category.update)
bp.route('/categories/<uuid:category_id>',
         methods=['DELETE'], endpoint='category_delete')(category.delete)
