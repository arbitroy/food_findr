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

// Restaurant search
export const searchRestaurants = async (searchParams) => {
    try {
        const queryString = buildQueryString(searchParams);
        const response = await fetch(`${API_BASE_URL}/restaurants/search${queryString}`);

        if (!response.ok) {
            throw new Error(`Error: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error searching restaurants:', error);
        throw error;
    }
};

// Get restaurant details
export const getRestaurantDetails = async (id) => {
    try {
        const response = await fetch(`${API_BASE_URL}/restaurants/${id}`);

        if (!response.ok) {
            throw new Error(`Error: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`Error fetching restaurant details for ID ${id}:`, error);
        throw error;
    }
};

// Get restaurant insights
export const getRestaurantInsights = async (id) => {
    try {
        const response = await fetch(`${API_BASE_URL}/restaurants/insights/${id}`);

        if (!response.ok) {
            throw new Error(`Error: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`Error fetching restaurant insights for ID ${id}:`, error);
        throw error;
    }
};

// Get nearby restaurants
export const getNearbyRestaurants = async (params) => {
    try {
        const queryString = buildQueryString(params);
        const response = await fetch(`${API_BASE_URL}/restaurants/nearby${queryString}`);

        if (!response.ok) {
            throw new Error(`Error: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching nearby restaurants:', error);
        throw error;
    }
};

// Get dietary trends
export const getDietaryTrends = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/restaurants/dietary-trends`);

        if (!response.ok) {
            throw new Error(`Error: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching dietary trends:', error);
        throw error;
    }
};

// Get filter options
export const getFilterOptions = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/restaurants/filter-options`);

        if (!response.ok) {
            throw new Error(`Error: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching filter options:', error);
        throw error;
    }
};