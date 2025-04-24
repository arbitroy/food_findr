from app import db
from app.models import Restaurant
from typing import List, Optional, Dict, Any
import math

class RestaurantSearchService:
    """
    Simplified restaurant search service with geospatial filtering
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
        max_distance: Optional[float] = None  # in kilometers
    ) -> List[Restaurant]:
        """
        Advanced restaurant search with multiple filters
        
        :param latitude: Search center latitude
        :param longitude: Search center longitude
        :param dietary_restrictions: List of dietary options to filter
        :param min_rating: Minimum restaurant rating
        :param max_price: Maximum price range
        :param query: Text search query
        :param max_distance: Maximum distance from search center
        :return: List of matching restaurants
        """
        # Start with base query
        search_query = Restaurant.query
        
        # Text query filtering
        if query:
            search_query = search_query.filter(
                db.or_(
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
        if min_rating:
            search_query = search_query.filter(Restaurant.rating >= min_rating)
        
        # Price filtering
        if max_price:
            search_query = search_query.filter(Restaurant.price <= max_price)
        
        # Execute initial query
        restaurants = search_query.all()
        
        # Post-query distance filtering
        if latitude is not None and longitude is not None and max_distance is not None:
            filtered_restaurants = []
            for restaurant in restaurants:
                if restaurant.latitude and restaurant.longitude:
                    distance = cls.haversine_distance(
                        latitude, longitude, 
                        restaurant.latitude, restaurant.longitude
                    )
                    if distance <= max_distance:
                        filtered_restaurants.append(restaurant)
            restaurants = filtered_restaurants
        
        # Order by rating
        restaurants.sort(key=lambda x: x.rating or 0, reverse=True)
        
        return restaurants
    
    @classmethod
    def get_dietary_trends(cls) -> Dict[str, float]:
        """
        Calculate overall dietary trends across restaurants
        
        :return: Dictionary of dietary option percentages
        """
        total_restaurants = Restaurant.query.count()
        
        if total_restaurants == 0:
            return {}
        
        trends = {
            'vegan': Restaurant.query.filter(Restaurant.is_vegan == True).count() / total_restaurants * 100,
            'vegetarian': Restaurant.query.filter(Restaurant.is_vegetarian == True).count() / total_restaurants * 100,
            'halal': Restaurant.query.filter(Restaurant.is_halal == True).count() / total_restaurants * 100,
            'kosher': Restaurant.query.filter(Restaurant.is_kosher == True).count() / total_restaurants * 100,
            'gluten_free': Restaurant.query.filter(Restaurant.is_gluten_free == True).count() / total_restaurants * 100
        }
        
        return trends