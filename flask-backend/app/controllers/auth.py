from flask import jsonify, request
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from app.models.user import User
from app import db

def register():
    data = request.get_json()
    
    if User.query.filter_by(username=data['username']).first():
        return jsonify({"msg": "Username already exists"}), 400
    
    if User.query.filter_by(email=data['email']).first():
        return jsonify({"msg": "Email already exists"}), 400
    
    hashed_password = generate_password_hash(data['password'])
    new_user = User(username=data['username'], email=data['email'], password=hashed_password, role='user')
    
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({"msg": "User created successfully"}), 201

def login():
    data = request.get_json()
    user = User.query.filter_by(username=data['username']).first()
    
    if user and check_password_hash(user.password, data['password']):
        access_token = create_access_token(identity=user.id)
        refresh_token = create_refresh_token(identity=user.id)
        
        resp = jsonify({'login': True})
        resp.set_cookie('access_token_cookie', access_token, httponly=True, secure=True)
        resp.set_cookie('refresh_token_cookie', refresh_token, httponly=True, secure=True)
        
        return resp, 200
    
    return jsonify({"msg": "Bad username or password"}), 401

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