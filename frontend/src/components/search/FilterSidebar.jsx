import React, { useState, useEffect } from 'react';
import { useSearch } from '../../context/SearchContext';
import Button from '../ui/Button';
import DietaryBadge from '../ui/DietaryBadge';
import { getFilterOptions } from '../../services/api';

const FilterSidebar = ({ className = '' }) => {
    const { searchParams, setSearchParams, clearSearch } = useSearch();
    const [filterOptions, setFilterOptions] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isFiltersVisible, setIsFiltersVisible] = useState(false);

    // Local state for filters
    const [filters, setFilters] = useState({
        min_rating: searchParams.min_rating || '',
        max_price: searchParams.max_price || '',
        max_distance: searchParams.max_distance || 10,
        dietary_restrictions: searchParams.dietary_restrictions || [],
    });

    // Fetch filter options from API
    useEffect(() => {
        const fetchOptions = async () => {
            try {
                setLoading(true);
                const data = await getFilterOptions();
                setFilterOptions(data);
            } catch (err) {
                console.error('Failed to load filter options:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchOptions();
    }, []);

    // Update local state when search params change
    useEffect(() => {
        setFilters({
            min_rating: searchParams.min_rating || '',
            max_price: searchParams.max_price || '',
            max_distance: searchParams.max_distance || 10,
            dietary_restrictions: searchParams.dietary_restrictions || [],
        });
    }, [searchParams]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFilters({
            ...filters,
            [name]: value,
        });
    };

    const toggleDietaryRestriction = (restriction) => {
        const current = [...filters.dietary_restrictions];
        const index = current.indexOf(restriction);

        if (index > -1) {
            current.splice(index, 1);
        } else {
            current.push(restriction);
        }

        setFilters({
            ...filters,
            dietary_restrictions: current,
        });
    };

    const applyFilters = () => {
        setSearchParams({
            ...searchParams,
            ...filters,
        });
    };

    const resetFilters = () => {
        const resetState = {
            min_rating: '',
            max_price: '',
            max_distance: 10,
            dietary_restrictions: [],
        };

        setFilters(resetState);
        setSearchParams({
            ...searchParams,
            ...resetState,
        });
    };

    return (
        <div className={`bg-white rounded-lg shadow-md ${className}`}>
            {/* Mobile Filter Toggle */}
            <div className="md:hidden p-4">
                <Button
                    onClick={() => setIsFiltersVisible(!isFiltersVisible)}
                    className="w-full flex items-center justify-center"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    {isFiltersVisible ? 'Hide Filters' : 'Show Filters'}
                </Button>
            </div>

            {/* Filter Content - always visible on desktop, toggleable on mobile */}
            <div className={`p-6 ${isFiltersVisible ? 'block' : 'hidden md:block'}`}>
                <h2 className="text-xl font-bold text-primary-dark mb-6">Filters</h2>

                {/* Rating Filter */}
                <div className="mb-6">
                    <label htmlFor="min_rating" className="block text-gray-700 font-medium mb-2">
                        Minimum Rating
                    </label>
                    <select
                        id="min_rating"
                        name="min_rating"
                        value={filters.min_rating}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                        <option value="">Any Rating</option>
                        {filterOptions?.rating_options?.map((option) => (
                            <option key={option.min_rating} value={option.min_rating}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Price Range Filter */}
                <div className="mb-6">
                    <label htmlFor="max_price" className="block text-gray-700 font-medium mb-2">
                        Max Price
                    </label>
                    <select
                        id="max_price"
                        name="max_price"
                        value={filters.max_price}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                        <option value="">Any Price</option>
                        <option value="1">$ (Inexpensive)</option>
                        <option value="2">$$ (Moderate)</option>
                        <option value="3">$$$ (Expensive)</option>
                        <option value="4">$$$$ (Very Expensive)</option>
                    </select>
                </div>

                {/* Distance Filter */}
                <div className="mb-6">
                    <label htmlFor="max_distance" className="block text-gray-700 font-medium mb-2">
                        Max Distance (km): {filters.max_distance}
                    </label>
                    <input
                        type="range"
                        id="max_distance"
                        name="max_distance"
                        min="1"
                        max="50"
                        value={filters.max_distance}
                        onChange={handleInputChange}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>1 km</span>
                        <span>25 km</span>
                        <span>50 km</span>
                    </div>
                </div>

                {/* Dietary Restrictions */}
                <div className="mb-6">
                    <h3 className="block text-gray-700 font-medium mb-3">
                        Dietary Restrictions
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {loading ? (
                            <p className="text-gray-500">Loading options...</p>
                        ) : (
                            filterOptions?.dietary_restrictions?.map((restriction) => (
                                <DietaryBadge
                                    key={restriction}
                                    type={restriction}
                                    size="sm"
                                    onClick={() => toggleDietaryRestriction(restriction)}
                                    className={
                                        filters.dietary_restrictions.includes(restriction)
                                            ? 'ring-2 ring-offset-1 ring-primary'
                                            : 'opacity-70'
                                    }
                                />
                            ))
                        )}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col space-y-3">
                    <Button onClick={applyFilters}>
                        Apply Filters
                    </Button>
                    <Button variant="outline" onClick={resetFilters}>
                        Reset Filters
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default FilterSidebar;