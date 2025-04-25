import requests
from flask import current_app
from typing import Dict, List, Optional, Any
import json
import logging

logger = logging.getLogger(__name__)

class FoursquareService:
    BASE_URL = 'https://api.foursquare.com/v3/places'
    
    @classmethod
    def search_restaurants(
        cls, 
        latitude: float, 
        longitude: float, 
        # Optional parameters with defaults
        query: Optional[str] = None,
        radius: int = 1000,
        categories: Optional[str] = '13000',  # Restaurant category
        limit: int = 50,
        min_price: Optional[int] = None,
        max_price: Optional[int] = None,
        open_now: bool = False,
        sort: str = 'relevance'
    ) -> Dict[str, Any]:
        """
        Search for restaurants near a specific location with advanced filtering
        
        :param latitude: Latitude of the search center
        :param longitude: Longitude of the search center
        :param query: Optional search query to filter restaurants
        :param radius: Search radius in meters (max 100000)
        :param categories: Foursquare category IDs
        :param limit: Maximum number of results (1-50)
        :param min_price: Minimum price range (1-4)
        :param max_price: Maximum price range (1-4)
        :param open_now: Only return currently open restaurants
        :param sort: Result sorting method
        :return: JSON response from Foursquare API
        """
        # Validate inputs
        if not (0 <= radius <= 100000):
            raise ValueError("Radius must be between 0 and 100,000 meters")
        
        if limit < 1 or limit > 50:
            raise ValueError("Limit must be between 1 and 50")
        
        if min_price is not None and (min_price < 1 or min_price > 4):
            raise ValueError("Min price must be between 1 and 4")
        
        if max_price is not None and (max_price < 1 or max_price > 4):
            raise ValueError("Max price must be between 1 and 4")
        
        # Prepare headers
        headers = {
            'Accept': 'application/json',
            'Authorization': current_app.config['FOURSQUARE_API_KEY']
        }
        
        # Prepare query parameters
        params = {
            'll': f'{latitude},{longitude}',
            'radius': radius,
            'limit': limit,
            'sort': sort
        }
        
        # Add optional parameters
        if query:
            params['query'] = query
        
        if categories:
            params['categories'] = categories
        
        if min_price is not None:
            params['min_price'] = min_price
        
        if max_price is not None:
            params['max_price'] = max_price
        
        if open_now:
            params['open_now'] = open_now
        
        try:
            response = requests.get(
                f'{cls.BASE_URL}/search', 
                headers=headers, 
                params=params
            )
            response.raise_for_status()
            logger.info(f"Successfully retrieved data from Foursquare API")
            return response.json()
        except requests.RequestException as e:
            logger.error(f'Foursquare API Error: {e}')
            return {"results": []}  # Return empty results on error
    
    @classmethod
    def parse_restaurant_data(cls, api_response: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Parse Foursquare API response and extract relevant restaurant information
        
        :param api_response: Raw API response
        :return: List of parsed restaurant dictionaries
        """
        if not api_response or 'results' not in api_response:
            logger.warning("Empty or invalid API response")
            return []
        
        parsed_restaurants = []
        
        for restaurant in api_response.get('results', []):
            # Skip if missing required information
            fsq_id = restaurant.get('fsq_id')
            name = restaurant.get('name')
            
            if not fsq_id or not name:
                logger.warning(f"Skipping restaurant with missing ID or name: {restaurant}")
                continue
            
            # Extract location data safely
            location = restaurant.get('location', {})
            address = location.get('formatted_address', '')
            
            # Extract coordinates safely
            geocodes = restaurant.get('geocodes', {})
            main_geocode = geocodes.get('main', {}) if geocodes else {}
            latitude = main_geocode.get('latitude')
            longitude = main_geocode.get('longitude')
            
            # Skip if missing coordinates
            if latitude is None or longitude is None:
                logger.warning(f"Skipping restaurant with missing coordinates: {name}")
                continue
                
            # Extract categories safely
            category_list = []
            for category in restaurant.get('categories', []):
                if category and category.get('name'):
                    category_list.append(category.get('name'))
            
            categories_str = ', '.join(category_list)
            
            # Detect dietary options from name and categories
            combined_text = f"{name.lower()} {categories_str.lower()}"
            
            is_vegan = 'vegan' in combined_text or 'plant-based' in combined_text
            is_vegetarian = 'vegetarian' in combined_text or 'veggie' in combined_text
            is_gluten_free = 'gluten-free' in combined_text or 'gluten free' in combined_text
            is_halal = 'halal' in combined_text
            is_kosher = 'kosher' in combined_text
            
            # Default rating and price if not available
            rating = 4.0  # Default rating
            price = 2  # Default to mid-range
            
            # Create restaurant data
            parsed_restaurant = {
                'foursquare_id': fsq_id,
                'name': name,
                'address': address,
                'latitude': latitude,
                'longitude': longitude,
                'rating': rating,
                'price': price,
                'categories': categories_str,
                'is_vegan': is_vegan,
                'is_vegetarian': is_vegetarian,
                'is_gluten_free': is_gluten_free,
                'is_halal': is_halal,
                'is_kosher': is_kosher,
                'raw_api_data': json.dumps({
                    'name': name,
                    'address': address,
                    'categories': category_list
                })
            }
            
            logger.info(f"Parsed restaurant: {parsed_restaurant['name']} (ID: {parsed_restaurant['foursquare_id']})")
            parsed_restaurants.append(parsed_restaurant)
        
        logger.info(f"Successfully parsed {len(parsed_restaurants)} restaurants from Foursquare data")
        return parsed_restaurants
    
    @classmethod
    def get_restaurants_near(
        cls, 
        latitude: float, 
        longitude: float, 
        **kwargs
    ) -> List[Dict[str, Any]]:
        """
        Convenience method to search and parse restaurants
        
        :param latitude: Search latitude
        :param longitude: Search longitude
        :param kwargs: Additional search parameters
        :return: List of parsed restaurant dictionaries
        """
        api_response = cls.search_restaurants(latitude, longitude, **kwargs)
        restaurants = cls.parse_restaurant_data(api_response)
        logger.info(f"Found {len(restaurants)} restaurants near ({latitude}, {longitude})")
        return restaurants