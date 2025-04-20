from app import db
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid


class Activity(db.Model):
    __tablename__ = "activities"

    uuid = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    type = db.Column(db.String(50), nullable=False)
    message = db.Column(db.String(255), nullable=False)
    timestamp = db.Column(db.DateTime, default=func.now())
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey(
        "users.id"), nullable=False)
    entity_id = db.Column(UUID(as_uuid=True), nullable=True)
    entity_type = db.Column(db.String(50), nullable=True)
    meta_data = db.Column(db.JSON, nullable=True)

    # Relationship
    user = db.relationship("User", backref=db.backref("activities", lazy=True))

    def __repr__(self):
        return f"<Activity {self.uuid} - {self.type}>"
