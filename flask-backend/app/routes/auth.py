from flask import Blueprint
from app.controllers import auth

bp = Blueprint('auth', __name__, url_prefix='/auth')

bp.route('/register', methods=['POST'])(auth.register)
bp.route('/login', methods=['POST'])(auth.login)
bp.route('/refresh', methods=['POST'])(auth.refresh)
bp.route('/logout', methods=['POST'])(auth.logout)