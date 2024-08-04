from functools import wraps
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from marshmallow import ValidationError
from flask import jsonify
from app.models.user import User, UserRole


def superadmin_required():
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            user = User.query.get(user_id)
            if user and not user.is_active:
                return jsonify({"msg": "User is inactive!"}), 403
            if user and user.role == UserRole.superadmin:
                return fn(*args, **kwargs)
            else:
                return jsonify({"msg": "Superadmin access required"}), 403
        return decorator
    return wrapper


def admin_required():
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            user = User.query.get(user_id)
            if user and not user.is_active:
                return jsonify({"msg": "User is inactive!"}), 403
            if user and user.role in [UserRole.superadmin, UserRole.admin]:
                return fn(*args, **kwargs)
            else:
                return jsonify({"msg": "Admin access required"}), 403
        return decorator
    return wrapper


def handle_validation_error(f):
    @wraps(f)
    def decorator(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except ValidationError as err:
            return jsonify({"errors": err.messages}), 400
    return decorator
