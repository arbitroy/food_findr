import React, { useState, useEffect } from 'react';
import { useSearch } from '../../context/SearchContext';
import Button from '../ui/Button';
import DietaryBadge from '../ui/DietaryBadge';
import { getFilterOptions } from '../../services/api';

const FilterSidebar = ({ className = '' }) => {
    const { searchParams, updateSearchParams, clearSearch } = useSearch();
    const [filterOptions, setFilterOptions] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isFiltersVisible, setIsFiltersVisible] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Local state for filters (doesn't trigger searches until applied)
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

    // Update local state when search params change (from external sources)
    useEffect(() => {
        setFilters({
            min_rating: searchParams.min_rating || '',
            max_price: searchParams.max_price || '',
            max_distance: searchParams.max_distance || 10,
            dietary_restrictions: searchParams.dietary_restrictions || [],
        });
        setHasUnsavedChanges(false);
    }, [searchParams]);

    // Check if filters have changed from current search params
    useEffect(() => {
        const filtersChanged = 
            filters.min_rating !== (searchParams.min_rating || '') ||
            filters.max_price !== (searchParams.max_price || '') ||
            filters.max_distance !== (searchParams.max_distance || 10) ||
            JSON.stringify(filters.dietary_restrictions.sort()) !== JSON.stringify((searchParams.dietary_restrictions || []).sort());
        
        setHasUnsavedChanges(filtersChanged);
    }, [filters, searchParams]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const toggleDietaryRestriction = (restriction) => {
        const normalizedRestriction = restriction.replace('-', '_').toLowerCase();
        const current = [...filters.dietary_restrictions];
        const index = current.indexOf(normalizedRestriction);

        if (index > -1) {
            current.splice(index, 1);
        } else {
            current.push(normalizedRestriction);
        }

        setFilters(prev => ({
            ...prev,
            dietary_restrictions: current,
        }));
    };

    const applyFilters = () => {
        // Batch update all filter parameters at once
        const updates = {
            min_rating: filters.min_rating ? parseFloat(filters.min_rating) : null,
            max_price: filters.max_price ? parseInt(filters.max_price) : null,
            max_distance: parseInt(filters.max_distance),
            dietary_restrictions: filters.dietary_restrictions,
        };

        updateSearchParams(updates);
        
        // Close mobile filters after applying
        setIsFiltersVisible(false);
    };

    const resetFilters = () => {
        const resetState = {
            min_rating: '',
            max_price: '',
            max_distance: 10,
            dietary_restrictions: [],
        };

        setFilters(resetState);
        
        // Apply reset immediately
        updateSearchParams({
            min_rating: null,
            max_price: null,
            max_distance: 10,
            dietary_restrictions: [],
        });
    };

    const clearAllSearch = () => {
        clearSearch();
        setIsFiltersVisible(false);
    };

    // Quick filter presets
    const quickFilters = [
        { label: 'Highly Rated (4+)', updates: { min_rating: 4 } },
        { label: 'Budget Friendly ($)', updates: { max_price: 1 } },
        { label: 'Nearby (5km)', updates: { max_distance: 5 } },
        { label: 'Premium ($$$+)', updates: { min_rating: 4, max_price: 4 } },
    ];

    const applyQuickFilter = (quickFilter) => {
        const newFilters = { ...filters, ...quickFilter.updates };
        setFilters(newFilters);
        
        // Apply immediately for quick filters
        const updates = {
            min_rating: newFilters.min_rating ? parseFloat(newFilters.min_rating) : null,
            max_price: newFilters.max_price ? parseInt(newFilters.max_price) : null,
            max_distance: parseInt(newFilters.max_distance),
            dietary_restrictions: newFilters.dietary_restrictions,
        };
        
        updateSearchParams(updates);
    };

    return (
        <div className={`bg-white rounded-lg shadow-md ${className}`}>
            {/* Mobile Filter Toggle */}
            <div className="md:hidden p-4 border-b border-gray-200">
                <Button
                    onClick={() => setIsFiltersVisible(!isFiltersVisible)}
                    className="w-full flex items-center justify-center"
                    variant={hasUnsavedChanges ? "primary" : "outline"}
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
                    {hasUnsavedChanges && (
                        <span className="ml-2 w-2 h-2 bg-amber-400 rounded-full"></span>
                    )}
                </Button>
            </div>

            {/* Filter Content */}
            <div className={`p-6 ${isFiltersVisible ? 'block' : 'hidden md:block'}`}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-primary-dark">Filters</h2>
                    {hasUnsavedChanges && (
                        <span className="text-sm text-amber-600 font-medium">
                            Unsaved
                        </span>
                    )}
                </div>

                {/* Quick Filters */}
                <div className="mb-6">
                    <h3 className="block text-gray-700 font-medium mb-3">
                        Quick Filters
                    </h3>
                    <div className="grid grid-cols-1 gap-2">
                        {quickFilters.map((quickFilter, index) => (
                            <button
                                key={index}
                                type="button"
                                onClick={() => applyQuickFilter(quickFilter)}
                                className="text-left px-3 py-2 bg-gray-50 hover:bg-primary-light hover:text-primary-dark rounded text-sm transition-colors"
                            >
                                {quickFilter.label}
                            </button>
                        ))}
                    </div>
                </div>

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
                            <p className="text-gray-500 text-sm">Loading options...</p>
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
                                            : 'opacity-70 hover:opacity-100'
                                    }
                                />
                            ))
                        )}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col space-y-3">
                    {hasUnsavedChanges && (
                        <Button onClick={applyFilters} className="w-full">
                            Apply Filters
                        </Button>
                    )}
                    
                    <div className="flex gap-2">
                        <Button 
                            variant="outline" 
                            onClick={resetFilters}
                            className="flex-1"
                        >
                            Reset Filters
                        </Button>
                        <Button 
                            variant="text" 
                            onClick={clearAllSearch}
                            className="flex-1"
                        >
                            Clear All
                        </Button>
                    </div>
                </div>

                {/* Active Filters Summary */}
                {(searchParams.min_rating || searchParams.max_price || searchParams.dietary_restrictions?.length > 0) && (
                    <div className="mt-6 pt-4 border-t border-gray-200">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Active Filters:</h4>
                        <div className="flex flex-wrap gap-1 text-xs">
                            {searchParams.min_rating && (
                                <span className="bg-primary-light text-primary-dark px-2 py-1 rounded">
                                    {searchParams.min_rating}+ Stars
                                </span>
                            )}
                            {searchParams.max_price && (
                                <span className="bg-primary-light text-primary-dark px-2 py-1 rounded">
                                    {'$'.repeat(searchParams.max_price)} Max
                                </span>
                            )}
                            {searchParams.dietary_restrictions?.map(restriction => (
                                <span key={restriction} className="bg-primary-light text-primary-dark px-2 py-1 rounded">
                                    {restriction.replace('_', ' ')}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Filter Tips */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="text-xs text-gray-600">
                        <p className="mb-1">💡 <strong>Pro Tips:</strong></p>
                        <ul className="list-disc list-inside space-y-1">
                            <li>Use quick filters for common preferences</li>
                            <li>Combine multiple dietary restrictions</li>
                            <li>Increase distance if no results found</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FilterSidebar;