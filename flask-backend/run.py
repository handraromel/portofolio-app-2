from app import create_app
from app.utils.route_utils import get_routes
import os

app = create_app()

if __name__ == "__main__":
    if os.environ.get('FLASK_ENV') == 'development':
        with app.app_context():
            print("Available routes:")
            for route in get_routes():
                print(f"{route['route']} [{route['methods']}] - {route['endpoint']}")
    
    app.run(host="0.0.0.0", port=8000)
