from app import db
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import JSONB
import json
from datetime import datetime

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
    
    @classmethod
    def create_or_update_from_foursquare(cls, restaurant_data):
        """
        Create or update restaurant from Foursquare API data
        
        :param restaurant_data: Dictionary of restaurant data from Foursquare
        :return: Restaurant instance
        """
        # Try to find existing restaurant
        existing = cls.query.filter_by(foursquare_id=restaurant_data.get('foursquare_id')).first()
        
        # Prepare normalized data
        normalized_data = {
            'foursquare_id': restaurant_data.get('foursquare_id'),
            'name': restaurant_data.get('name'),
            'address': restaurant_data.get('address'),
            'latitude': restaurant_data.get('latitude'),
            'longitude': restaurant_data.get('longitude'),
            'rating': restaurant_data.get('rating', 0),
            'price': restaurant_data.get('price', 0),
            'categories': ', '.join(restaurant_data.get('categories', [])),
            'raw_api_data': json.dumps(restaurant_data),
            
            # Dietary flags with robust parsing
            'is_vegan': cls._parse_dietary_flag(restaurant_data, 'vegan'),
            'is_vegetarian': cls._parse_dietary_flag(restaurant_data, 'vegetarian'),
            'is_halal': cls._parse_dietary_flag(restaurant_data, 'halal'),
            'is_kosher': cls._parse_dietary_flag(restaurant_data, 'kosher'),
            'is_gluten_free': cls._parse_dietary_flag(restaurant_data, 'gluten-free')
        }
        
        if existing:
            # Update existing restaurant
            for key, value in normalized_data.items():
                setattr(existing, key, value)
            existing.updated_at = datetime.utcnow()
            restaurant = existing
        else:
            # Create new restaurant
            restaurant = cls(**normalized_data)
            db.session.add(restaurant)
        
        return restaurant
    
    @staticmethod
    def _parse_dietary_flag(restaurant_data, diet):
        """
        Robust parsing of dietary flags
        
        :param restaurant_data: Restaurant data dictionary
        :param diet: Dietary restriction to check
        :return: Boolean indicating presence of dietary option
        """
        # Check multiple possible locations for dietary information
        diet_keywords = {
            'vegan': ['vegan', 'plant-based', 'dairy-free'],
            'vegetarian': ['vegetarian', 'no meat', 'meatless'],
            'halal': ['halal', 'halal-certified'],
            'kosher': ['kosher', 'kosher-certified'],
            'gluten-free': ['gluten-free', 'no gluten']
        }
        
        # Convert restaurant data to lowercase string for easy searching
        data_str = str(restaurant_data).lower()
        
        # Check if any keywords are present
        return any(
            keyword in data_str 
            for keyword in diet_keywords.get(diet, [])
        )
    
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