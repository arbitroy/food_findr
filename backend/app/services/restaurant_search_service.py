from app import db
from app.models import Restaurant
from app.services.foursquare_service import FoursquareService
from typing import List, Dict, Optional
import math
from sqlalchemy import or_

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
        if min_rating:
            search_query = search_query.filter(Restaurant.rating >= min_rating)
        
        # Price filtering
        if max_price:
            search_query = search_query.filter(Restaurant.price <= max_price)
        
        # Execute local database search
        local_restaurants = search_query.all()
        
        # Filter by distance if coordinates provided
        if latitude is not None and longitude is not None and max_distance is not None:
            local_restaurants = [
                restaurant for restaurant in local_restaurants
                if restaurant.latitude and restaurant.longitude and
                cls.haversine_distance(
                    latitude, longitude, 
                    restaurant.latitude, restaurant.longitude
                ) <= max_distance
            ]
        
        # If not enough local results, fetch from Foursquare
        if not local_restaurants or len(local_restaurants) < 10:
            # Initialize Foursquare service
            foursquare_service = FoursquareService()
            
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
            foursquare_restaurants = foursquare_service.get_restaurants_near(**foursquare_params)
            
            # Save new restaurants to local database
            new_restaurants = []
            for restaurant_data in foursquare_restaurants:
                # Check if restaurant already exists
                existing = Restaurant.query.filter_by(foursquare_id=restaurant_data['foursquare_id']).first()
                
                if not existing:
                    # Create new restaurant
                    new_restaurant = Restaurant(**restaurant_data)
                    db.session.add(new_restaurant)
                    new_restaurants.append(new_restaurant)
            
            # Commit new restaurants
            db.session.commit()
            
            # Combine local and new restaurants
            local_restaurants.extend(new_restaurants)
        
        # Final filtering and sorting
        filtered_restaurants = []
        for restaurant in local_restaurants:
            # Additional filtering if needed
            if (not min_rating or restaurant.rating >= min_rating) and \
               (not max_price or restaurant.price <= max_price):
                filtered_restaurants.append(restaurant)
        
        # Sort by rating
        filtered_restaurants.sort(key=lambda x: x.rating or 0, reverse=True)
        
        return filtered_restaurants