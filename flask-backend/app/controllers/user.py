import logging
from flask import jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User, UserRole
from app.schemas.user_schemas import UpdateProfileSchema, UpdatePasswordSchema, UpdateRoleSchema, CreateUserSchema
from app.utils.decorators import superadmin_required, admin_required, handle_validation_error
from app.utils.user_to_dict import user_to_dict
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import or_, and_
from datetime import datetime

logger = logging.getLogger('app.user')

update_profile_schema = UpdateProfileSchema()
update_password_schema = UpdatePasswordSchema()
check_password_schema = UpdatePasswordSchema()
update_role_schema = UpdateRoleSchema()
create_user_schema = CreateUserSchema()


@admin_required()
@jwt_required()
def get_all_users():
    current_user_id = get_jwt_identity()
    logger.info(f"User listing requested by user ID: {current_user_id}")

    try:
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
            logger.debug(f"Filtering users with search term: {search}")

        if is_active is not None:
            is_active_bool = is_active.lower() == 'true'
            query = query.filter(User.is_active == is_active_bool)
            logger.debug(f"Filtering users by active status: {is_active_bool}")

        if role:
            query = query.filter(User.role == UserRole[role])
            logger.debug(f"Filtering users by role: {role}")

        if start_date and end_date:
            start = datetime.strptime(start_date, '%Y-%m-%d')
            end = datetime.strptime(end_date, '%Y-%m-%d')
            query = query.filter(and_(
                User.created_at >= start,
                User.created_at <= end
            ))
            logger.debug(
                f"Filtering users by date range: {start_date} to {end_date}")

        users = query.order_by(User.role.desc(), User.created_at.desc()).paginate(
            page=page, per_page=per_page)

        logger.info(
            f"Retrieved {len(users.items)} users (page {page}/{users.pages})")
        return jsonify({
            'users': [user_to_dict(user) for user in users.items],
            'total': users.total,
            'pages': users.pages,
            'current_page': users.page
        }), 200

    except Exception as e:
        logger.exception(f"Error retrieving users: {str(e)}")
        return jsonify({"msg": "An error occurred while retrieving users", "success": False}), 500


@jwt_required()
def get_user_by_id(user_id):
    current_user_id = get_jwt_identity()
    logger.info(
        f"User ID {current_user_id} requesting details for user ID: {user_id}")

    try:
        user = User.query.get(user_id)
        if not user:
            logger.warning(f"User not found: {user_id}")
            return jsonify({"msg": "User not found", "success": False}), 404

        logger.info(f"Successfully retrieved user: {user_id}")
        return jsonify(user_to_dict(user)), 200

    except Exception as e:
        logger.exception(f"Error retrieving user {user_id}: {str(e)}")
        return jsonify({"msg": "An error occurred while retrieving user", "success": False}), 500


@admin_required()
@jwt_required()
@handle_validation_error
def create_user():
    current_user_id = get_jwt_identity()
    logger.info(f"User creation attempt by admin ID: {current_user_id}")

    try:
        data = create_user_schema.load(request.json)

        # Check if username or email already exists
        if User.query.filter(User.username == data['username']).first():
            logger.warning(
                f"Creation failed - username already exists: {data['username']}")
            return jsonify({"msg": "Username already exists", "success": False}), 400

        if User.query.filter(User.email == data['email']).first():
            logger.warning(
                f"Creation failed - email already exists: {data['email']}")
            return jsonify({"msg": "Email already exists", "success": False}), 400

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

        db.session.add(new_user)
        db.session.commit()

        logger.info(
            f"User created successfully: ID {new_user.id}, username {data['username']}")
        return jsonify({"user": user_to_dict(new_user), "success": True}), 201

    except Exception as e:
        db.session.rollback()
        logger.exception(f"Error creating user: {str(e)}")
        return jsonify({"msg": "An error occurred while creating user", "success": False}), 500


