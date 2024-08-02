from flask import Blueprint
from app.controllers import utils_controller

bp = Blueprint('utils', __name__, url_prefix='/utils')

bp.route('/routes', methods=['GET'])(utils_controller.list_routes)