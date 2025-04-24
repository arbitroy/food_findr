from app import db
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import JSONB
import json
from datetime import datetime

class Restaurant(db.Model):
    """
    Comprehensive restaurant model with simplified JSON handling
    """
    __tablename__ = 'restaurants'
    
    # Core Identification
    id = db.Column(db.Integer, primary_key=True)
    foursquare_id = db.Column(db.String(100), unique=True, nullable=False, index=True)
    
    # Basic Information
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    
    # Location Details
    address = db.Column(db.String(300))
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    
    # Business Details
    categories = db.Column(db.String(500))  # Simplified from JSONB
    
    # Ratings and Pricing
    rating = db.Column(db.Float, default=0.0)
    price = db.Column(db.Integer)
    
    # Dietary Accommodation Flags
    is_vegan = db.Column(db.Boolean, default=False)
    is_vegetarian = db.Column(db.Boolean, default=False)
    is_halal = db.Column(db.Boolean, default=False)
    is_kosher = db.Column(db.Boolean, default=False)
    is_gluten_free = db.Column(db.Boolean, default=False)
    
    # NLP Insights (stored as JSON string)
    _nlp_insights = db.Column('nlp_insights', db.Text)
    
    # Metadata
    created_at = db.Column(db.DateTime(timezone=True), server_default=func.now())
    updated_at = db.Column(db.DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    reviews = db.relationship('Review', backref='restaurant', lazy='dynamic')
    
    @property
    def nlp_insights(self):
        """
        Getter for NLP insights
        """
        if self._nlp_insights:
            try:
                return json.loads(self._nlp_insights)
            except json.JSONDecodeError:
                return {}
        return {}
    
    @nlp_insights.setter
    def nlp_insights(self, value):
        """
        Setter for NLP insights
        """
        try:
            self._nlp_insights = json.dumps(value)
        except TypeError:
            self._nlp_insights = json.dumps({})
    
    @classmethod
    def create_or_update_from_foursquare(cls, restaurant_data):
        """
        Create or update restaurant from Foursquare API data
        """
        # Try to find existing restaurant
        existing = cls.query.filter_by(foursquare_id=restaurant_data.get('foursquare_id')).first()
        
        if existing:
            # Update existing restaurant
            for key, value in restaurant_data.items():
                if hasattr(existing, key):
                    setattr(existing, key, value)
            existing.updated_at = datetime.utcnow()
            restaurant = existing
        else:
            # Create new restaurant
            restaurant = cls(**restaurant_data)
            db.session.add(restaurant)
        
        return restaurant
    
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
            'dietary_options': {
                'vegan': self.is_vegan,
                'vegetarian': self.is_vegetarian,
                'halal': self.is_halal,
                'kosher': self.is_kosher,
                'gluten_free': self.is_gluten_free
            },
            'nlp_insights': self.nlp_insights
        }

