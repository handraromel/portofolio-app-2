from flask import current_app


def get_routes():
    routes = []
    for rule in current_app.url_map.iter_rules():
        methods = ','.join(sorted(rule.methods))
        routes.append({
            "endpoint": rule.endpoint,
            "methods": methods,
            "route": str(rule)
        })
    return sorted(routes, key=lambda x: x['route'])
