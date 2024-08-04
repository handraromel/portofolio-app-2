from flask import Blueprint
from app.controllers import auth

bp = Blueprint('auth', __name__, url_prefix='/user/auth')

bp.route('/register', methods=['POST'])(auth.register)
bp.route('/login', methods=['POST'])(auth.login)
bp.route('/refresh', methods=['POST'])(auth.refresh)
bp.route('/logout', methods=['POST'])(auth.logout)
bp.route('/activate/<token>', methods=['GET'])(auth.activate_account)
bp.route('/forgot-password', methods=['POST'])(auth.forgot_password)
