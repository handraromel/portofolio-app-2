from app import db

class Ingredient(db.Model):
    __tablename__ = 'ingredients'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(64), unique=True, nullable=False)

    recipe_ingredients = db.relationship('RecipeIngredient', back_populates='ingredient')

    def __repr__(self):
        return f'<Ingredient {self.name}>'