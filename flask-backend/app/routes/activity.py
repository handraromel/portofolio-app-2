from flask import Blueprint
from app.controllers import activity

bp = Blueprint('activity', __name__)

# Get recent activities for dashboard
bp.route('/recent', methods=['GET'])(activity.get_recent_activities)
