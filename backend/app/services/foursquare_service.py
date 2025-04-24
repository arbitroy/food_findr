import requests
from flask import current_app
from typing import Dict, List, Optional
import json

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
    ) -> Dict:
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
            print("Response from Foursquare API:", response.json())  # Debugging line
            return response.json()
        except requests.RequestException as e:
            current_app.logger.error(f'Foursquare API Error: {e}')
            return None
    
    @classmethod
    def parse_restaurant_data(cls, api_response: Dict) -> List[Dict]:
        """
        Parse Foursquare API response and extract relevant restaurant information
        
        :param api_response: Raw API response
        :return: List of parsed restaurant dictionaries
        """
        if not api_response or 'results' not in api_response:
            return []
        
        parsed_restaurants = []
        for restaurant in api_response['results']:
            parsed_restaurant = {
                'foursquare_id': restaurant.get('fsq_id'),
                'name': restaurant.get('name'),
                'address': restaurant['location'].get('formatted_address'),
                'latitude': restaurant['geocodes']['main'].get('latitude'),
                'longitude': restaurant['geocodes']['main'].get('longitude'),
                
                # Dietary and feature flags
                'is_vegan': restaurant['features']['attributes'].get('vegan_diet') == 'true',
                'is_vegetarian': restaurant['features']['attributes'].get('vegetarian_diet') == 'true',
                'is_gluten_free': restaurant['features']['attributes'].get('gluten_free_diet') == 'true',
                
                # Additional details
                'rating': restaurant.get('rating', 0),
                'price': restaurant.get('price', 0),
                'categories': [
                    category.get('name') for category in restaurant.get('categories', [])
                ],
                
                # Optional fields
                'website': restaurant.get('website'),
                'phone': restaurant.get('tel'),
                'hours': restaurant.get('hours', {}).get('display'),
                'open_now': restaurant.get('hours', {}).get('open_now', False)
            }
            
            parsed_restaurants.append(parsed_restaurant)
        
        return parsed_restaurants
    
    @classmethod
    def get_restaurants_near(
        cls, 
        latitude: float, 
        longitude: float, 
        **kwargs
    ) -> List[Dict]:
        """
        Convenience method to search and parse restaurants
        
        :param latitude: Search latitude
        :param longitude: Search longitude
        :param kwargs: Additional search parameters
        :return: List of parsed restaurant dictionaries
        """
        api_response = cls.search_restaurants(latitude, longitude, **kwargs)
        if api_response:
            return cls.parse_restaurant_data(api_response)
        return []

# Example usage in a route or service
def fetch_local_restaurants(latitude, longitude):
    """
    Fetch and process local restaurants
    """
    try:
        # Search for restaurants, filter for vegan options
        vegan_restaurants = FoursquareService.get_restaurants_near(
            latitude, 
            longitude, 
            query='vegan',
            radius=5000,  # 5km radius
            limit=20
        )
        
        return vegan_restaurants
    except Exception as e:
        current_app.logger.error(f'Restaurant fetch error: {e}')
        return []