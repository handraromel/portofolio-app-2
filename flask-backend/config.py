import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY')
    JWT_TOKEN_LOCATION = ['headers', 'cookies']
    JWT_COOKIE_CSRF_PROTECT = True
    JWT_CSRF_CHECK_FORM = True
    JWT_ACCESS_CSRF_HEADER_NAME = 'X-CSRF-TOKEN'
    JWT_CSRF_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE']
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')

    PUBLIC_URL = os.environ.get('PUBLIC_URL', 'http://localhost:5001')

    EMAIL_USER = os.environ.get('EMAIL_USER')
    EMAIL_PASSWORD = os.environ.get('EMAIL_PASSWORD')
    EMAIL_PORT = int(os.environ.get('EMAIL_PORT', 587))
    EMAIL_SERVICE = os.environ.get('EMAIL_SERVICE')

    JWT_ACCESS_TOKEN_EXPIRES = 3600  # 1 hour
    JWT_REFRESH_TOKEN_EXPIRES = 2592000  # 30 days

    WTF_CSRF_ENABLED = True
    WTF_CSRF_TIME_LIMIT = 3600  # 1 hour


class DevelopmentConfig(Config):
    DEBUG = True
    JWT_COOKIE_SECURE = False
    SESSION_COOKIE_SECURE = False

    PUBLIC_URL = os.environ.get('PUBLIC_URL', 'http://localhost:5001')


class ProductionConfig(Config):
    DEBUG = False

    JWT_COOKIE_SECURE = True
    SESSION_COOKIE_SECURE = True

    JWT_COOKIE_SAMESITE = 'Strict'
    SESSION_COOKIE_SAMESITE = 'Strict'

    WTF_CSRF_SSL_STRICT = True

    SECURE_HEADERS = {
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'SAMEORIGIN',
        'X-XSS-Protection': '1; mode=block',
    }

    PUBLIC_URL = os.environ.get(
        'PUBLIC_URL', 'https://savoryscript.handraromel.website')


config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
