import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Config:
    """
    Base configuration class
    """
    # Flask Settings
    SECRET_KEY = os.getenv('SECRET_KEY', 'development_secret_key')
    DEBUG = False
    TESTING = False
    
    # Database Configuration
    SQLALCHEMY_DATABASE_URI = os.getenv(
        'DATABASE_URL', 
        'postgresql://root:secret@localhost/food_findr'
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Foursquare API Configuration
    FOURSQUARE_CLIENT_ID = os.getenv('FOURSQUARE_CLIENT_ID')
    FOURSQUARE_CLIENT_SECRET = os.getenv('FOURSQUARE_CLIENT_SECRET')
    
    # Logging Configuration
    LOG_TO_STDOUT = os.getenv('LOG_TO_STDOUT', 'false').lower() == 'true'
    
    # Caching Configuration
    CACHE_TYPE = os.getenv('CACHE_TYPE', 'simple')
    CACHE_DEFAULT_TIMEOUT = int(os.getenv('CACHE_DEFAULT_TIMEOUT', 300))
    
    # Periodic Sync Configuration
    SYNC_INTERVAL_HOURS = int(os.getenv('SYNC_INTERVAL_HOURS', 24))
    
    # NLP Configuration
    NLTK_DATA_PATH = os.getenv('NLTK_DATA_PATH', './nltk_data')

class DevelopmentConfig(Config):
    """
    Development environment configuration
    """
    DEBUG = True
    SQLALCHEMY_ECHO = True

class TestingConfig(Config):
    """
    Testing environment configuration
    """
    TESTING = True
    SQLALCHEMY_DATABASE_URI = os.getenv(
        'TEST_DATABASE_URL', 
        'postgresql://root:secret@localhost/food_findr_test'
    )

class ProductionConfig(Config):
    """
    Production environment configuration
    """
    # Additional security and performance settings
    SESSION_COOKIE_SECURE = True
    REMEMBER_COOKIE_SECURE = True
    
    # More strict database connection
    SQLALCHEMY_POOL_SIZE = 10
    SQLALCHEMY_MAX_OVERFLOW = 20

def get_config():
    """
    Select configuration based on environment
    """
    env = os.getenv('FLASK_ENV', 'development')
    config_selector = {
        'development': DevelopmentConfig,
        'testing': TestingConfig,
        'production': ProductionConfig
    }
    return config_selector.get(env, DevelopmentConfig)

# Example .env file content
"""
# Application Settings
SECRET_KEY=your_secure_secret_key
FLASK_ENV=development

# Database Configuration
DATABASE_URL=postgresql://root:secret@localhost/food_findr

# Foursquare API Credentials
FOURSQUARE_CLIENT_ID=your_client_id
FOURSQUARE_CLIENT_SECRET=your_client_secret

# Logging
LOG_TO_STDOUT=false

# Caching
CACHE_TYPE=simple
CACHE_DEFAULT_TIMEOUT=300

# Sync Settings
SYNC_INTERVAL_HOURS=24

# NLP Data Path
NLTK_DATA_PATH=./nltk_data
"""

def validate_config(config):
    """
    Validate critical configuration parameters
    """
    errors = []
    
    # Check Foursquare API credentials
    if not config.FOURSQUARE_CLIENT_ID or not config.FOURSQUARE_CLIENT_SECRET:
        errors.append("Missing Foursquare API credentials")
    
    # Check database connection
    if not config.SQLALCHEMY_DATABASE_URI:
        errors.append("Missing database connection URL")
    
    # Check secret key
    if not config.SECRET_KEY or config.SECRET_KEY == 'development_secret_key':
        errors.append("Using default secret key is not secure")
    
    return errors