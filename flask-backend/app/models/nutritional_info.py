from app import db


class NutritionalInfo(db.Model):
    __tablename__ = 'nutritional_info'

    id = db.Column(db.Integer, primary_key=True)
    recipe_id = db.Column(db.Integer, db.ForeignKey(
        'recipes.id'), nullable=False, unique=True)
    calories = db.Column(db.Integer)
    protein = db.Column(db.Float)
    carbohydrates = db.Column(db.Float)
    fat = db.Column(db.Float)
    fiber = db.Column(db.Float)
    sugar = db.Column(db.Float)

    recipe = db.relationship('Recipe', back_populates='nutritional_info')

    def __repr__(self):
        return f'<NutritionalInfo for Recipe {self.recipe_id}>'
