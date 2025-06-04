import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSearch } from '../../context/SearchContext';
import useGeolocation from '../../hooks/useGeolocation';
import Button from '../ui/Button';
import DietaryBadge from '../ui/DietaryBadge';
import { getFilterOptions } from '../../services/api';

const SearchForm = ({ showInlineResults = false }) => {
    const navigate = useNavigate();
    const { 
        searchParams, 
        updateSearchParams, 
        executeSearch, 
        updateSearchParamsAndSearch,
        setAutoSearch 
    } = useSearch();
    
    // Local form state (doesn't trigger searches until submitted)
    const [formData, setFormData] = useState({
        query: searchParams.query || '',
        latitude: searchParams.latitude || '',
        longitude: searchParams.longitude || '',
        max_distance: searchParams.max_distance || 10,
        min_rating: searchParams.min_rating || '',
        max_price: searchParams.max_price || '',
        dietary_restrictions: searchParams.dietary_restrictions || [],
    });
    
    const [filterOptions, setFilterOptions] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const location = useGeolocation();
    
    // Use ref to track if component is mounted
    const isMountedRef = useRef(true);
    const abortControllerRef = useRef(null);

    // Enable auto-search for inline results (like HomePage)
    useEffect(() => {
        if (showInlineResults) {
            setAutoSearch(true);
        }
        return () => {
            if (showInlineResults) {
                setAutoSearch(false);
            }
        };
    }, [showInlineResults, setAutoSearch]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            isMountedRef.current = false;
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    // Fetch filter options from API (only once)
    useEffect(() => {
        const fetchOptions = async () => {
            // Cancel previous request
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }

            const controller = new AbortController();
            abortControllerRef.current = controller;

            try {
                setLoading(true);
                setError(null);
                
                const data = await getFilterOptions({
                    signal: controller.signal
                });
                
                if (isMountedRef.current && !controller.signal.aborted) {
                    setFilterOptions(data);
                }
            } catch (err) {
                if (isMountedRef.current && !controller.signal.aborted) {
                    // Only show error if it's not a cancellation
                    if (err.message !== 'Request was cancelled') {
                        setError('Failed to load filter options');
                        console.error('Failed to load filter options:', err);
                    }
                }
            } finally {
                if (isMountedRef.current && !controller.signal.aborted) {
                    setLoading(false);
                }
            }
        };

        fetchOptions();
    }, []); // Empty dependency array - only run once

    // Update form data when search params change from external sources
    // but DON'T trigger any searches
    useEffect(() => {
        setFormData({
            query: searchParams.query || '',
            latitude: searchParams.latitude || '',
            longitude: searchParams.longitude || '',
            max_distance: searchParams.max_distance || 10,
            min_rating: searchParams.min_rating || '',
            max_price: searchParams.max_price || '',
            dietary_restrictions: searchParams.dietary_restrictions || [],
        });
    }, [searchParams]);

    // Handle location update - just update form data, don't auto-search
    useEffect(() => {
        if (location.latitude && location.longitude) {
            setFormData(prev => ({
                ...prev,
                latitude: location.latitude,
                longitude: location.longitude
            }));
            // Note: Not automatically triggering search here anymore
        }
    }, [location.latitude, location.longitude]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const toggleDietaryRestriction = (restriction) => {
        const normalizedRestriction = restriction.replace('-', '_').toLowerCase();
        const current = [...formData.dietary_restrictions];
        const index = current.indexOf(normalizedRestriction);

        if (index > -1) {
            current.splice(index, 1);
        } else {
            current.push(normalizedRestriction);
        }

        setFormData(prev => ({
            ...prev,
            dietary_restrictions: current
        }));
    };

    const prepareSearchParams = (data) => ({
        query: data.query.trim(),
        latitude: data.latitude ? parseFloat(data.latitude) : null,
        longitude: data.longitude ? parseFloat(data.longitude) : null,
        max_distance: parseInt(data.max_distance),
        min_rating: data.min_rating ? parseFloat(data.min_rating) : null,
        max_price: data.max_price ? parseInt(data.max_price) : null,
        dietary_restrictions: data.dietary_restrictions,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        
        const searchParamsToUpdate = prepareSearchParams(formData);
        
        if (showInlineResults) {
            // For inline results, update params and search will auto-trigger due to auto-search being enabled
            updateSearchParams(searchParamsToUpdate);
        } else {
            // For dedicated search page, update params and navigate
            updateSearchParams(searchParamsToUpdate);
            if (window.location.pathname !== '/search') {
                navigate('/search');
            }
        }
    };

    const handleGetLocation = () => {
        location.requestLocation();
    };

    const handleQuickSearch = (quickQuery) => {
        const updatedFormData = { ...formData, query: quickQuery };
        setFormData(updatedFormData);
        
        const searchParamsToUpdate = prepareSearchParams(updatedFormData);
        
        // For quick searches, immediately execute search
        updateSearchParamsAndSearch(searchParamsToUpdate);
    };

    const handleReset = () => {
        const resetData = {
            query: '',
            latitude: '',
            longitude: '',
            max_distance: 10,
            min_rating: '',
            max_price: '',
            dietary_restrictions: [],
        };
        
        setFormData(resetData);
        updateSearchParams({
            query: '',
            latitude: null,
            longitude: null,
            max_distance: 10,
            min_rating: null,
            max_price: null,
            dietary_restrictions: [],
        });
    };

    // Check if form is valid for submission
    const isFormValid = formData.query.trim() || 
                       (formData.latitude && formData.longitude) || 
                       formData.dietary_restrictions.length > 0;

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-primary-dark">Find Restaurants</h2>
            </div>

            {/* Quick Search Buttons */}
            {!showInlineResults && (
                <div className="mb-6">
                    <label className="block text-gray-700 font-medium mb-3">
                        Quick Search
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {['Pizza', 'Sushi', 'Thai Food', 'Burgers', 'Italian', 'Mexican'].map(query => (
                            <button
                                key={query}
                                type="button"
                                onClick={() => handleQuickSearch(query)}
                                className="px-3 py-1 bg-primary-light text-primary-dark rounded-full text-sm hover:bg-primary hover:text-white transition-colors"
                            >
                                {query}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit}>
                {/* Search query */}
                <div className="mb-4">
                    <label htmlFor="query" className="block text-gray-700 font-medium mb-2">
                        Search
                    </label>
                    <input
                        type="text"
                        id="query"
                        name="query"
                        value={formData.query}
                        onChange={handleInputChange}
                        placeholder="Pizza, Thai food, restaurant name..."
                        className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>

                {/* Location */}
                <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                        <label className="block text-gray-700 font-medium">
                            Location
                        </label>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleGetLocation}
                            disabled={location.loading}
                        >
                            {location.loading ? 'Getting location...' : 'Use my location'}
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                            type="text"
                            id="latitude"
                            name="latitude"
                            value={formData.latitude}
                            onChange={handleInputChange}
                            placeholder="Latitude"
                            className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <input
                            type="text"
                            id="longitude"
                            name="longitude"
                            value={formData.longitude}
                            onChange={handleInputChange}
                            placeholder="Longitude"
                            className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                    {location.error && (
                        <p className="mt-1 text-red-500 text-sm">{location.error}</p>
                    )}
                </div>

                {/* Distance */}
                <div className="mb-4">
                    <label htmlFor="max_distance" className="block text-gray-700 font-medium mb-2">
                        Max Distance (km): {formData.max_distance}
                    </label>
                    <input
                        type="range"
                        id="max_distance"
                        name="max_distance"
                        min="1"
                        max="50"
                        value={formData.max_distance}
                        onChange={handleInputChange}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>1 km</span>
                        <span>25 km</span>
                        <span>50 km</span>
                    </div>
                </div>

                {/* Rating and Price */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <label htmlFor="min_rating" className="block text-gray-700 font-medium mb-2">
                            Minimum Rating
                        </label>
                        <select
                            id="min_rating"
                            name="min_rating"
                            value={formData.min_rating}
                            onChange={handleInputChange}
                            className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="">Any Rating</option>
                            <option value="3">3+ Stars</option>
                            <option value="4">4+ Stars</option>
                            <option value="4.5">4.5+ Stars</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="max_price" className="block text-gray-700 font-medium mb-2">
                            Max Price
                        </label>
                        <select
                            id="max_price"
                            name="max_price"
                            value={formData.max_price}
                            onChange={handleInputChange}
                            className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="">Any Price</option>
                            <option value="1">$ (Inexpensive)</option>
                            <option value="2">$$ (Moderate)</option>
                            <option value="3">$$$ (Expensive)</option>
                            <option value="4">$$$$ (Very Expensive)</option>
                        </select>
                    </div>
                </div>

                {/* Dietary Restrictions */}
                <div className="mb-6">
                    <label className="block text-gray-700 font-medium mb-3">
                        Dietary Restrictions
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {filterOptions?.dietary_restrictions?.map((restriction) => (
                            <DietaryBadge
                                key={restriction}
                                type={restriction}
                                size="md"
                                onClick={() => toggleDietaryRestriction(restriction)}
                                className={
                                    formData.dietary_restrictions.includes(restriction)
                                        ? 'ring-2 ring-offset-2 ring-primary'
                                        : 'opacity-70 hover:opacity-100'
                                }
                            />
                        ))}
                        {loading && (
                            <div className="text-gray-500 text-sm">Loading options...</div>
                        )}
                        {error && (
                            <div className="text-red-500 text-sm">{error}</div>
                        )}
                        {!filterOptions && !loading && !error && (
                            <div className="text-gray-500 text-sm">Options unavailable</div>
                        )}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <Button 
                        type="submit" 
                        className="flex-1"
                        disabled={!isFormValid}
                    >
                        {showInlineResults ? 'Search' : 'Search Restaurants'}
                    </Button>
                    
                    <Button 
                        type="button"
                        variant="outline"
                        onClick={handleReset}
                    >
                        Reset
                    </Button>
                    
                    {showInlineResults && (
                        <Button 
                            type="button"
                            variant="outline"
                            onClick={() => navigate('/search')}
                        >
                            Advanced Search
                        </Button>
                    )}
                </div>

                {/* Help Text */}
                <div className="mt-4 text-sm text-gray-600">
                    <p>
                        💡 <strong>Tip:</strong> {showInlineResults 
                            ? 'Click "Search" to find restaurants. Results will appear below.'
                            : 'Fill in your preferences and click "Search Restaurants" to find matches.'
                        }
                    </p>
                </div>
            </form>
        </div>
    );
};

export default SearchForm;