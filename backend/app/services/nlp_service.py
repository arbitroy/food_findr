import logging
from typing import Dict, Any
from textblob import TextBlob

from app import db
from app.models import Restaurant, Review

class RestaurantInsightsGenerator:
    """
    Service to generate insights for restaurants
    """
    
    @classmethod
    def generate_restaurant_insights(cls, restaurant_id: int) -> Dict[str, Any]:
        """
        Generate comprehensive insights for a restaurant
        
        :param restaurant_id: ID of the restaurant
        :return: Dictionary of restaurant insights
        """
        try:
            # Fetch the restaurant
            restaurant = Restaurant.query.get(restaurant_id)
            if not restaurant:
                return {"error": "Restaurant not found"}
            
            # Fetch reviews for the restaurant
            reviews = Review.query.filter_by(restaurant_id=restaurant_id).all()
            
            # Analyze reviews
            insights = {
                'total_reviews': len(reviews),
                'sentiment_analysis': cls._analyze_sentiment(reviews),
                'dietary_mentions': cls._detect_dietary_keywords(reviews),
                'key_phrases': cls._extract_key_phrases(reviews)
            }
            
            # Update restaurant with insights
            restaurant.nlp_insights = insights
            db.session.commit()
            
            return insights
        
        except Exception as e:
            logging.error(f"Error generating restaurant insights: {e}")
            return {"error": str(e)}
    
    @staticmethod
    def _analyze_sentiment(reviews):
        """
        Analyze sentiment across restaurant reviews
        """
        sentiments = []
        for review in reviews:
            blob = TextBlob(review.text)
            sentiments.append(blob.sentiment.polarity)
        
        if not sentiments:
            return {
                'average_sentiment': 0,
                'sentiment_distribution': {
                    'positive': 0,
                    'neutral': 0,
                    'negative': 0
                }
            }
        
        # Calculate sentiment distribution
        sentiment_distribution = {
            'positive': sum(1 for s in sentiments if s > 0.05),
            'neutral': sum(1 for s in sentiments if abs(s) <= 0.05),
            'negative': sum(1 for s in sentiments if s < -0.05)
        }
        
        return {
            'average_sentiment': sum(sentiments) / len(sentiments),
            'sentiment_distribution': sentiment_distribution
        }
    
    @staticmethod
    def _detect_dietary_keywords(reviews):
        """
        Detect dietary-related keywords in reviews
        """
        dietary_keywords = {
            'vegan': ['vegan', 'plant-based', 'dairy-free'],
            'vegetarian': ['vegetarian', 'no meat', 'meatless'],
            'halal': ['halal', 'halal-certified'],
            'kosher': ['kosher', 'kosher-certified'],
            'gluten-free': ['gluten-free', 'no gluten']
        }
        
        mentions = {diet: 0 for diet in dietary_keywords.keys()}
        
        for review in reviews:
            review_text = review.text.lower()
            for diet, keywords in dietary_keywords.items():
                if any(keyword in review_text for keyword in keywords):
                    mentions[diet] += 1
        
        return mentions
    
    @staticmethod
    def _extract_key_phrases(reviews):
        """
        Extract key phrases from reviews
        """
        from collections import Counter
        
        # Collect all words from reviews
        all_words = []
        for review in reviews:
            # Use TextBlob for tokenization and stop word removal
            blob = TextBlob(review.text)
            words = [word.lower() for word in blob.words if len(word) > 2]
            all_words.extend(words)
        
        # Get most common words
        return [word for word, count in Counter(all_words).most_common(5)]

# Expose the function at the module level
def generate_restaurant_insights(restaurant_id: int) -> Dict[str, Any]:
    """
    Wrapper function to generate restaurant insights
    """
    return RestaurantInsightsGenerator.generate_restaurant_insights(restaurant_id)

# Periodic insights generation task
def update_restaurant_insights():
    """
    Periodically update insights for all restaurants
    """
    restaurants = Restaurant.query.all()
    for restaurant in restaurants:
        generate_restaurant_insights(restaurant.id)