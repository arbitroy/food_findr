from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import logging
import os

# Initialize extensions
db = SQLAlchemy()

def configure_logging(app):
    """
    Configure logging for the application
    """
    # Remove default logger
    app.logger.handlers = []
    
    # Create console handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    
    # Create formatter
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    console_handler.setFormatter(formatter)
    
    # Add handler to app logger
    app.logger.addHandler(console_handler)
    app.logger.setLevel(logging.INFO)

def create_app(config_class='config.config.Config'):
    """
    Application factory for Food Findr backend
    """
    # Create Flask app
    app = Flask(__name__)
    
    # Load configuration
    app.config.from_object(config_class)
    
    # Configure CORS
    CORS(app, resources={
        r"/api/*": {
            "origins": "*",
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })
    
    # Initialize database
    db.init_app(app)
    
    # Configure logging
    configure_logging(app)
    
    # Import models 
    from app.models import Restaurant, Review
    
    # Import and register blueprints
    from .routes import restaurant_routes
    app.register_blueprint(restaurant_routes.bp)
    
    # Create database tables
    with app.app_context():
        try:
            db.drop_all()
            db.create_all()
            app.logger.info("Database tables created successfully")
        except Exception as e:
            app.logger.error(f"Database table creation failed: {e}")
    
    return app