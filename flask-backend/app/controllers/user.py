from flask import jsonify, request
from flask_jwt_extended import jwt_required
from app import db
from app.models.user import User, UserRole
from app.schemas.user_schemas import UpdateProfileSchema, UpdatePasswordSchema, UpdateRoleSchema, CreateUserSchema
from app.utils.decorators import superadmin_required, admin_required, handle_validation_error
from app.utils.user_to_dict import user_to_dict
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import or_, and_
from datetime import datetime

update_profile_shcema = UpdateProfileSchema()
update_password_schema = UpdatePasswordSchema()
check_password_schema = UpdatePasswordSchema()
update_role_schema = UpdateRoleSchema()
create_user_schema = CreateUserSchema()


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


@admin_required()
@jwt_required()
@handle_validation_error
def create_user():
    data = create_user_schema.load(request.json)

    # Check if username or email already exists
    if User.query.filter(User.username == data['username']).first():
        return jsonify({"msg": "Username already exists"}), 400

    if User.query.filter(User.email == data['email']).first():
        return jsonify({"msg": "Email already exists"}), 400

    # Create new user instance
    new_user = User(
        username=data['username'],
        email=data['email'],
        first_name=data['first_name'],
        last_name=data['last_name'],
        password=generate_password_hash(data['password']),
        role=UserRole[data['role']],
        is_active=False
    )

    try:
        db.session.add(new_user)
        db.session.commit()
        return jsonify(user_to_dict(new_user)), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": "Error creating user", "error": str(e)}), 500


@admin_required()
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
    user.role = UserRole[data.get('role', user.role)]

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


@jwt_required()
@handle_validation_error
def check_current_password(user_id):
    data = check_password_schema.load(request.json)
    user = User.query.get(user_id)

    if not user:
        return jsonify({"msg": "User not found"}), 404

    new_password = data.get('new_password')
    if not new_password:
        return jsonify({"msg": "Password is required"}), 400

    is_same = check_password_hash(user.password, new_password)
    return jsonify({"isSame": is_same}), 200


@admin_required()
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

    if user.is_active:
        return jsonify({"msg": "Cannot delete an active user. Deactivate the user first"}), 400

    try:
        db.session.delete(user)
        db.session.commit()
        return jsonify({"msg": "User deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "msg": "Error deleting user",
            "error": str(e)
        }), 500
