import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { searchRestaurants } from '../services/api';

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

    // Debounced search parameters
    const [debouncedParams, setDebouncedParams] = useState(searchParams);
    
    // Search cache
    const [searchCache, setSearchCache] = useState(new Map());
    
    // Active request controller for cancelling previous requests
    const [abortController, setAbortController] = useState(null);

    // Debounce search parameters (500ms delay)
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedParams(searchParams);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchParams]);

    // Generate cache key from search parameters
    const getCacheKey = useCallback((params) => {
        return JSON.stringify({
            ...params,
            // Round coordinates to reduce cache misses from small location changes
            latitude: params.latitude ? Math.round(params.latitude * 1000) / 1000 : null,
            longitude: params.longitude ? Math.round(params.longitude * 1000) / 1000 : null,
        });
    }, []);

    // Check if search parameters have meaningful values
    const hasSearchParams = useCallback((params) => {
        return Object.values(params).some(value => {
            if (Array.isArray(value)) {
                return value.length > 0;
            }
            return value !== null && value !== '';
        });
    }, []);

    // Get cached results if available and not stale (5 minutes)
    const getCachedResults = useCallback((params) => {
        const cacheKey = getCacheKey(params);
        const cached = searchCache.get(cacheKey);
        
        if (cached && (Date.now() - cached.cachedAt < 5 * 60 * 1000)) {
            return cached;
        }
        
        return null;
    }, [getCacheKey, searchCache]);

    // Set search results with caching
    const setSearchResultsWithCache = useCallback((results, params) => {
        const cacheKey = getCacheKey(params);
        
        // Cache successful results
        if (!results.error && !results.loading && results.data.length > 0) {
            setSearchCache(prevCache => {
                const newCache = new Map(prevCache);
                newCache.set(cacheKey, {
                    ...results,
                    cachedAt: Date.now(),
                });
                
                // Limit cache size
                if (newCache.size > 100) {
                    const firstKey = newCache.keys().next().value;
                    newCache.delete(firstKey);
                }
                
                return newCache;
            });
        }
        
        setSearchResults(results);
    }, [getCacheKey]);

    // CENTRALIZED SEARCH EXECUTION - This is the only place search happens
    useEffect(() => {
        const performSearch = async () => {
            if (!hasSearchParams(debouncedParams)) {
                // Clear results if no search params
                setSearchResults({
                    loading: false,
                    error: null,
                    data: [],
                    totalResults: 0,
                });
                return;
            }

            // Check cache first
            const cachedResults = getCachedResults(debouncedParams);
            if (cachedResults) {
                setSearchResults(cachedResults);
                return;
            }

            // Cancel previous request
            if (abortController) {
                abortController.abort();
            }

            // Create new abort controller
            const newAbortController = new AbortController();
            setAbortController(newAbortController);

            try {
                // Set loading state while keeping previous results visible
                setSearchResults(prevResults => ({
                    ...prevResults,
                    loading: true,
                    error: null,
                }));

                const response = await searchRestaurants(debouncedParams, {
                    signal: newAbortController.signal
                });

                if (!newAbortController.signal.aborted) {
                    const newResults = {
                        loading: false,
                        error: null,
                        data: response.restaurants || [],
                        totalResults: response.total_results || 0,
                    };
                    
                    setSearchResultsWithCache(newResults, debouncedParams);
                }
            } catch (error) {
                if (!newAbortController.signal.aborted) {
                    console.error('Search error:', error);
                    setSearchResults({
                        loading: false,
                        error: 'Failed to fetch search results. Please try again.',
                        data: [],
                        totalResults: 0,
                    });
                }
            }
        };

        performSearch();

        // Cleanup function to abort request on unmount
        return () => {
            if (abortController) {
                abortController.abort();
            }
        };
    }, [debouncedParams, hasSearchParams, getCachedResults, setSearchResultsWithCache, abortController]);

    // Add dietary restriction helper
    const addDietaryRestriction = useCallback((restriction) => {
        setSearchParams(prevParams => {
            if (!prevParams.dietary_restrictions.includes(restriction)) {
                return {
                    ...prevParams,
                    dietary_restrictions: [...prevParams.dietary_restrictions, restriction],
                };
            }
            return prevParams;
        });
    }, []);

    // Remove dietary restriction helper
    const removeDietaryRestriction = useCallback((restriction) => {
        setSearchParams(prevParams => ({
            ...prevParams,
            dietary_restrictions: prevParams.dietary_restrictions.filter(r => r !== restriction),
        }));
    }, []);

    // Batch update search parameters
    const updateSearchParams = useCallback((updates) => {
        setSearchParams(prevParams => ({
            ...prevParams,
            ...updates,
        }));
    }, []);

    // Clear search and cache
    const clearSearch = useCallback(() => {
        // Cancel any ongoing request
        if (abortController) {
            abortController.abort();
        }

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
        
        // Clear cache if it gets too large (> 50 entries)
        if (searchCache.size > 50) {
            setSearchCache(new Map());
        }
    }, [abortController, searchCache.size]);

    const value = {
        searchParams,
        setSearchParams,
        searchResults,
        setSearchResults,
        debouncedParams,
        searchCache,
        abortController,
        setAbortController,
        addDietaryRestriction,
        removeDietaryRestriction,
        updateSearchParams,
        clearSearch,
        hasSearchParams,
        getCachedResults,
        setSearchResultsWithCache,
    };

    return (
        <SearchContext.Provider value={value}>
            {children}
        </SearchContext.Provider>
    );
};