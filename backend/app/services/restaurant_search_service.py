from app import db
from app.models import Restaurant
from app.services.foursquare_service import FoursquareService
from typing import List, Dict, Optional, Any
import math
from sqlalchemy import or_
import inspect
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class RestaurantSearchService:
    """
    Enhanced restaurant search service with local DB and Foursquare integration
    """
    
    @staticmethod
    def haversine_distance(
        lat1: float, 
        lon1: float, 
        lat2: float, 
        lon2: float
    ) -> float:
        """
        Calculate the great circle distance between two points 
        on the earth (specified in decimal degrees)
        
        :return: Distance in kilometers
        """
        # Radius of earth in kilometers
        R = 6371.0
        
        # Convert latitude and longitude to radians
        lat1_rad = math.radians(lat1)
        lon1_rad = math.radians(lon1)
        lat2_rad = math.radians(lat2)
        lon2_rad = math.radians(lon2)
        
        # Haversine formula
        dlon = lon2_rad - lon1_rad
        dlat = lat2_rad - lat1_rad
        
        a = (math.sin(dlat/2)**2 + 
             math.cos(lat1_rad) * math.cos(lat2_rad) * 
             math.sin(dlon/2)**2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        
        return R * c
    
    @classmethod
    def search_restaurants(
        cls, 
        latitude: Optional[float] = None, 
        longitude: Optional[float] = None, 
        dietary_restrictions: Optional[List[str]] = None, 
        min_rating: Optional[float] = None, 
        max_price: Optional[int] = None,
        query: Optional[str] = None,
        max_distance: Optional[float] = None
    ) -> List[Restaurant]:
        """
        Comprehensive restaurant search with Foursquare integration
        
        :param latitude: Search center latitude
        :param longitude: Search center longitude
        :param dietary_restrictions: List of dietary options to filter
        :param min_rating: Minimum restaurant rating
        :param max_price: Maximum price range
        :param query: Text search query
        :param max_distance: Maximum distance from search center
        :return: List of matching restaurants
        """
        # Initialize empty list for results
        results = []
        
        try:
            # Start with local database search
            search_query = Restaurant.query
            
            # Text query filtering
            if query:
                search_query = search_query.filter(
                    or_(
                        Restaurant.name.ilike(f'%{query}%'),
                        Restaurant.description.ilike(f'%{query}%')
                    )
                )
            
            # Dietary restriction filtering
            if dietary_restrictions:
                for restriction in dietary_restrictions:
                    if restriction == 'vegan':
                        search_query = search_query.filter(Restaurant.is_vegan == True)
                    elif restriction == 'vegetarian':
                        search_query = search_query.filter(Restaurant.is_vegetarian == True)
                    elif restriction == 'halal':
                        search_query = search_query.filter(Restaurant.is_halal == True)
                    elif restriction == 'kosher':
                        search_query = search_query.filter(Restaurant.is_kosher == True)
                    elif restriction == 'gluten_free':
                        search_query = search_query.filter(Restaurant.is_gluten_free == True)
            
            # Rating filtering
            if min_rating is not None:
                search_query = search_query.filter(Restaurant.rating >= min_rating)
            
            # Price filtering
            if max_price is not None:
                search_query = search_query.filter(Restaurant.price <= max_price)
            
            # Execute local database search
            local_restaurants = search_query.all()
            
            # Filter by distance if coordinates provided
            if latitude is not None and longitude is not None and max_distance is not None:
                local_restaurants = [
                    restaurant for restaurant in local_restaurants
                    if restaurant.latitude is not None and restaurant.longitude is not None and
                    cls.haversine_distance(
                        latitude, longitude, 
                        restaurant.latitude, restaurant.longitude
                    ) <= max_distance
                ]
            
            # If not enough local results, fetch from Foursquare
            if not local_restaurants or len(local_restaurants) < 5:
                logger.info("Not enough local results, fetching from Foursquare API")
                
                # Prepare Foursquare search parameters
                foursquare_params = {
                    'latitude': latitude,
                    'longitude': longitude,
                    'query': query,
                    'limit': 50  # Fetch more results to supplement local data
                }
                
                # Remove None values
                foursquare_params = {k: v for k, v in foursquare_params.items() if v is not None}
                
                # Fetch restaurants from Foursquare
                foursquare_restaurants = FoursquareService.get_restaurants_near(**foursquare_params)
                
                logger.info(f"Retrieved {len(foursquare_restaurants)} restaurants from Foursquare API")
                
                # Add new restaurants to database
                new_restaurants = []
                for restaurant_data in foursquare_restaurants:
                    try:
                        # Validate required fields
                        if not restaurant_data.get('foursquare_id') or not restaurant_data.get('name'):
                            logger.warning(f"Skipping restaurant with missing required fields")
                            continue
                        
                        # Check if restaurant already exists
                        existing = Restaurant.query.filter_by(foursquare_id=restaurant_data['foursquare_id']).first()
                        
                        if existing:
                            logger.info(f"Restaurant already exists: {existing.name}")
                            if existing not in local_restaurants:
                                local_restaurants.append(existing)
                        else:
                            # Create a new restaurant
                            new_restaurant = Restaurant(
                                foursquare_id=restaurant_data['foursquare_id'],
                                name=restaurant_data['name'],
                                address=restaurant_data.get('address'),
                                latitude=restaurant_data.get('latitude'),
                                longitude=restaurant_data.get('longitude'),
                                categories=restaurant_data.get('categories', ''),
                                rating=restaurant_data.get('rating', 4.0),  # Default rating
                                price=restaurant_data.get('price', 2),  # Default to mid-price
                                is_vegan=restaurant_data.get('is_vegan', False),
                                is_vegetarian=restaurant_data.get('is_vegetarian', False),
                                is_halal=restaurant_data.get('is_halal', False),
                                is_kosher=restaurant_data.get('is_kosher', False),
                                is_gluten_free=restaurant_data.get('is_gluten_free', False),
                                raw_api_data=restaurant_data.get('raw_api_data'),
                                updated_at=datetime.utcnow()
                            )
                            
                            db.session.add(new_restaurant)
                            new_restaurants.append(new_restaurant)
                            logger.info(f"Created new restaurant: {new_restaurant.name}")
                    except Exception as e:
                        db.session.rollback()
                        logger.error(f"Error creating restaurant: {e}")
                        continue
                
                # Commit new restaurants
                try:
                    if new_restaurants:
                        db.session.commit()
                        logger.info(f"Committed {len(new_restaurants)} new restaurants to database")
                        local_restaurants.extend(new_restaurants)
                except Exception as e:
                    db.session.rollback()
                    logger.error(f"Error committing new restaurants to database: {e}")
            
            # Final filtering and sorting
            filtered_restaurants = []
            for restaurant in local_restaurants:
                try:
                    # Basic validation
                    if restaurant.rating is None and min_rating is not None:
                        continue
                    if restaurant.price is None and max_price is not None:
                        continue
                    
                    # Additional filtering
                    if min_rating is not None and restaurant.rating < min_rating:
                        continue
                    if max_price is not None and restaurant.price > max_price:
                        continue
                        
                    filtered_restaurants.append(restaurant)
                except Exception as e:
                    logger.error(f"Error filtering restaurant {restaurant.id}: {e}")
                    continue
            
            # Sort by rating
            filtered_restaurants.sort(key=lambda x: x.rating if x.rating is not None else 0, reverse=True)
            
            results = filtered_restaurants
            
        except Exception as e:
            logger.error(f"Error in restaurant search: {e}")
            db.session.rollback()
        
        return results