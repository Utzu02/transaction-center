"""
Configuration module for the application
Loads environment variables and provides configuration constants
"""

import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    """Application configuration class"""
    
    # Server Configuration
    FLASK_ENV = os.getenv('FLASK_ENV', 'development')
    FLASK_DEBUG = os.getenv('FLASK_DEBUG', 'True').lower() == 'true'
    PORT = int(os.getenv('PORT', 5000))
    HOST = os.getenv('HOST', '0.0.0.0')
    
    # MongoDB Configuration
    MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/')
    MONGODB_DB_NAME = os.getenv('MONGODB_DB_NAME', 'fraud_detection')
    
    # API Configuration
    API_KEY = os.getenv('API_KEY', 'development_api_key')
    FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5173')
    
    # Hackathon Stream Configuration
    STREAM_URL = os.getenv('STREAM_URL', 'https://95.217.75.14:8443/stream')
    FLAG_URL = os.getenv('FLAG_URL', 'https://95.217.75.14:8443/api/flag')
    HACKATHON_API_KEY = os.getenv('HACKATHON_API_KEY', '')
    
    # Model Configuration
    MODEL_PATH = os.getenv('MODEL_PATH', 'fraud_detector_model.pkl')
    
    # CORS Configuration
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:5173,http://localhost:3000,https://frontend-cyan-six-47.vercel.app,https://backend-self-xi-87.vercel.app/').split(',')
    
    @classmethod
    def validate(cls):
        """Validate that all required configuration is present"""
        required_vars = []
        
        if not cls.MONGODB_URI:
            required_vars.append('MONGODB_URI')
        
        if required_vars:
            raise ValueError(f"Missing required environment variables: {', '.join(required_vars)}")
        
        return True

# Create a singleton config instance
config = Config()

