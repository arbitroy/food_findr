from app import db
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import JSONB
import json
from datetime import datetime

class Review(db.Model):
    """
    Review model with simplified storage
    """
    __tablename__ = 'reviews'
    
    id = db.Column(db.Integer, primary_key=True)
    restaurant_id = db.Column(db.Integer, db.ForeignKey('restaurants.id'), nullable=False)
    
    # Review details
    text = db.Column(db.Text)
    rating = db.Column(db.Float)
    
    # Simplified NLP storage
    _sentiment = db.Column('sentiment', db.String(20))
    _dietary_keywords = db.Column('dietary_keywords', db.String(500))
    
    # Timestamps
    created_at = db.Column(db.DateTime(timezone=True), server_default=func.now())
    
    @property
    def sentiment(self):
        """
        Getter for sentiment
        """
        return self._sentiment
    
    @sentiment.setter
    def sentiment(self, value):
        """
        Setter for sentiment
        """
        self._sentiment = str(value)[:20]
    
    @property
    def dietary_keywords(self):
        """
        Getter for dietary keywords
        """
        if self._dietary_keywords:
            try:
                return json.loads(self._dietary_keywords)
            except json.JSONDecodeError:
                return {}
        return {}
    
    @dietary_keywords.setter
    def dietary_keywords(self, value):
        """
        Setter for dietary keywords
        """
        try:
            self._dietary_keywords = json.dumps(value)
        except TypeError:
            self._dietary_keywords = json.dumps({})
    
    @classmethod
    def create_from_foursquare(cls, restaurant_id, review_data):
        """
        Create review from Foursquare API data
        """
        review = cls(
            restaurant_id=restaurant_id,
            text=review_data.get('text'),
            rating=review_data.get('rating')
        )
        db.session.add(review)
        return review