@jwt_required()
@handle_validation_error
def update_user(user_id):
    current_user_id = get_jwt_identity()
    logger.info(
        f"User update attempt by user ID {current_user_id} for user ID: {user_id}")

    try:
        data = update_profile_schema.load(request.json)
        user = User.query.get(user_id)

        if not user:
            logger.warning(f"Update failed - user not found: {user_id}")
            return jsonify({"msg": "User not found", "success": False}), 404

        # Check if updated username or email already exists (if changed)
        if 'username' in data and data['username'] != user.username:
            if User.query.filter(User.username == data['username']).first():
                logger.warning(
                    f"Update failed - username already exists: {data['username']}")
                return jsonify({"msg": "Username already exists", "success": False}), 400

        if 'email' in data and data['email'] != user.email:
            if User.query.filter(User.email == data['email']).first():
                logger.warning(
                    f"Update failed - email already exists: {data['email']}")
                return jsonify({"msg": "Email already exists", "success": False}), 400

        user.username = data.get('username', user.username)
        user.email = data.get('email', user.email)
        user.first_name = data.get('first_name', user.first_name)
        user.last_name = data.get('last_name', user.last_name)
        user.role = UserRole[data.get('role', user.role)]

        db.session.commit()

        logger.info(f"User updated successfully: ID {user_id}")
        return jsonify({"user": user_to_dict(user), "success": True}), 200

    except Exception as e:
        db.session.rollback()
        logger.exception(f"Error updating user {user_id}: {str(e)}")
        return jsonify({"msg": "An error occurred while updating user", "success": False}), 500


@jwt_required()
@handle_validation_error
def update_user_password(user_id):
    current_user_id = get_jwt_identity()
    logger.info(
        f"Password update attempt by user ID {current_user_id} for user ID: {user_id}")

    try:
        data = update_password_schema.load(request.json)
        user = User.query.get(user_id)

        if not user:
            logger.warning(
                f"Password update failed - user not found: {user_id}")
            return jsonify({"msg": "User not found", "success": False}), 404

        new_password = data.get('new_password')
        if not new_password:
            logger.warning(
                f"Password update failed - new password missing: {user_id}")
            return jsonify({"msg": "New password is required", "success": False}), 400

        if check_password_hash(user.password, new_password):
            logger.warning(
                f"Password update failed - same as current password: {user_id}")
            return jsonify({"msg": "New password cannot be the same as the current password", "success": False}), 400

        user.password = generate_password_hash(new_password)
        db.session.commit()

        logger.info(f"Password updated successfully for user ID: {user_id}")
        return jsonify({"msg": "Password updated successfully", "success": True}), 200

    except Exception as e:
        db.session.rollback()
        logger.exception(
            f"Error updating password for user {user_id}: {str(e)}")
        return jsonify({"msg": "An error occurred while updating password", "success": False}), 500


@jwt_required()
@handle_validation_error
def check_current_password(user_id):
    current_user_id = get_jwt_identity()
    logger.info(
        f"Password check attempt by user ID {current_user_id} for user ID: {user_id}")

    try:
        data = check_password_schema.load(request.json)
        user = User.query.get(user_id)

        if not user:
            logger.warning(
                f"Password check failed - user not found: {user_id}")
            return jsonify({"msg": "User not found", "success": False}), 404

        new_password = data.get('new_password')
        if not new_password:
            logger.warning(
                f"Password check failed - password missing: {user_id}")
            return jsonify({"msg": "Password is required", "success": False}), 400

        is_same = check_password_hash(user.password, new_password)
        logger.info(
            f"Password check completed for user ID {user_id}: match={is_same}")
        return jsonify({"isSame": is_same, "success": True}), 200

    except Exception as e:
        logger.exception(
            f"Error checking password for user {user_id}: {str(e)}")
        return jsonify({"msg": "An error occurred while checking password", "success": False}), 500


