const API_BASE_URL = 'http://localhost:5000/api';

// Helper function to build query string from params object
const buildQueryString = (params) => {
    const query = Object.entries(params)
        .filter(([_, value]) => value !== null && value !== undefined && value !== '')
        .map(([key, value]) => {
            // Handle arrays like dietary_restrictions
            if (Array.isArray(value)) {
                return value.map(v => `${key}=${encodeURIComponent(v)}`).join('&');
            }
            return `${key}=${encodeURIComponent(value)}`;
        })
        .join('&');

    return query ? `?${query}` : '';
};

// Enhanced fetch with retry logic and better error handling
const enhancedFetch = async (url, options = {}) => {
    const { retries = 2, timeout = 10000, ...fetchOptions } = options;
    
    // Create timeout controller
    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => timeoutController.abort(), timeout);
    
    // Combine timeout with any existing abort signal
    const combinedController = new AbortController();
    const existingSignal = fetchOptions.signal;
    
    if (existingSignal) {
        existingSignal.addEventListener('abort', () => combinedController.abort());
    }
    
    timeoutController.signal.addEventListener('abort', () => combinedController.abort());
    
    try {
        const response = await fetch(url, {
            ...fetchOptions,
            signal: combinedController.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            // Handle specific HTTP errors
            if (response.status === 429) {
                throw new Error('Too many requests. Please wait a moment and try again.');
            } else if (response.status >= 500) {
                throw new Error('Server error. Please try again later.');
            } else if (response.status === 404) {
                throw new Error('Resource not found.');
            } else {
                throw new Error(`Error: ${response.status} ${response.statusText}`);
            }
        }
        
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        
        if (error.name === 'AbortError') {
            throw new Error('Request was cancelled');
        }
        
        // Retry logic for network errors (but not for user-cancelled requests)
        if (retries > 0 && !existingSignal?.aborted && error.message.includes('fetch')) {
            console.log(`Retrying request... (${retries} attempts remaining)`);
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
            return enhancedFetch(url, { ...options, retries: retries - 1 });
        }
        
        throw error;
    }
};

// Restaurant search with enhanced error handling and caching headers
export const searchRestaurants = async (searchParams, options = {}) => {
    try {
        const queryString = buildQueryString(searchParams);
        const url = `${API_BASE_URL}/restaurants/search${queryString}`;
        
        const response = await enhancedFetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                // Add cache control for better performance
                'Cache-Control': 'max-age=300', // 5 minutes
            },
            ...options,
        });

        const data = await response.json();
        
        // Validate response structure
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid response format from server');
        }
        
        return {
            restaurants: data.restaurants || [],
            total_results: data.total_results || 0,
            ...data,
        };
    } catch (error) {
        console.error('Error searching restaurants:', error);
        
        // Re-throw with user-friendly message
        if (error.message === 'Request was cancelled') {
            throw error; // Don't modify abort errors
        }
        
        throw new Error(error.message || 'Failed to search restaurants. Please check your connection and try again.');
    }
};

// Get restaurant details with caching
export const getRestaurantDetails = async (id, options = {}) => {
    try {
        const url = `${API_BASE_URL}/restaurants/${id}`;
        
        const response = await enhancedFetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'max-age=600', // 10 minutes for details
            },
            ...options,
        });

        const data = await response.json();
        
        if (!data || !data.id) {
            throw new Error('Restaurant not found or invalid data received');
        }
        
        return data;
    } catch (error) {
        console.error(`Error fetching restaurant details for ID ${id}:`, error);
        
        if (error.message === 'Request was cancelled') {
            throw error;
        }
        
        throw new Error(error.message || `Failed to load restaurant details. Please try again.`);
    }
};

// Get restaurant insights with enhanced error handling
export const getRestaurantInsights = async (id, options = {}) => {
    try {
        const url = `${API_BASE_URL}/restaurants/insights/${id}`;
        
        const response = await enhancedFetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'max-age=1800', // 30 minutes for insights
            },
            ...options,
        });

        const data = await response.json();
        
        return {
            insights: data.insights || null,
            restaurant_id: data.restaurant_id || id,
            restaurant_name: data.restaurant_name || '',
            ...data,
        };
    } catch (error) {
        console.error(`Error fetching restaurant insights for ID ${id}:`, error);
        
        if (error.message === 'Request was cancelled') {
            throw error;
        }
        
        // Insights are not critical, so provide a softer error
        throw new Error('Unable to load restaurant insights at this time');
    }
};

