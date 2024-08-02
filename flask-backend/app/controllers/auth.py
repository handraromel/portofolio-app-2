from flask import jsonify, request
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from app.models.user import User
from app import db
from app.utils.email_service import send_activation_email
from app.schemas.auth_schemas import RegisterSchema, LoginSchema
from marshmallow import ValidationError
import uuid

register_schema = RegisterSchema()
login_schema = LoginSchema()

def register():
    try:
        data = register_schema.load(request.json)
    except ValidationError as err:
        return jsonify(err.messages), 400
    
    if User.query.filter_by(username=data['username']).first():
        return jsonify({"msg": "Username already exists"}), 400
    
    if User.query.filter_by(email=data['email']).first():
        return jsonify({"msg": "Email already exists"}), 400
    
    hashed_password = generate_password_hash(data['password'])
    verification_token = str(uuid.uuid4())
    new_user = User(
        username=data['username'], 
        email=data['email'], 
        password=hashed_password, 
        first_name=data.get('first_name'),
        last_name=data.get('last_name'),
        role='user', 
        is_active=0,
        verification_token=verification_token
    )
    
    db.session.add(new_user)
    db.session.commit()
    
    if send_activation_email(new_user):
        return jsonify({"msg": "User created successfully. Please check your email to activate your account."}), 201
    else:
        return jsonify({"msg": "User created successfully, but failed to send activation email. Please contact support."}), 201

def login():
    try:
        data = login_schema.load(request.json)
    except ValidationError as err:
        return jsonify(err.messages), 400

    user = User.query.filter_by(username=data['username']).first()
    
    if user and check_password_hash(user.password, data['password']):
        if not user.is_active:
            return jsonify({"msg": "Account is not activated. Please check your email for the activation link."}), 401
        
        access_token = create_access_token(identity=user.id)
        refresh_token = create_refresh_token(identity=user.id)
        
        resp = jsonify({'login': True})
        resp.set_cookie('access_token_cookie', access_token, httponly=True, secure=True)
        resp.set_cookie('refresh_token_cookie', refresh_token, httponly=True, secure=True)
        
        return resp, 200
    
    return jsonify({"msg": "Invalid username or password"}), 401

def activate_account(token):
    user = User.query.filter_by(verification_token=token).first()
    if not user:
        return jsonify({"msg": "Invalid activation token"}), 400
    
    user.is_active = 1
    user.verification_token = None
    db.session.commit()
    
    return jsonify({"msg": "Account activated successfully"}), 200

@jwt_required(refresh=True)
def refresh():
    identity = get_jwt_identity()
    access_token = create_access_token(identity=identity)
    
    resp = jsonify({'refresh': True})
    resp.set_cookie('access_token_cookie', access_token, httponly=True, secure=True)
    
    return resp, 200

@jwt_required()
def logout():
    resp = jsonify({'logout': True})
    resp.set_cookie('access_token_cookie', '', expires=0)
    resp.set_cookie('refresh_token_cookie', '', expires=0)
    return resp, 200