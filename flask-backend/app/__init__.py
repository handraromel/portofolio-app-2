from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from config import config
import os

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()

def create_app():
    app = Flask(__name__)
    
    env = os.environ.get('FLASK_ENV', 'default')
    app.config.from_object(config[env])

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    app.config['JWT_TOKEN_LOCATION'] = ['headers', 'cookies']

    from app.routes import auth, recipe, meal_plan, utils
    app.register_blueprint(auth.bp)
    app.register_blueprint(recipe.bp)
    app.register_blueprint(meal_plan.bp)
    app.register_blueprint(utils.bp)

    return app

from app import models
