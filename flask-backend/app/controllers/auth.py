from flask import jsonify, request, current_app
from flask_jwt_extended import (
    create_access_token, create_refresh_token, jwt_required,
    get_jwt_identity, unset_jwt_cookies, set_access_cookies, set_refresh_cookies
)
from werkzeug.security import generate_password_hash, check_password_hash
from app.models.user import User
from app import db
from app.utils.email_service import send_activation_email
from app.schemas.auth_schemas import RegisterSchema, LoginSchema
from app.utils.decorators import handle_validation_error
import uuid

register_schema = RegisterSchema()
login_schema = LoginSchema()


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

    if User.query.filter((User.username == data['username']) | (User.email == data['email'])).first():
        return jsonify({"msg": "Username or email already exists"}), 400

    hashed_password = generate_password_hash(data['password'])
    verification_token = str(uuid.uuid4())
    new_user = User(
        username=data['username'],
        email=data['email'],
        password=hashed_password,
        first_name=data.get('first_name'),
        last_name=data.get('last_name'),
        role='user',
        is_active=False,
        verification_token=verification_token
    )

    db.session.add(new_user)
    db.session.commit()

    if send_activation_email(new_user):
        return jsonify({"msg": "User created successfully. Please check your email to activate your account."}), 201
    else:
        return jsonify({"msg": "User created successfully, but failed to send activation email. Please contact support."}), 201


@handle_validation_error
def login():
    current_app.logger.debug("Login function called")
    data = login_schema.load(request.json)

    user = User.query.filter_by(username=data['username']).first()

    if user and check_password_hash(user.password, data['password']):
        if not user.is_active:
            return jsonify({"msg": "Account is not activated. Please check your email for the activation link."}), 401

        access_token, refresh_token = create_tokens(user.id)

        resp = jsonify({'login': True})
        set_tokens_cookies(resp, access_token, refresh_token)

        return resp, 200

    return jsonify({"msg": "Invalid username or password"}), 401


def activate_account(token):
    user = User.query.filter_by(verification_token=token).first()
    if not user:
        return jsonify({"msg": "Invalid activation token"}), 400

    user.is_active = True
    user.verification_token = None
    db.session.commit()

    return jsonify({"msg": "Account activated successfully"}), 200


@jwt_required(refresh=True)
def refresh():
    identity = get_jwt_identity()
    access_token = create_access_token(identity=identity)

    resp = jsonify({'refresh': True})
    set_access_cookies(resp, access_token)

    return resp, 200


# @jwt_required()
# def logout():
#     resp = jsonify({'logout': True})
#     unset_jwt_cookies(resp)
#     return resp, 200

@jwt_required()
def logout():
    current_app.logger.debug("Logout function called")
    current_app.logger.debug(f"Request headers: {request.headers}")
    resp = jsonify({'logout': True})
    unset_jwt_cookies(resp)
    current_app.logger.debug("JWT cookies unset")
    return resp, 200


def get_current_user():
    return User.query.get(get_jwt_identity())


@jwt_required()
def protected():
    current_user = get_current_user()
    return jsonify(logged_in_as=current_user.username), 200
