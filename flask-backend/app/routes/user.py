from flask import Blueprint
from app.controllers import user

bp = Blueprint('user', __name__, url_prefix='/manage/user')

bp.route('/all', methods=['GET'])(user.get_all_users)
bp.route('/<uuid:user_id>/update', methods=['PUT'])(user.update_user)
bp.route('/<uuid:user_id>/update_user_password',
         methods=['PUT'])(user.update_user_password)
bp.route('/<uuid:user_id>/activate_user',
         methods=['PUT'])(user.set_user_active)
bp.route('/<uuid:user_id>/change_user_privilege',
         methods=['PUT'])(user.change_user_privilege)
bp.route('/<uuid:user_id>/delete', methods=['DELETE'])(user.delete_user)
