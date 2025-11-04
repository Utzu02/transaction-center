"""
Main Application Entry Point
This file supports two modes:
 - Full mode using Flask (preferred) when dependencies are installed.
 - Lightweight fallback HTTP server using the Python stdlib when Flask is not
   available. The fallback provides minimal endpoints (health and notifications)
   so you can run the backend locally without installing extra packages.
"""

import sys
import json
from datetime import datetime
from urllib.parse import parse_qs, urlparse

from config import config

# Try to import Flask; if unavailable, we start a tiny stdlib HTTP server.
try:
    from flask import Flask, jsonify
    from flask_cors import CORS
    FLASK_AVAILABLE = True
except Exception:
    FLASK_AVAILABLE = False

# Minimal fallback notifications (used by the stdlib fallback server)
FALLBACK_NOTIFICATIONS = [
    {
        'id': 'fallback-1',
        '_id': 'fallback-1',
        'title': 'Notification service in demo mode',
        'message': 'Backend database is not connected. Showing sample notifications.',
        'text': 'Backend database is not connected. Showing sample notifications.',
        'type': 'info',
        'read': False,
        'timestamp': datetime.utcnow().isoformat(),
        'created_at': datetime.utcnow().isoformat()
    },
    {
        'id': 'fallback-2',
        '_id': 'fallback-2',
        'title': 'Connect MongoDB for live alerts',
        'message': 'To enable real notifications, configure MONGODB_URI on the backend.',
        'text': 'To enable real notifications, configure MONGODB_URI on the backend.',
        'type': 'warning',
        'read': False,
        'timestamp': datetime.utcnow().isoformat(),
        'created_at': datetime.utcnow().isoformat()
    }
]


if FLASK_AVAILABLE:
    # --- Full Flask app (normal operation) ---
    app = Flask(__name__)
    CORS(app, origins=config.CORS_ORIGINS)

    # Lazy imports to avoid import-time failures (e.g. missing pymongo)
    def register_blueprints():
        try:
            import importlib
            routes = importlib.import_module('routes')
            if hasattr(routes, 'transaction_bp'):
                app.register_blueprint(routes.transaction_bp)
            if hasattr(routes, 'notification_bp'):
                app.register_blueprint(routes.notification_bp)
        except Exception as e:
            print(f"⚠️  Could not import/register blueprints: {e}")

    register_blueprints()

    @app.route('/api/health', methods=['GET'])
    def health_check():
        try:
            # Import Database lazily to avoid hard dependency at import time
            from utils.database import Database
            db = Database.get_db()
            db.command('ping')
            db_status = 'connected'
        except Exception as e:
            db_status = f'error: {str(e)}'

        return jsonify({
            'status': 'healthy',
            'database': db_status,
            'environment': config.FLASK_ENV
        }), 200

    @app.route('/', methods=['GET'])
    def root():
        return jsonify({
            'name': 'Fraud Detection API',
            'version': '1.0.0',
            'endpoints': {
                'health': '/api/health',
                'transactions': '/api/transactions',
                'notifications': '/api/notifications'
            }
        }), 200

    def main():
        print("=" * 80)
        print(" " * 20 + "FRAUD DETECTION API SERVER")
        print("=" * 80)

        try:
            config.validate()
            print("✅ Configuration validated")
        except ValueError as e:
            print(f"❌ Configuration error: {e}")
            sys.exit(1)

        # Try to connect to database but don't crash the process if it fails here;
        # many demo deployments rely on fallback behavior.
        try:
            from utils.database import Database
            Database.connect()
        except Exception as e:
            print(f"⚠️  Database connection failed or not available: {e}")

        print()
        print("🚀 Server Configuration:")
        print(f"   Host: {config.HOST}")
        print(f"   Port: {config.PORT}")
        print(f"   Environment: {config.FLASK_ENV}")
        print(f"   Database: {config.MONGODB_DB_NAME}")
        print(f"   CORS Origins: {', '.join(config.CORS_ORIGINS)}")
        print()

        app.run(host=config.HOST, port=config.PORT, debug=config.FLASK_DEBUG)

    if __name__ == '__main__':
        main()

else:
    # --- Lightweight fallback server using stdlib (no Flask required) ---
    from wsgiref.simple_server import make_server

    def parse_int(qs, key, default):
        try:
            v = qs.get(key, [str(default)])[0]
            return int(v)
        except Exception:
            return default

    def fallback_app(environ, start_response):
        path = environ.get('PATH_INFO', '/')
        method = environ.get('REQUEST_METHOD', 'GET')
        query = parse_qs(environ.get('QUERY_STRING', ''))

        # Simple CORS headers
        headers = [
            ('Content-Type', 'application/json'),
            ('Access-Control-Allow-Origin', '*'),
            ('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE'),
            ('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        ]

        if method == 'OPTIONS':
            start_response('200 OK', headers)
            return [b'']

        if path == '/api/health' and method == 'GET':
            body = json.dumps({'status': 'healthy', 'environment': config.FLASK_ENV})
            start_response('200 OK', headers)
            return [body.encode('utf-8')]

        if path.startswith('/api/notifications') and method == 'GET':
            limit = parse_int(query, 'limit', 50)
            skip = parse_int(query, 'skip', 0)

            # Use the static fallback notifications defined above
            notifications = []
            for src in FALLBACK_NOTIFICATIONS:
                refreshed = dict(src)
                refreshed['timestamp'] = datetime.utcnow().isoformat()
                refreshed['created_at'] = refreshed['timestamp']
                notifications.append(refreshed)

            paginated = notifications[skip: skip + limit]
            result = {
                'success': True,
                'notifications': paginated,
                'total': len(notifications),
                'unread': len([n for n in paginated if not n.get('read', False)]),
                'limit': limit,
                'skip': skip,
                'fallback': True
            }
            start_response('200 OK', headers)
            return [json.dumps(result).encode('utf-8')]

        if path == '/' and method == 'GET':
            body = json.dumps({'name': 'Fraud Detection API (fallback)', 'version': '1.0.0'})
            start_response('200 OK', headers)
            return [body.encode('utf-8')]

        # Not found
        start_response('404 Not Found', headers)
        return [json.dumps({'error': 'Endpoint not found in fallback server'}).encode('utf-8')]

    def run_fallback():
        host = config.HOST or '127.0.0.1'
        port = int(config.PORT or 5000)
        print('⚠️  Flask not installed — running lightweight fallback server')
        print(f'   Listening on http://{host}:{port}')
        with make_server(host, port, fallback_app) as httpd:
            try:
                httpd.serve_forever()
            except KeyboardInterrupt:
                print('\n� Fallback server stopped by user')

    if __name__ == '__main__':
        run_fallback()

