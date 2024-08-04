from flask import Blueprint

bp = Blueprint('meal_plan', __name__, url_prefix='/meal-plans')

# Add your meal plan routes here


@bp.route('/', methods=['GET'])
def get_meal_plans():
    return "List of meal plans"

# Add more route handlers as needed
