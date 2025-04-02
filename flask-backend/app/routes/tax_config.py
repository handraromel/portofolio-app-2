from flask import Blueprint
from app.controllers import tax_config

bp = Blueprint('tax', __name__)

# Tax Configuration routes
bp.route('/all', methods=['GET'])(tax_config.get_all)
bp.route('/<uuid:tax_config_id>', methods=['GET'])(tax_config.get_by_id)
bp.route('/current', methods=['GET'])(tax_config.get_current_tax)
bp.route('/create', methods=['POST'])(tax_config.create)
bp.route('/<uuid:tax_config_id>', methods=['PUT'])(tax_config.update)
bp.route('/<uuid:tax_config_id>', methods=['DELETE'])(tax_config.delete)
