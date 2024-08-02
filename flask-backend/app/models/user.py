from app import db
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime, timezone
import uuid
import enum

class UserRole(enum.Enum):
    superadmin = 'superadmin'
    admin = 'admin'
    user = 'user'

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = db.Column(db.String(64), unique=True, nullable=False)
    password = db.Column(db.String(256), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    first_name = db.Column(db.String(64))
    last_name = db.Column(db.String(64))
    role = db.Column(db.Enum(UserRole, name='user_roles'), nullable=False, default=UserRole.user)
    is_active = db.Column(db.Integer, default=0)
    verification_token = db.Column(db.String(128))
    created_at = db.Column(db.DateTime, default=datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc))

    recipes = db.relationship('Recipe', back_populates='user', lazy='dynamic')
    reviews = db.relationship('Review', back_populates='user', lazy='dynamic')
    meal_plans = db.relationship('MealPlan', back_populates='user', lazy='dynamic')

    def __repr__(self):
        return f'<User {self.username}>'