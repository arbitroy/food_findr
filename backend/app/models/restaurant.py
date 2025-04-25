from app import db
from sqlalchemy.sql import func
import json
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class Restaurant(db.Model):
    """
    Comprehensive restaurant model with robust Foursquare API data handling
    """
    __tablename__ = 'restaurants'
    
    # Core Identification
    id = db.Column(db.Integer, primary_key=True)
    foursquare_id = db.Column(db.String(100), unique=True, nullable=False, index=True)
    
    # Basic Information
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    
    # Location Details
    address = db.Column(db.String(300), nullable=True)
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    
    # Business Details
    categories = db.Column(db.String(500), nullable=True)  # Comma-separated categories
    
    # Ratings and Pricing
    rating = db.Column(db.Float, default=0.0, nullable=True)
    price = db.Column(db.Integer, nullable=True)
    
    # Detailed JSON storage for raw API data
    raw_api_data = db.Column(db.Text, nullable=True)  # Changed to Text to ensure compatibility
    
    # Dietary and Feature Flags
    is_vegan = db.Column(db.Boolean, default=False, nullable=True)
    is_vegetarian = db.Column(db.Boolean, default=False, nullable=True)
    is_halal = db.Column(db.Boolean, default=False, nullable=True)
    is_kosher = db.Column(db.Boolean, default=False, nullable=True)
    is_gluten_free = db.Column(db.Boolean, default=False, nullable=True)
    
    # Metadata
    created_at = db.Column(db.DateTime(timezone=True), server_default=func.now())
    updated_at = db.Column(db.DateTime(timezone=True), onupdate=func.now(), nullable=True)
    
    # Relationships
    reviews = db.relationship('Review', backref='restaurant', lazy='dynamic')
    
    def __init__(self, **kwargs):
        """
        Initialize a Restaurant with robust validation
        """
        # Validate required fields
        if 'foursquare_id' not in kwargs or not kwargs['foursquare_id']:
            raise ValueError("foursquare_id is required")
        
        if 'name' not in kwargs or not kwargs['name']:
            raise ValueError("name is required")
        
        # Set default values for optional fields
        kwargs.setdefault('description', None)
        kwargs.setdefault('address', None)
        kwargs.setdefault('latitude', None)
        kwargs.setdefault('longitude', None)
        kwargs.setdefault('categories', None)
        kwargs.setdefault('rating', 4.0)  # Default rating
        kwargs.setdefault('price', 2)     # Default to mid-range
        kwargs.setdefault('raw_api_data', None)
        kwargs.setdefault('is_vegan', False)
        kwargs.setdefault('is_vegetarian', False)
        kwargs.setdefault('is_halal', False)
        kwargs.setdefault('is_kosher', False)
        kwargs.setdefault('is_gluten_free', False)
        
        # Initialize with validated data
        super(Restaurant, self).__init__(**kwargs)
    
    @classmethod
    def create_or_update_from_foursquare(cls, restaurant_data):
        """
        Create or update restaurant from Foursquare API data
        
        :param restaurant_data: Dictionary of restaurant data from Foursquare
        :return: Restaurant instance
        """
        # Validate required fields
        if not restaurant_data.get('foursquare_id') or not restaurant_data.get('name'):
            logger.error(f"Missing required fields in restaurant data: {restaurant_data}")
            return None
        
        try:
            # Try to find existing restaurant
            existing = cls.query.filter_by(foursquare_id=restaurant_data.get('foursquare_id')).first()
            
            # Prepare normalized data
            normalized_data = {
                'foursquare_id': restaurant_data.get('foursquare_id'),
                'name': restaurant_data.get('name'),
                'address': restaurant_data.get('address'),
                'latitude': restaurant_data.get('latitude'),
                'longitude': restaurant_data.get('longitude'),
                'categories': restaurant_data.get('categories', ''),
                'rating': restaurant_data.get('rating', 4.0),  # Default rating
                'price': restaurant_data.get('price', 2),      # Default to mid-range
                'raw_api_data': restaurant_data.get('raw_api_data'),
                'is_vegan': restaurant_data.get('is_vegan', False),
                'is_vegetarian': restaurant_data.get('is_vegetarian', False),
                'is_halal': restaurant_data.get('is_halal', False),
                'is_kosher': restaurant_data.get('is_kosher', False),
                'is_gluten_free': restaurant_data.get('is_gluten_free', False)
            }
            
            if existing:
                # Update existing restaurant
                for key, value in normalized_data.items():
                    setattr(existing, key, value)
                existing.updated_at = datetime.utcnow()
                restaurant = existing
                logger.info(f"Updated existing restaurant: {restaurant.name}")
            else:
                # Create new restaurant
                restaurant = cls(**normalized_data)
                db.session.add(restaurant)
                logger.info(f"Created new restaurant: {restaurant.name}")
            
            return restaurant
            
        except Exception as e:
            logger.error(f"Error creating/updating restaurant: {e}")
            return None
    
    def to_dict(self):
        """
        Convert restaurant to dictionary for API response
        """
        return {
            'id': self.id,
            'foursquare_id': self.foursquare_id,
            'name': self.name,
            'address': self.address,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'rating': self.rating,
            'price': self.price,
            'categories': self.categories.split(', ') if self.categories else [],
            'dietary_options': {
                'vegan': self.is_vegan,
                'vegetarian': self.is_vegetarian,
                'halal': self.is_halal,
                'kosher': self.is_kosher,
                'gluten_free': self.is_gluten_free
            }
        }