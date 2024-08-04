from app import db
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime, timezone


class Recipe(db.Model):
    __tablename__ = 'recipes'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey(
        'users.id'), nullable=False)
    title = db.Column(db.String(128), nullable=False)
    description = db.Column(db.Text)
    instructions = db.Column(db.Text, nullable=False)
    prep_time = db.Column(db.Integer)  # in minutes
    cook_time = db.Column(db.Integer)  # in minutes
    servings = db.Column(db.Integer)
    cuisine = db.Column(db.String(64))
    created_at = db.Column(db.DateTime, default=datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=datetime.now(
        timezone.utc), onupdate=datetime.now(timezone.utc))

    user = db.relationship('User', back_populates='recipes')
    ingredients = db.relationship(
        'RecipeIngredient', back_populates='recipe', cascade='all, delete-orphan')
    reviews = db.relationship(
        'Review', back_populates='recipe', cascade='all, delete-orphan')
    nutritional_info = db.relationship(
        'NutritionalInfo', back_populates='recipe', uselist=False, cascade='all, delete-orphan')
    meal_plan_recipes = db.relationship(
        'MealPlanRecipe', back_populates='recipe')

    def __repr__(self):
        return f'<Recipe {self.title}>'


class RecipeIngredient(db.Model):
    __tablename__ = 'recipe_ingredients'

    id = db.Column(db.Integer, primary_key=True)
    recipe_id = db.Column(db.Integer, db.ForeignKey(
        'recipes.id'), nullable=False)
    ingredient_id = db.Column(db.Integer, db.ForeignKey(
        'ingredients.id'), nullable=False)
    quantity = db.Column(db.Float)
    unit = db.Column(db.String(32))

    recipe = db.relationship('Recipe', back_populates='ingredients')
    ingredient = db.relationship(
        'Ingredient', back_populates='recipe_ingredients')

    def __repr__(self):
        return f'<RecipeIngredient {self.ingredient.name} for Recipe {self.recipe_id}>'
