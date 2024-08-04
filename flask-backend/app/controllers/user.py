from flask import jsonify, request
from flask_jwt_extended import jwt_required
from app.models.user import User, UserRole
from app.schemas.user_schemas import UpdateProfileSchema, UpdatePasswordSchema, UpdateRoleSchema
from app.utils.decorators import superadmin_required, admin_required, handle_validation_error
from app import db
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import or_, and_
from datetime import datetime

update_profile_shcema = UpdateProfileSchema()
update_password_schema = UpdatePasswordSchema()
update_role_schema = UpdateRoleSchema()


@admin_required()
@jwt_required()
def get_all_users():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 5, type=int)
    search = request.args.get('search', '')
    is_active = request.args.get('is_active')
    role = request.args.get('role')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    query = User.query

    if search:
        query = query.filter(or_(
            User.username.ilike(f'%{search}%'),
            User.email.ilike(f'%{search}%'),
            User.first_name.ilike(f'%{search}%'),
            User.last_name.ilike(f'%{search}%')
        ))

    if is_active is not None:
        query = query.filter(User.is_active == (is_active.lower() == 'true'))

    if role:
        query = query.filter(User.role == UserRole[role])

    if start_date and end_date:
        query = query.filter(and_(
            User.created_at >= datetime.strptime(start_date, '%Y-%m-%d'),
            User.created_at <= datetime.strptime(end_date, '%Y-%m-%d')
        ))

    users = query.order_by(User.role.desc(), User.created_at.desc()).paginate(
        page=page, per_page=per_page)

    return jsonify({
        'users': [user_to_dict(user) for user in users.items],
        'total': users.total,
        'pages': users.pages,
        'current_page': users.page
    }), 200


@jwt_required()
@handle_validation_error
def update_user(user_id):
    data = update_profile_shcema.load(request.json)
    user = User.query.get(user_id)
    if not user:
        return jsonify({"msg": "User not found"}), 404

    user.username = data.get('username', user.username)
    user.email = data.get('email', user.email)
    user.first_name = data.get('first_name', user.first_name)
    user.last_name = data.get('last_name', user.last_name)

    db.session.commit()
    return jsonify(user_to_dict(user)), 200


@jwt_required()
@handle_validation_error
def update_user_password(user_id):
    data = update_password_schema.load(request.json)
    user = User.query.get(user_id)
    if not user:
        return jsonify({"msg": "User not found"}), 404

    new_password = data.get('new_password')
    if not new_password:
        return jsonify({"msg": "New password is required"}), 400

    if check_password_hash(user.password, new_password):
        return jsonify({"msg": "New password cannot be the same as the current password"}), 400

    user.password = generate_password_hash(new_password)
    db.session.commit()
    return jsonify({"msg": "Password updated successfully"}), 200


@superadmin_required()
@jwt_required()
def set_user_active(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"msg": "User not found"}), 404

    user.is_active = not user.is_active
    user.verification_token = None
    db.session.commit()
    return jsonify({"msg": f"User is now {'active' if user.is_active else 'inactive'}"}), 200


@superadmin_required()
@jwt_required()
def change_user_privilege(user_id):
    data = update_role_schema.load(request.json)
    user = User.query.get(user_id)
    if not user:
        return jsonify({"msg": "User not found"}), 404

    new_role = data.get('new_role')
    if new_role not in ['admin', 'user']:
        return jsonify({"msg": "Invalid role. Must be 'admin' or 'user'"}), 400

    user.role = UserRole[new_role]
    db.session.commit()
    return jsonify({"msg": f"User role changed to {new_role}"}), 200


@superadmin_required()
@jwt_required()
def delete_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"msg": "User not found"}), 404

    if user.role == UserRole.superadmin:
        return jsonify({"msg": "Deleting a superadmin is prohibited"}), 401

    db.session.delete(user)
    db.session.commit()
    return jsonify({"msg": "User deleted successfully"}), 200


def user_to_dict(user):
    return {
        'username': user.username,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'role': user.role.value,
        'is_active': user.is_active,
        'created_at': user.created_at.isoformat(),
        'updated_at': user.updated_at.isoformat()
    }
