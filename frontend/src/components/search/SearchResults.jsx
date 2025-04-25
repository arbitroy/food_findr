import React from 'react';
import { useSearch } from '../../context/SearchContext';
import RestaurantCard from '../restaurants/RestaurantCard';
import LoadingSpinner from '../ui/LoadingSpinner';

const SearchResults = () => {
    const { searchResults } = useSearch();
    const { loading, error, data, totalResults } = searchResults;

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <LoadingSpinner size="lg" />
                <p className="mt-4 text-gray-600">Searching for restaurants...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-6 rounded-lg text-center">
                <h3 className="text-lg font-medium mb-2">Error</h3>
                <p>{error}</p>
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-8 rounded-lg text-center">
                <h3 className="text-lg font-medium mb-2">No Results Found</h3>
                <p>Try adjusting your search criteria or filters.</p>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-6 flex justify-between items-center">
                <h2 className="text-xl font-bold text-primary-dark">
                    {totalResults} {totalResults === 1 ? 'Restaurant' : 'Restaurants'} Found
                </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.map((restaurant) => (
                    <RestaurantCard key={restaurant.id} restaurant={restaurant} />
                ))}
            </div>
        </div>
    );
};

export default SearchResults;