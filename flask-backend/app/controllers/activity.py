from flask import jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.activity import ActivityService
import logging

logger = logging.getLogger('app.controllers.activity')


@jwt_required()
def get_recent_activities():
    """
    Get the most recent activities for the dashboard
    """
    current_user_id = get_jwt_identity()
    # Default to 20 instead of 5, but allow up to 100 per request
    limit = min(request.args.get('limit', 20, type=int), 100)

    logger.info(
        f"Recent activities requested by user ID: {current_user_id}, limit: {limit}")

    try:
        activities = ActivityService.get_recent_activities(limit)

        result = {
            'activities': [{
                'id': str(activity.uuid),
                'type': activity.type,
                'message': activity.message,
                'timestamp': activity.timestamp.isoformat(),
                'user': {
                    'id': str(activity.user.id),
                    'name': f"{activity.user.first_name} {activity.user.last_name}",
                    'username': activity.user.username
                },
                'entityId': str(activity.entity_id) if activity.entity_id else None,
                'entityType': activity.entity_type,
                'meta_data': activity.meta_data
            } for activity in activities],
            'success': True
        }

        return jsonify(result), 200
    except Exception as e:
        logger.exception(f"Error retrieving activities: {str(e)}")
        return jsonify({'success': False, 'msg': "Failed to retrieve activities"}), 500
