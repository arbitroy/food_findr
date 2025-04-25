import React, { useState, useEffect } from 'react';
import { useSearch } from '../context/SearchContext';
import { searchRestaurants } from '../services/api';
import FilterSidebar from '../components/search/FilterSidebar';
import SearchResults from '../components/search/SearchResults';
import Button from '../components/ui/Button';

const SearchPage = () => {
    const [isMobileFilterVisible, setIsMobileFilterVisible] = useState(false);
    const { searchParams, setSearchResults } = useSearch();

    // Perform search when search parameters change
    useEffect(() => {
        const performSearch = async () => {
            // Only search if we have at least one parameter
            const hasParams = Object.values(searchParams).some(value => {
                if (Array.isArray(value)) {
                    return value.length > 0;
                }
                return value !== null && value !== '';
            });

            if (!hasParams) {
                return;
            }

            try {
                setSearchResults({
                    loading: true,
                    error: null,
                    data: [],
                    totalResults: 0,
                });

                const response = await searchRestaurants(searchParams);

                setSearchResults({
                    loading: false,
                    error: null,
                    data: response.restaurants || [],
                    totalResults: response.total_results || 0,
                });
            } catch (error) {
                console.error('Search error:', error);
                setSearchResults({
                    loading: false,
                    error: 'Failed to fetch search results. Please try again.',
                    data: [],
                    totalResults: 0,
                });
            }
        };

        performSearch();
    }, [searchParams, setSearchResults]);

    return (
        <div className="max-w-7xl mx-auto">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-primary-dark">Search Restaurants</h1>
                <p className="text-gray-600 mt-2">
                    Find restaurants based on your preferences and dietary needs
                </p>
            </div>

            {/* Mobile Filter Toggle */}
            <div className="md:hidden mb-4">
                <Button
                    onClick={() => setIsMobileFilterVisible(!isMobileFilterVisible)}
                    variant="secondary"
                    className="w-full"
                >
                    {isMobileFilterVisible ? 'Hide Filters' : 'Show Filters'}
                </Button>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
                {/* Sidebar - Always visible on desktop, toggleable on mobile */}
                <div className={`md:w-1/4 ${isMobileFilterVisible ? 'block' : 'hidden md:block'}`}>
                    <FilterSidebar />
                </div>

                {/* Main Content */}
                <div className="md:w-3/4">
                    <SearchResults />
                </div>
            </div>
        </div>
    );
};

export default SearchPage;