// Get nearby restaurants with location validation
export const getNearbyRestaurants = async (params, options = {}) => {
    try {
        // Validate required location parameters
        if (!params.latitude || !params.longitude) {
            throw new Error('Location coordinates are required for nearby search');
        }
        
        // Validate coordinate ranges
        if (Math.abs(params.latitude) > 90 || Math.abs(params.longitude) > 180) {
            throw new Error('Invalid location coordinates provided');
        }
        
        const queryString = buildQueryString(params);
        const url = `${API_BASE_URL}/restaurants/nearby${queryString}`;
        
        const response = await enhancedFetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'max-age=300',
            },
            ...options,
        });

        const data = await response.json();
        
        return {
            nearby_restaurants: data.nearby_restaurants || [],
            total_results: data.total_results || 0,
            ...data,
        };
    } catch (error) {
        console.error('Error fetching nearby restaurants:', error);
        
        if (error.message === 'Request was cancelled') {
            throw error;
        }
        
        throw new Error(error.message || 'Failed to find nearby restaurants. Please check your location and try again.');
    }
};

// Get dietary trends with caching
export const getDietaryTrends = async (options = {}) => {
    try {
        const url = `${API_BASE_URL}/restaurants/dietary-trends`;
        
        const response = await enhancedFetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'max-age=3600', // 1 hour for trends
            },
            ...options,
        });

        const data = await response.json();
        
        return {
            dietary_trends: data.dietary_trends || {},
            ...data,
        };
    } catch (error) {
        console.error('Error fetching dietary trends:', error);
        
        if (error.message === 'Request was cancelled') {
            throw error;
        }
        
        throw new Error('Failed to load dietary trends');
    }
};

// Get filter options with caching
export const getFilterOptions = async (options = {}) => {
    try {
        const url = `${API_BASE_URL}/restaurants/filter-options`;
        
        const response = await enhancedFetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'max-age=3600', // 1 hour for filter options
            },
            ...options,
        });

        const data = await response.json();
        
        // Provide defaults if server doesn't return expected structure
        return {
            dietary_restrictions: data.dietary_restrictions || ['vegan', 'vegetarian', 'halal', 'kosher', 'gluten_free'],
            price_ranges: data.price_ranges || [1, 2, 3, 4],
            rating_options: data.rating_options || [
                { min_rating: 3.0, label: '3+ Stars' },
                { min_rating: 4.0, label: '4+ Stars' },
                { min_rating: 4.5, label: '4.5+ Stars' }
            ],
            distance_options: data.distance_options || [
                { max_distance: 1, label: 'Within 1 km' },
                { max_distance: 3, label: 'Within 3 km' },
                { max_distance: 5, label: 'Within 5 km' },
                { max_distance: 10, label: 'Within 10 km' }
            ],
            ...data,
        };
    } catch (error) {
        console.error('Error fetching filter options:', error);
        
        if (error.message === 'Request was cancelled') {
            throw error;
        }
        
        // Return default options if API fails
        return {
            dietary_restrictions: ['vegan', 'vegetarian', 'halal', 'kosher', 'gluten_free'],
            price_ranges: [1, 2, 3, 4],
            rating_options: [
                { min_rating: 3.0, label: '3+ Stars' },
                { min_rating: 4.0, label: '4+ Stars' },
                { min_rating: 4.5, label: '4.5+ Stars' }
            ],
            distance_options: [
                { max_distance: 1, label: 'Within 1 km' },
                { max_distance: 3, label: 'Within 3 km' },
                { max_distance: 5, label: 'Within 5 km' },
                { max_distance: 10, label: 'Within 10 km' }
            ],
        };
    }
};

// Health check endpoint
export const checkApiHealth = async (options = {}) => {
    try {
        const url = `${API_BASE_URL}/health`;
        
        const response = await enhancedFetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: 5000, // Shorter timeout for health checks
            retries: 0, // No retries for health checks
            ...options,
        });

        return await response.json();
    } catch (error) {
        console.warn('API health check failed:', error);
        throw new Error('API is currently unavailable');
    }
};