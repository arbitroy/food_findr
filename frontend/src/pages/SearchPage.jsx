import React, { useState, useEffect } from 'react';
import { useSearch } from '../context/SearchContext';
import FilterSidebar from '../components/search/FilterSidebar';
import SearchResults from '../components/search/SearchResults';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const SearchPage = () => {
    const [isMobileFilterVisible, setIsMobileFilterVisible] = useState(false);
    const { 
        searchParams, 
        searchResults,
        hasSearchParams,
        executeSearch
    } = useSearch();

    // Check if we have search params
    const hasSearched = hasSearchParams(searchParams);

    // Execute search when page loads if we have parameters (e.g., coming from HomePage)
    useEffect(() => {
        if (hasSearched && searchResults.data.length === 0 && !searchResults.loading && !searchResults.error) {
            // Execute search if we have params but no results yet
            executeSearch();
        }
    }, [hasSearched, searchResults.data.length, searchResults.loading, searchResults.error, executeSearch]);

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-primary-dark">Search Restaurants</h1>
                        <p className="text-gray-600 mt-2">
                            Find restaurants based on your preferences and dietary needs
                        </p>
                    </div>
                    
                    {/* Search Status */}
                    {hasSearched && (
                        <div className="flex items-center gap-2">
                            {searchResults.loading && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <LoadingSpinner size="sm" />
                                    <span>Searching...</span>
                                </div>
                            )}
                            
                            {!searchResults.loading && searchResults.totalResults > 0 && (
                                <div className="text-sm text-gray-600">
                                    <span className="font-medium">{searchResults.totalResults}</span> results found
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Search Parameters Summary */}
            {hasSearched && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="font-medium text-blue-900">Active Search:</span>
                        
                        {searchParams.query && (
                            <span className="bg-blue-200 text-blue-800 px-2 py-1 rounded">
                                "{searchParams.query}"
                            </span>
                        )}
                        
                        {searchParams.latitude && searchParams.longitude && (
                            <span className="bg-blue-200 text-blue-800 px-2 py-1 rounded">
                                Location: {searchParams.latitude.toFixed(3)}, {searchParams.longitude.toFixed(3)}
                            </span>
                        )}
                        
                        {searchParams.max_distance && (
                            <span className="bg-blue-200 text-blue-800 px-2 py-1 rounded">
                                Within {searchParams.max_distance}km
                            </span>
                        )}
                        
                        {searchParams.min_rating && (
                            <span className="bg-blue-200 text-blue-800 px-2 py-1 rounded">
                                {searchParams.min_rating}+ stars
                            </span>
                        )}
                        
                        {searchParams.max_price && (
                            <span className="bg-blue-200 text-blue-800 px-2 py-1 rounded">
                                {'$'.repeat(searchParams.max_price)} max
                            </span>
                        )}
                        
                        {searchParams.dietary_restrictions?.map(restriction => (
                            <span key={restriction} className="bg-green-200 text-green-800 px-2 py-1 rounded">
                                {restriction.replace('_', ' ')}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Mobile Filter Toggle */}
            <div className="md:hidden mb-4">
                <Button
                    onClick={() => setIsMobileFilterVisible(!isMobileFilterVisible)}
                    variant="secondary"
                    className="w-full"
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
                    {isMobileFilterVisible ? 'Hide Filters' : 'Show Filters'}
                </Button>
            </div>

            {/* Main Content Layout */}
            <div className="flex flex-col md:flex-row gap-6">
                {/* Sidebar - Always visible on desktop, toggleable on mobile */}
                <div className={`md:w-1/4 ${isMobileFilterVisible ? 'block' : 'hidden md:block'}`}>
                    <FilterSidebar />
                </div>

                {/* Main Content */}
                <div className="md:w-3/4">
                    {/* Search Results - SearchResults component handles all loading/error/empty states */}
                    <SearchResults />
                    
                    {/* Empty State - when no search parameters are set */}
                    {!hasSearched && !searchResults.loading && (
                        <div className="text-center py-16">
                            <div className="max-w-md mx-auto">
                                <svg
                                    className="mx-auto h-24 w-24 text-gray-400 mb-6"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1}
                                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                    />
                                </svg>
                                <h3 className="text-xl font-medium text-gray-900 mb-2">
                                    Start Your Search
                                </h3>
                                <p className="text-gray-600 mb-6">
                                    Use the filters on the left to find restaurants that match your preferences.
                                </p>
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                                    <h4 className="font-medium text-blue-900 mb-2">Quick Start Tips:</h4>
                                    <ul className="text-sm text-blue-800 space-y-1">
                                        <li>• Set your location for nearby results</li>
                                        <li>• Choose dietary restrictions if needed</li>
                                        <li>• Adjust rating and price filters</li>
                                        <li>• Use quick filters for common preferences</li>
                                        <li>• Click "Apply & Search" to execute your search</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Search Tips - Only show when no active search */}
            {!hasSearched && (
                <div className="mt-12 bg-primary-light bg-opacity-20 rounded-lg p-6">
                    <h2 className="text-xl font-bold text-primary-dark mb-4">
                        Get Better Search Results
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center">
                            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-3">
                                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <h3 className="font-medium text-primary-dark mb-2">Use Your Location</h3>
                            <p className="text-sm text-gray-600">
                                Enable location services to find restaurants near you with accurate distances.
                            </p>
                        </div>
                        
                        <div className="text-center">
                            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-3">
                                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 011 1v1a1 1 0 01-1 1h-1v12a2 2 0 01-2 2H6a2 2 0 01-2-2V7H3a1 1 0 01-1-1V5a1 1 0 011-1h4z" />
                                </svg>
                            </div>
                            <h3 className="font-medium text-primary-dark mb-2">Set Dietary Preferences</h3>
                            <p className="text-sm text-gray-600">
                                Filter by vegan, vegetarian, halal, kosher, or gluten-free options.
                            </p>
                        </div>
                        
                        <div className="text-center">
                            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-3">
                                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                </svg>
                            </div>
                            <h3 className="font-medium text-primary-dark mb-2">Apply Filters & Search</h3>
                            <p className="text-sm text-gray-600">
                                Don't forget to click "Apply & Search" after setting your filters to see results.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchPage;