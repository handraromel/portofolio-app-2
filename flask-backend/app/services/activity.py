from app import db
from app.models.activity import Activity
from app.models.user import User
from sqlalchemy import desc
import logging

logger = logging.getLogger('app.services.activity')


class ActivityService:
    @staticmethod
    def log_activity(user_id, type, message, entity_id=None, entity_type=None, metadata=None):
        """
        Log a user activity in the system and maintain only the 5 most recent entries
        """
        try:
            # Create new activity
            activity = Activity(
                user_id=user_id,
                type=type,
                message=message,
                entity_id=entity_id,
                entity_type=entity_type,
                meta_data=metadata
            )
            db.session.add(activity)
            db.session.commit()

            # Get count of activities
            total_activities = Activity.query.count()

            # If more than 5 activities exist, delete the oldest ones
            if total_activities > 5:
                # Get the IDs of all activities except the 5 most recent
                activities_to_delete = Activity.query.order_by(
                    desc(Activity.timestamp)
                ).offset(5).all()

                # Delete these activities
                for old_activity in activities_to_delete:
                    db.session.delete(old_activity)

                db.session.commit()
                logger.info(
                    f"Cleaned up old activities. Kept only 5 most recent.")

            return activity
        except Exception as e:
            db.session.rollback()
            logger.error(f"Failed to log activity: {str(e)}")
            return None

    @staticmethod
    def get_recent_activities(limit=5):
        """Get most recent activities with user information"""
        return (Activity.query
                .join(User, Activity.user_id == User.id)
                .order_by(Activity.timestamp.desc())
                .limit(limit)
                .all())
