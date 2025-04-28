import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Add this import
import { useSearch } from '../../context/SearchContext';
import useGeolocation from '../../hooks/useGeolocation';
import Button from '../ui/Button';
import DietaryBadge from '../ui/DietaryBadge';
import { getFilterOptions } from '../../services/api';

const SearchForm = () => {
    const navigate = useNavigate(); // Add this hook
    const { searchParams, setSearchParams } = useSearch();
    const [formData, setFormData] = useState({
        query: searchParams.query || '',
        latitude: searchParams.latitude || '',
        longitude: searchParams.longitude || '',
        max_distance: searchParams.max_distance || 10,
        min_rating: searchParams.min_rating || '',
        max_price: searchParams.max_price || '',
    });
    const [filterOptions, setFilterOptions] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const location = useGeolocation();

    // Fetch filter options from API
    useEffect(() => {
        const fetchOptions = async () => {
            try {
                setLoading(true);
                const data = await getFilterOptions();
                setFilterOptions(data);
            } catch (err) {
                setError('Failed to load filter options');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchOptions();
    }, []);

    // Use geolocation data when available
    useEffect(() => {
        if (location.latitude && location.longitude) {
            setFormData(prev => ({
                ...prev,
                latitude: location.latitude,
                longitude: location.longitude
            }));
        }
    }, [location.latitude, location.longitude]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const toggleDietaryRestriction = (restriction) => {
        // Normalize the restriction name to ensure consistency
        const normalizedRestriction = restriction.replace('-', '_').toLowerCase();
        const current = [...(searchParams.dietary_restrictions || [])];
        const index = current.indexOf(normalizedRestriction);

        if (index > -1) {
            current.splice(index, 1);
        } else {
            current.push(normalizedRestriction);
        }

        setSearchParams({
            ...searchParams,
            dietary_restrictions: current
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Ensure latitude and longitude are valid numbers if provided
        const updatedFormData = {
            ...formData,
            latitude: formData.latitude ? parseFloat(formData.latitude) : null,
            longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        };
        
        setSearchParams({
            ...searchParams,
            ...updatedFormData
        });
        
        // Navigate to search page if not already there
        if (window.location.pathname !== '/search') {
            navigate('/search');
        }
    };

    const handleGetLocation = () => {
        location.requestLocation();
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-primary-dark mb-6">Find Restaurants</h2>

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
                        placeholder="Pizza, Thai food, etc."
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
                    {/* Rating */}
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

                    {/* Price */}
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
                                    searchParams.dietary_restrictions?.includes(restriction)
                                        ? 'ring-2 ring-offset-2 ring-primary'
                                        : 'opacity-70'
                                }
                            />
                        ))}
                        {!filterOptions && !error && (
                            <div className="text-gray-500">Loading options...</div>
                        )}
                        {error && (
                            <div className="text-red-500">{error}</div>
                        )}
                    </div>
                </div>

                {/* Submit Button */}
                <Button type="submit" className="w-full">
                    Search Restaurants
                </Button>
            </form>
        </div>
    );
};

export default SearchForm;