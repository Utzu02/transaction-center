# WSGI entrypoint used by hosting platforms (Vercel, Gunicorn, etc.)
# Import the Flask `app` from the main API module so the platform can find it.
try:
    from api_server import app
except Exception:
    # If api_server import fails, try app.py fallback
    try:
        from app import app
    except Exception:
        # Last-resort: create a minimal app to provide a 500 error response
        try:
            from flask import Flask
            fallback = Flask(__name__)
            @fallback.route('/')
            def _err():
                return {'error': 'Application failed to initialize'}, 500
            app = fallback
        except Exception:
            # If Flask is not installed, provide a dummy object to avoid import errors
            app = None
