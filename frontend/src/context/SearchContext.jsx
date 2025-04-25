import { createContext, useContext, useState } from 'react';

const SearchContext = createContext();

export const useSearch = () => {
    const context = useContext(SearchContext);
    if (!context) {
        throw new Error('useSearch must be used within a SearchProvider');
    }
    return context;
};

export const SearchProvider = ({ children }) => {
    const [searchParams, setSearchParams] = useState({
        latitude: null,
        longitude: null,
        query: '',
        dietary_restrictions: [],
        min_rating: null,
        max_price: null,
        max_distance: 10,
    });

    const [searchResults, setSearchResults] = useState({
        loading: false,
        error: null,
        data: [],
        totalResults: 0,
    });

    const addDietaryRestriction = (restriction) => {
        if (!searchParams.dietary_restrictions.includes(restriction)) {
            setSearchParams({
                ...searchParams,
                dietary_restrictions: [...searchParams.dietary_restrictions, restriction],
            });
        }
    };

    const removeDietaryRestriction = (restriction) => {
        setSearchParams({
            ...searchParams,
            dietary_restrictions: searchParams.dietary_restrictions.filter(r => r !== restriction),
        });
    };

    const clearSearch = () => {
        setSearchParams({
            latitude: null,
            longitude: null,
            query: '',
            dietary_restrictions: [],
            min_rating: null,
            max_price: null,
            max_distance: 10,
        });
        setSearchResults({
            loading: false,
            error: null,
            data: [],
            totalResults: 0,
        });
    };

    const value = {
        searchParams,
        setSearchParams,
        searchResults,
        setSearchResults,
        addDietaryRestriction,
        removeDietaryRestriction,
        clearSearch,
    };

    return (
        <SearchContext.Provider value={value}>
            {children}
        </SearchContext.Provider>
    );
};