from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from config import config
import logging
from logging.handlers import RotatingFileHandler
import os

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()


def configure_logging(app):
    if not os.path.exists('logs'):
        os.mkdir('logs')

    file_handler = RotatingFileHandler(
        'logs/app.log', maxBytes=10240, backupCount=10)
    file_formatter = logging.Formatter(
        '%(asctime)s %(levelname)s [%(name)s] %(message)s [in %(pathname)s:%(lineno)d]'
    )
    file_handler.setFormatter(file_formatter)
    file_handler.setLevel(logging.INFO)

    app.logger.addHandler(file_handler)
    app.logger.setLevel(logging.INFO)
    app.logger.info('Application startup')

    # Set up auth logger
    auth_logger = logging.getLogger('app.auth')
    auth_logger.setLevel(logging.INFO)
    auth_logger.addHandler(file_handler)

    # Set up user logger
    user_logger = logging.getLogger('app.user')
    user_logger.setLevel(logging.INFO)
    user_logger.addHandler(file_handler)


def create_app():
    app = Flask(__name__)

    configure_logging(app)

    env = os.environ.get('FLASK_ENV', 'default')
    origins = os.environ.get('PUBLIC_URL')
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
        from app.routes import auth, user, product, tax_config, sale, utils

        url_prefix = '/api/v1'
        auth_prefix = url_prefix + '/auth/user'
        user_prefix = url_prefix + '/manage/user'
        product_prefix = url_prefix + '/manage/product'
        tax_config_prefix = url_prefix + '/manage/tax'
        sales_prefix = url_prefix + '/manage/sales'
        utils_prefix = url_prefix + '/utils'

        app.register_blueprint(auth.bp, url_prefix=auth_prefix)
        app.register_blueprint(user.bp, url_prefix=user_prefix)
        app.register_blueprint(product.bp, url_prefix=product_prefix)
        app.register_blueprint(tax_config.bp, url_prefix=tax_config_prefix)
        app.register_blueprint(sale.bp, url_prefix=sales_prefix)
        app.register_blueprint(utils.bp, url_prefix=utils_prefix)

    return app
