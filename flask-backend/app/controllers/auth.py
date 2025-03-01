import logging
from flask import jsonify, request, make_response
from flask_jwt_extended import (
    create_access_token, create_refresh_token, jwt_required,
    get_jwt_identity, unset_jwt_cookies, set_access_cookies, set_refresh_cookies
)
from werkzeug.security import generate_password_hash, check_password_hash
from app.models.user import User, UserRole
from app import db
from app.utils.email_service import send_activation_email, send_forgot_password_email
from app.schemas.auth_schemas import RegisterSchema, LoginSchema, ForgotPasswordSchema
from app.utils.decorators import handle_validation_error
from app.utils.random_chars import generate_random_password
from app.utils.user_to_dict import user_to_dict
import uuid

logger = logging.getLogger('app.auth')

register_schema = RegisterSchema()
login_schema = LoginSchema()
forgot_password_schema = ForgotPasswordSchema()


def create_tokens(user_id):
    access_token = create_access_token(identity=user_id)
    refresh_token = create_refresh_token(identity=user_id)
    return access_token, refresh_token


def set_tokens_cookies(response, access_token, refresh_token):
    set_access_cookies(response, access_token)
    set_refresh_cookies(response, refresh_token)


@handle_validation_error
def register():
    data = register_schema.load(request.json)

    # Log registration attempt
    logger.info(
        f"Registration attempt for username: {data['username']}, email: {data['email']}")

    try:
        # Check for existing user
        if User.query.filter((User.username == data['username']) | (User.email == data['email'])).first():
            logger.warning(
                f"Registration failed - username or email already exists: {data['username']}, {data['email']}")
            return jsonify({"msg": "Username or email already exists", "success": False}), 400

        # Create new user
        hashed_password = generate_password_hash(data['password'])
        verification_token = str(uuid.uuid4())
        new_user = User(
            username=data['username'],
            email=data['email'],
            first_name=data['first_name'],
            last_name=data['last_name'],
            password=hashed_password,
            role=UserRole.user,
            is_active=False,
            verification_token=verification_token
        )

        db.session.add(new_user)
        db.session.commit()
        logger.info(f"User created successfully: {data['username']}")

        # Send activation email
        if send_activation_email(new_user):
            logger.info(f"Activation email sent to: {data['email']}")
            return jsonify({"msg": "User created successfully. Please check your email to activate your account.", "success": True}), 201
        else:
            logger.error(
                f"Failed to send activation email to: {data['email']}")
            return jsonify({"msg": "User created successfully, but failed to send activation email. Please contact support.", "success": True}), 201

    except Exception as e:
        db.session.rollback()
        logger.exception(
            f"Registration error for {data.get('username')}: {str(e)}")
        return jsonify({"msg": "An error occurred during registration", "success": False}), 500


@handle_validation_error
def login():
    data = login_schema.load(request.json)

    logger.info(f"Login attempt for username: {data['username']}")

    try:
        user = User.query.filter_by(username=data['username']).first()

        if not user:
            logger.warning(
                f"Login failed - username not found: {data['username']}")
            return jsonify({"msg": "Invalid username or password"}), 401

        if not check_password_hash(user.password, data['password']):
            logger.warning(
                f"Login failed - incorrect password for: {data['username']}")
            return jsonify({"msg": "Invalid username or password"}), 401

        if not user.is_active:
            logger.warning(
                f"Login failed - inactive account: {data['username']}")
            return jsonify({"msg": "Account is not activated. Please check your email for the activation link."}), 401

        access_token = create_access_token(identity=user.id)
        refresh_token = create_refresh_token(identity=user.id)

        resp = make_response(jsonify({
            "login": True,
            "msg": "You're now logged in",
            "user": user_to_dict(user)
        }))

        set_access_cookies(resp, access_token)
        set_refresh_cookies(resp, refresh_token)

        logger.info(f"Login successful for: {data['username']}")
        return resp, 200

    except Exception as e:
        logger.exception(f"Login error for {data.get('username')}: {str(e)}")
        return jsonify({"msg": "An error occurred during login", "success": False}), 500


@handle_validation_error
def activate_account(token):
    logger.info(f"Account activation attempt with token: {token}")

    try:
        user = User.query.filter_by(verification_token=token).first()

        if not user:
            logger.warning(f"Activation failed - invalid token: {token}")
            return jsonify({
                "success": False,
                "msg": "Account already activated or activation token is invalid"
            }), 400

        user.is_active = True
        user.verification_token = None
        db.session.commit()

        logger.info(f"Account activated successfully for user ID: {user.id}")
        return jsonify({
            "success": True,
            "msg": "Account activated successfully"
        }), 200

    except Exception as e:
        db.session.rollback()
        logger.exception(f"Activation error with token {token}: {str(e)}")
        return jsonify({
            "success": False,
            "msg": "An error occurred during activation"
        }), 500


@jwt_required(refresh=True)
def refresh():
    identity = get_jwt_identity()

    user = User.query.get(identity)
    if not user or not user.is_active:
        resp = make_response(
            jsonify({
                "logout": True,
                "msg": "Account is inactive. Please contact administrator."
            })
        )
        unset_jwt_cookies(resp)
        return resp, 401

    access_token = create_access_token(identity=identity)
    resp = jsonify({
        'refresh': True,
        'user': user_to_dict(user)
    })
    set_access_cookies(resp, access_token)

    return resp, 200


@jwt_required()
def logout():
    identity = get_jwt_identity()
    logger.info(f"Logout for user ID: {identity}")

    try:
        resp = make_response(
            jsonify({"logout": True, "msg": "You're currently logged out"}))
        unset_jwt_cookies(resp)
        resp.delete_cookie('csrf_access_token')
        resp.delete_cookie('csrf_refresh_token')

        logger.info(f"User ID {identity} logged out successfully")
        return resp, 200

    except Exception as e:
        logger.exception(f"Logout error for user ID {identity}: {str(e)}")
        return jsonify({"msg": "An error occurred during logout"}), 500


@handle_validation_error
def forgot_password():
    data = forgot_password_schema.load(request.json)
    email = data['email']
    logger.info(f"Password reset request for email: {email}")

    try:
        user = User.query.filter_by(email=email).first()
        if not user:
            logger.warning(f"Password reset failed - email not found: {email}")
            return jsonify({"msg": "No user found with that email address"}), 404

        if not user.is_active:
            logger.warning(
                f"Password reset failed - inactive account: {email}")
            return jsonify({"msg": "Account is not activated. Look for your activation email or contact the app administrator."}), 401

        new_password = generate_random_password()
        user.password = generate_password_hash(new_password)
        db.session.commit()

        if send_forgot_password_email(user, new_password):
            logger.info(f"Password reset email sent to: {email}")
            return jsonify({"msg": "New password has been sent to your email"}), 200
        else:
            logger.error(f"Failed to send password reset email to: {email}")
            return jsonify({"msg": "Failed to send email. Please try again later."}), 500

    except Exception as e:
        db.session.rollback()
        logger.exception(f"Password reset error for {email}: {str(e)}")
        return jsonify({"msg": "An error occurred during password reset"}), 500
