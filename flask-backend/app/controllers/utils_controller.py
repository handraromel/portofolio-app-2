from flask import jsonify
from app.utils.route_utils import get_routes
from app.utils.decorators import superadmin_required
from flask_jwt_extended import jwt_required

@jwt_required()
@superadmin_required()
def list_routes():
    routes = get_routes()
    return jsonify(routes), 200