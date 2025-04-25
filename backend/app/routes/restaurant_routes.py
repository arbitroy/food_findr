from flask import Blueprint, request, jsonify
from app.models import Restaurant, Review
from app.services.nlp_service import generate_restaurant_insights
from app.services.restaurant_search_service import RestaurantSearchService
from app import db
import logging

# Create a blueprint for restaurant-related routes
bp = Blueprint('restaurants', __name__, url_prefix='/api/restaurants')

# Configure logging
logger = logging.getLogger(__name__)

@bp.route('/search', methods=['GET'])
def search_restaurants():
    """
    Advanced restaurant search endpoint
    Supports multiple filtering options
    """
    try:
        # Extract search parameters
        latitude = request.args.get('latitude', type=float)
        longitude = request.args.get('longitude', type=float)
        
        # Dietary restrictions
        dietary_restrictions = request.args.getlist('dietary_restrictions')
        
        # Other filters
        min_rating = request.args.get('min_rating', type=float)
        max_price = request.args.get('max_price', type=int)
        query = request.args.get('query')
        max_distance = request.args.get('max_distance', type=float)
        
        # Input validation
        if latitude is None or longitude is None:
            return jsonify({
                'error': 'Location coordinates (latitude and longitude) are required'
            }), 400
            
        # Perform search with error handling
        try:
            restaurants = RestaurantSearchService.search_restaurants(
                latitude=latitude,
                longitude=longitude,
                dietary_restrictions=dietary_restrictions,
                min_rating=min_rating,
                max_price=max_price,
                query=query,
                max_distance=max_distance
            )
            
            # Convert to JSON-serializable format
            restaurant_list = [restaurant.to_dict() for restaurant in restaurants]
            
            return jsonify({
                'total_results': len(restaurant_list),
                'restaurants': restaurant_list
            }), 200
            
        except Exception as e:
            logger.error(f"Error in search execution: {e}")
            return jsonify({
                'error': 'Search execution failed',
                'details': str(e)
            }), 500
    
    except Exception as e:
        logger.error(f"Restaurant search error: {e}")
        return jsonify({
            'error': 'Search failed',
            'details': str(e)
        }), 500

@bp.route('/<int:restaurant_id>', methods=['GET'])
def get_restaurant_details(restaurant_id):
    """
    Get detailed information for a specific restaurant
    """
    try:
        restaurant = Restaurant.query.get_or_404(restaurant_id)
        
        # Fetch recent reviews
        reviews = Review.query.filter_by(restaurant_id=restaurant_id).order_by(Review.created_at.desc()).limit(10).all()
        
        # Prepare restaurant details
        restaurant_details = restaurant.to_dict()
        
        # Add review information
        restaurant_details['recent_reviews'] = [
            {
                'id': review.id,
                'text': review.text,
                'rating': review.rating,
                'sentiment': review.sentiment,
                'created_at': review.created_at.isoformat()
            } for review in reviews
        ]
        
        return jsonify(restaurant_details), 200
    
    except Exception as e:
        logger.error(f"Restaurant details retrieval error: {e}")
        return jsonify({
            'error': 'Failed to retrieve restaurant details',
            'details': str(e)
        }), 500

@bp.route('/dietary-trends', methods=['GET'])
def get_dietary_trends():
    """
    Retrieve dietary trends across all restaurants
    """
    try:
        # Calculate dietary trends
        all_restaurants = Restaurant.query.all()
        total_count = len(all_restaurants)
        
        if total_count == 0:
            return jsonify({
                'dietary_trends': {
                    'vegan': 0,
                    'vegetarian': 0,
                    'halal': 0,
                    'kosher': 0,
                    'gluten_free': 0
                }
            }), 200
        
        # Count restaurants with each dietary option
        vegan_count = sum(1 for r in all_restaurants if r.is_vegan)
        vegetarian_count = sum(1 for r in all_restaurants if r.is_vegetarian)
        halal_count = sum(1 for r in all_restaurants if r.is_halal)
        kosher_count = sum(1 for r in all_restaurants if r.is_kosher)
        gluten_free_count = sum(1 for r in all_restaurants if r.is_gluten_free)
        
        # Calculate percentages
        trends = {
            'vegan': round(vegan_count / total_count * 100, 2),
            'vegetarian': round(vegetarian_count / total_count * 100, 2),
            'halal': round(halal_count / total_count * 100, 2),
            'kosher': round(kosher_count / total_count * 100, 2),
            'gluten_free': round(gluten_free_count / total_count * 100, 2)
        }
        
        return jsonify({
            'dietary_trends': trends
        }), 200
    
    except Exception as e:
        logger.error(f"Dietary trends retrieval error: {e}")
        return jsonify({
            'error': 'Failed to retrieve dietary trends',
            'details': str(e)
        }), 500

