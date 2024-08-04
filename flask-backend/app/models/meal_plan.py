from app import db
from sqlalchemy.dialects.postgresql import UUID
import enum


class MealType(enum.Enum):
    breakfast = 'breakfast'
    lunch = 'lunch'
    dinner = 'dinner'
    snack = 'snack'


class MealPlan(db.Model):
    __tablename__ = 'meal_plans'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey(
        'users.id'), nullable=False)
    name = db.Column(db.String(128), nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)

    user = db.relationship('User', back_populates='meal_plans')
    meal_plan_recipes = db.relationship(
        'MealPlanRecipe', back_populates='meal_plan', cascade='all, delete-orphan')

    def __repr__(self):
        return f'<MealPlan {self.name}>'


class MealPlanRecipe(db.Model):
    __tablename__ = 'meal_plan_recipes'

    id = db.Column(db.Integer, primary_key=True)
    meal_plan_id = db.Column(db.Integer, db.ForeignKey(
        'meal_plans.id'), nullable=False)
    recipe_id = db.Column(db.Integer, db.ForeignKey(
        'recipes.id'), nullable=False)
    day = db.Column(db.Integer, nullable=False)  # 1-7 for days of the week
    meal_type = db.Column(db.Enum(MealType), nullable=False)

    meal_plan = db.relationship('MealPlan', back_populates='meal_plan_recipes')
    recipe = db.relationship('Recipe', back_populates='meal_plan_recipes')

    def __repr__(self):
        return f'<MealPlanRecipe {self.recipe_id} for MealPlan {self.meal_plan_id}>'