@admin_required()
@jwt_required()
def set_user_active(user_id):
    current_user_id = get_jwt_identity()
    logger.info(
        f"Active status change attempt by admin ID {current_user_id} for user ID: {user_id}")

    try:
        user = User.query.get(user_id)
        if not user:
            logger.warning(
                f"Active status change failed - user not found: {user_id}")
            return jsonify({"msg": "User not found", "success": False}), 404

        # Prevent self-deactivation
        if str(user_id) == str(current_user_id) and user.is_active:
            logger.warning(
                f"Active status change failed - attempt to deactivate self is prohibited: {user_id}")
            return jsonify({"msg": "You cannot deactivate your own account", "success": False}), 400

        new_status = not user.is_active
        user.is_active = new_status
        user.verification_token = None
        db.session.commit()

        status_text = "active" if new_status else "inactive"
        logger.info(f"User ID {user_id} status changed to {status_text}")
        return jsonify({
            "msg": f"User is now {status_text}",
            "is_active": new_status,
            "success": True
        }), 200

    except Exception as e:
        db.session.rollback()
        logger.exception(
            f"Error changing active status for user {user_id}: {str(e)}")
        return jsonify({"msg": "An error occurred while changing user status", "success": False}), 500


@superadmin_required()
@jwt_required()
def change_user_privilege(user_id):
    current_user_id = get_jwt_identity()
    logger.info(
        f"Privilege change attempt by superadmin ID {current_user_id} for user ID: {user_id}")

    try:
        data = update_role_schema.load(request.json)
        user = User.query.get(user_id)

        if not user:
            logger.warning(
                f"Privilege change failed - user not found: {user_id}")
            return jsonify({"msg": "User not found", "success": False}), 404

        new_role = data.get('new_role')
        if new_role not in ['admin', 'user']:
            logger.warning(
                f"Privilege change failed - invalid role: {new_role}")
            return jsonify({"msg": "Invalid role. Must be 'admin' or 'user'", "success": False}), 400

        # Prevent changing own role
        if str(user_id) == str(current_user_id):
            logger.warning(
                f"Privilege change failed - attempt to change own role is prohibited: {user_id}")
            return jsonify({"msg": "You cannot change your own role", "success": False}), 400

        user.role = UserRole[new_role]
        db.session.commit()

        logger.info(f"User ID {user_id} role changed to {new_role}")
        return jsonify({"msg": f"User role changed to {new_role}", "success": True}), 200

    except Exception as e:
        db.session.rollback()
        logger.exception(
            f"Error changing privilege for user {user_id}: {str(e)}")
        return jsonify({"msg": "An error occurred while changing user privilege", "success": False}), 500


@superadmin_required()
@jwt_required()
def delete_user(user_id):
    current_user_id = get_jwt_identity()
    logger.info(
        f"User deletion attempt by superadmin ID {current_user_id} for user ID: {user_id}")

    try:
        user = User.query.get(user_id)
        if not user:
            logger.warning(f"Deletion failed - user not found: {user_id}")
            return jsonify({"msg": "User not found", "success": False}), 404

        if user.role == UserRole.superadmin:
            logger.warning(
                f"Deletion failed - attempt to delete a superadmin: {user_id}")
            return jsonify({"msg": "Deleting a superadmin is prohibited", "success": False}), 403

        if user.is_active:
            logger.warning(
                f"Deletion failed - user is still active: {user_id}")
            return jsonify({"msg": "Cannot delete an active user. Deactivate the user first", "success": False}), 400

        # Store username for logging before deletion
        username = user.username

        db.session.delete(user)
        db.session.commit()

        logger.info(
            f"User deleted successfully: ID {user_id}, username {username}")
        return jsonify({"msg": "User deleted successfully", "success": True}), 200

    except Exception as e:
        db.session.rollback()
        logger.exception(f"Error deleting user {user_id}: {str(e)}")
        return jsonify({"msg": "An error occurred while deleting user", "success": False}), 500
