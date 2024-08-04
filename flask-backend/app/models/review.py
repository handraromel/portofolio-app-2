from app import db
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime, timezone


class Review(db.Model):
    __tablename__ = 'reviews'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey(
        'users.id'), nullable=False)
    recipe_id = db.Column(db.Integer, db.ForeignKey(
        'recipes.id'), nullable=False)
    rating = db.Column(db.Integer, nullable=False)
    comment = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.now(timezone.utc))

    user = db.relationship('User', back_populates='reviews')
    recipe = db.relationship('Recipe', back_populates='reviews')

    def __repr__(self):
        return f'<Review {self.id} for Recipe {self.recipe_id}>'