@bp.route('/nearby', methods=['GET'])
def find_nearby_restaurants():
    """
    Find restaurants near a specific location
    """
    try:
        # Required parameters
        latitude = request.args.get('latitude', type=float)
        longitude = request.args.get('longitude', type=float)
        
        # Optional parameters
        max_distance = request.args.get('max_distance', default=5, type=float)  # Default 5km
        dietary_restrictions = request.args.getlist('dietary_restrictions')
        min_rating = request.args.get('min_rating', type=float)
        
        # Input validation
        if latitude is None or longitude is None:
            return jsonify({
                'error': 'Location coordinates (latitude and longitude) are required'
            }), 400
        
        # Perform search
        nearby_restaurants = RestaurantSearchService.search_restaurants(
            latitude=latitude,
            longitude=longitude,
            max_distance=max_distance,
            dietary_restrictions=dietary_restrictions,
            min_rating=min_rating
        )
        
        # Convert to JSON-serializable format with distance
        restaurant_list = []
        for restaurant in nearby_restaurants:
            if restaurant.latitude is not None and restaurant.longitude is not None:
                distance = RestaurantSearchService.haversine_distance(
                    latitude, longitude, 
                    restaurant.latitude, restaurant.longitude
                )
                
                restaurant_data = restaurant.to_dict()
                restaurant_data['distance_km'] = round(distance, 2)
                restaurant_list.append(restaurant_data)
        
        # Sort by distance
        restaurant_list.sort(key=lambda x: x.get('distance_km', float('inf')))
        
        return jsonify({
            'total_results': len(restaurant_list),
            'nearby_restaurants': restaurant_list
        }), 200
    
    except Exception as e:
        logger.error(f"Nearby restaurants search error: {e}")
        return jsonify({
            'error': 'Failed to find nearby restaurants',
            'details': str(e)
        }), 500

@bp.route('/insights/<int:restaurant_id>', methods=['GET'])
def get_restaurant_insights(restaurant_id):
    """
    Generate and retrieve NLP insights for a specific restaurant
    """
    try:
        # Check if restaurant exists
        restaurant = Restaurant.query.get_or_404(restaurant_id)
        
        # Generate insights
        try:
            insights = generate_restaurant_insights(restaurant_id)
            
            return jsonify({
                'restaurant_id': restaurant_id,
                'restaurant_name': restaurant.name,
                'insights': insights
            }), 200
        except Exception as e:
            logger.error(f"Error generating insights: {e}")
            return jsonify({
                'error': 'Failed to generate insights',
                'details': str(e)
            }), 500
    
    except Exception as e:
        logger.error(f"Restaurant insights generation error: {e}")
        return jsonify({
            'error': 'Failed to generate restaurant insights',
            'details': str(e)
        }), 500

@bp.route('/filter-options', methods=['GET'])
def get_filter_options():
    """
    Retrieve available filter options for restaurant search
    """
    try:
        # Prepare filter options
        filter_options = {
            'dietary_restrictions': [
                'vegan', 
                'vegetarian', 
                'halal', 
                'kosher', 
                'gluten_free'
            ],
            'price_ranges': [1, 2, 3, 4],
            'rating_options': [
                {'min_rating': 3.0, 'label': '3+ Stars'},
                {'min_rating': 4.0, 'label': '4+ Stars'},
                {'min_rating': 4.5, 'label': '4.5+ Stars'}
            ],
            'distance_options': [
                {'max_distance': 1, 'label': 'Within 1 km'},
                {'max_distance': 3, 'label': 'Within 3 km'},
                {'max_distance': 5, 'label': 'Within 5 km'},
                {'max_distance': 10, 'label': 'Within 10 km'}
            ]
        }
        
        return jsonify(filter_options), 200
    
    except Exception as e:
        logger.error(f"Filter options retrieval error: {e}")
        return jsonify({
            'error': 'Failed to retrieve filter options',
            'details': str(e)
        }), 500