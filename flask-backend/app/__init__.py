from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from config import config
import os

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()


def create_app():
    app = Flask(__name__)

    env = os.environ.get('FLASK_ENV', 'default')
    origins = os.environ.get('ORIGINS_URL')
    app.config.from_object(config[env])

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    app.config['JWT_TOKEN_LOCATION'] = ['headers', 'cookies']

    CORS(app, supports_credentials=True, origins=origins)

    @app.after_request
    def add_security_headers(response):
        if app.config.get('SECURE_HEADERS'):
            for header, value in app.config['SECURE_HEADERS'].items():
                response.headers[header] = value
        return response

    with app.app_context():
        from app import models
        from app.routes import auth, user, recipe, meal_plan, utils

        url_prefix = '/api/v1'
        auth_prefix = url_prefix + '/auth/user'
        user_prefix = url_prefix + '/manage/user'
        recipe_prefix = url_prefix + '/manage/recipe'
        meal_plan_prefix = url_prefix + '/manage/meal-plan'
        utils_prefix = url_prefix + '/utils'

        app.register_blueprint(auth.bp, url_prefix=auth_prefix)
        app.register_blueprint(user.bp, url_prefix=user_prefix)
        app.register_blueprint(recipe.bp, url_prefix=recipe_prefix)
        app.register_blueprint(meal_plan.bp, url_prefix=meal_plan_prefix)
        app.register_blueprint(utils.bp, url_prefix=utils_prefix)

    return app
