"""
Main Application Entry Point
Flask server with MongoDB integration
"""

from flask import Flask, jsonify
from flask_cors import CORS
import sys

from config import config
from utils.database import Database
from routes import transaction_bp, notification_bp

def create_app():
    """Create and configure the Flask application"""
    
    # Create Flask app
    app = Flask(__name__)
    
    # Configure CORS
    CORS(app, origins=config.CORS_ORIGINS)
    
    # Configure app
    app.config['JSON_SORT_KEYS'] = False
    
    # Register blueprints
    app.register_blueprint(transaction_bp)
    app.register_blueprint(notification_bp)
    
    # Health check endpoint
    @app.route('/api/health', methods=['GET'])
    def health_check():
        """Health check endpoint"""
        try:
            # Test database connection
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
    
    # Root endpoint
    @app.route('/', methods=['GET'])
    def root():
        """Root endpoint"""
        return jsonify({
            'name': 'Fraud Detection API',
            'version': '1.0.0',
            'endpoints': {
                'health': '/api/health',
                'transactions': '/api/transactions',
                'notifications': '/api/notifications'
            }
        }), 200
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Endpoint not found'}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({'error': 'Internal server error'}), 500
    
    return app

def main():
    """Main entry point"""
    print("="*80)
    print(" "*20 + "FRAUD DETECTION API SERVER")
    print("="*80)
    print()
    
    # Validate configuration
    try:
        config.validate()
        print("✅ Configuration validated")
    except ValueError as e:
        print(f"❌ Configuration error: {e}")
        sys.exit(1)
    
    # Connect to database
    try:
        Database.connect()
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        print("   Make sure MongoDB is running on localhost:27017")
        sys.exit(1)
    
    # Create app
    app = create_app()
    
    print()
    print("🚀 Server Configuration:")
    print(f"   Host: {config.HOST}")
    print(f"   Port: {config.PORT}")
    print(f"   Environment: {config.FLASK_ENV}")
    print(f"   Database: {config.MONGODB_DB_NAME}")
    print(f"   CORS Origins: {', '.join(config.CORS_ORIGINS)}")
    print()
    print("📡 API Endpoints:")
    print(f"   Health Check: http://{config.HOST}:{config.PORT}/api/health")
    print(f"   Transactions: http://{config.HOST}:{config.PORT}/api/transactions")
    print(f"   Notifications: http://{config.HOST}:{config.PORT}/api/notifications")
    print()
    print("✨ Server starting...")
    print("="*80)
    print()
    
    # Run app
    try:
        app.run(
            host=config.HOST,
            port=config.PORT,
            debug=config.FLASK_DEBUG
        )
    except KeyboardInterrupt:
        print("\n\n🛑 Server stopped by user")
    except Exception as e:
        print(f"\n❌ Server error: {e}")
    finally:
        # Close database connection
        Database.close()
        print("👋 Goodbye!")

if __name__ == '__main__':
    main()

# Expose a module-level WSGI app for serverless platforms (Vercel / WSGI loaders)
# This ensures the deployed entrypoint has an `app` callable that imports will use.
try:
    # create_app is lightweight and only registers blueprints; safe to call at import
    app = create_app()
except Exception as _e:
    # If creation fails (missing env/db), fall back to a minimal Flask app to give
    # a clearer error rather than crashing the import in the serverless runtime.
    fallback_app = Flask(__name__)
    @fallback_app.route('/', methods=['GET'])
    def _err():
        return {'error': 'Application failed to initialize'}, 500
    app = fallback_app

