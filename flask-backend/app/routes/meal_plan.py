from flask import Blueprint

bp = Blueprint('recipe', __name__)

# Add your recipe routes here


@bp.route('/', methods=['GET'])
def get_recipes():
    return "List of recipes"

# Add more route handlers as needed
