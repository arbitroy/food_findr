import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
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

    // Track if search should auto-execute (only for certain scenarios)
    const [autoSearchEnabled, setAutoSearchEnabled] = useState(false);
    
    // Debounced search parameters (only for auto-search scenarios)
    const [debouncedParams, setDebouncedParams] = useState(searchParams);
    
    // Search cache
    const [searchCache, setSearchCache] = useState(new Map());
    
    // Use ref for abort controller to avoid recreating executeSearch
    const abortControllerRef = useRef(null);

    // Debounce search parameters ONLY when auto-search is enabled
    useEffect(() => {
        if (!autoSearchEnabled) return;
        
        const timer = setTimeout(() => {
            setDebouncedParams(searchParams);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchParams, autoSearchEnabled]);

    // Generate cache key from search parameters - stable function
    const getCacheKey = useCallback((params) => {
        return JSON.stringify({
            ...params,
            latitude: params.latitude ? Math.round(params.latitude * 1000) / 1000 : null,
            longitude: params.longitude ? Math.round(params.longitude * 1000) / 1000 : null,
        });
    }, []);

    // Check if search parameters have meaningful values - FIXED VERSION
    const hasSearchParams = useCallback((params) => {
        // Check for meaningful search parameters (excluding max_distance alone)
        const hasQuery = params.query && params.query.trim() !== '';
        const hasLocation = params.latitude !== null && params.longitude !== null;
        const hasDietaryRestrictions = params.dietary_restrictions && params.dietary_restrictions.length > 0;
        const hasRatingFilter = params.min_rating !== null;
        const hasPriceFilter = params.max_price !== null;
        
        // Only return true if we have at least one meaningful search parameter
        // max_distance alone is not considered meaningful since it's just a default
        return hasQuery || hasLocation || hasDietaryRestrictions || hasRatingFilter || hasPriceFilter;
    }, []);

    // Get cached results - stable function
    const getCachedResults = useCallback((params) => {
        const cacheKey = getCacheKey(params);
        const cached = searchCache.get(cacheKey);
        
        if (cached && (Date.now() - cached.cachedAt < 5 * 60 * 1000)) {
            return cached;
        }
        
        return null;
    }, [getCacheKey, searchCache]);

    // Set search results with caching - stable function
    const setSearchResultsWithCache = useCallback((results, params) => {
        const cacheKey = getCacheKey(params);
        
        if (!results.error && !results.loading && results.data.length > 0) {
            setSearchCache(prevCache => {
                const newCache = new Map(prevCache);
                newCache.set(cacheKey, {
                    ...results,
                    cachedAt: Date.now(),
                });
                
                if (newCache.size > 100) {
                    const firstKey = newCache.keys().next().value;
                    newCache.delete(firstKey);
                }
                
                return newCache;
            });
        }
        
        setSearchResults(results);
    }, [getCacheKey]);

    // EXPLICIT SEARCH EXECUTION FUNCTION
    const executeSearch = useCallback(async (paramsToSearch = null) => {
        // Use current searchParams if no params provided
        const targetParams = paramsToSearch || searchParams;
        
        if (!hasSearchParams(targetParams)) {
            setSearchResults({
                loading: false,
                error: null,
                data: [],
                totalResults: 0,
            });
            return;
        }

        // Check cache first
        const cachedResults = getCachedResults(targetParams);
        if (cachedResults) {
            setSearchResults(cachedResults);
            return;
        }

        // Cancel previous request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        const newAbortController = new AbortController();
        abortControllerRef.current = newAbortController;

        try {
            setSearchResults(prevResults => ({
                ...prevResults,
                loading: true,
                error: null,
            }));

            const response = await searchRestaurants(targetParams, {
                signal: newAbortController.signal
            });

            if (!newAbortController.signal.aborted) {
                const newResults = {
                    loading: false,
                    error: null,
                    data: response.restaurants || [],
                    totalResults: response.total_results || 0,
                };
                
                setSearchResultsWithCache(newResults, targetParams);
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
    }, [hasSearchParams, getCachedResults, setSearchResultsWithCache]);

    // AUTO-SEARCH (only when enabled and params change)
    useEffect(() => {
        if (autoSearchEnabled && hasSearchParams(debouncedParams)) {
            executeSearch(debouncedParams);
        }
    }, [debouncedParams, autoSearchEnabled, executeSearch, hasSearchParams]);

    // Batch update search parameters WITHOUT triggering search
    const updateSearchParams = useCallback((updates) => {
        setSearchParams(prevParams => ({
            ...prevParams,
            ...updates,
        }));
    }, []);

    // Update search params AND execute search immediately
    const updateSearchParamsAndSearch = useCallback((updates) => {
        const newParams = {
            ...searchParams,
            ...updates,
        };
        setSearchParams(newParams);
        executeSearch(newParams);
    }, [searchParams, executeSearch]);

    // Enable/disable auto-search (for specific components like HomePage inline results)
    const setAutoSearch = useCallback((enabled) => {
        setAutoSearchEnabled(enabled);
    }, []);

    // Clear search
    const clearSearch = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
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
        
        setAutoSearchEnabled(false);
        
        if (searchCache.size > 50) {
            setSearchCache(new Map());
        }
    }, [searchCache.size]);

    const value = {
        searchParams,
        setSearchParams,
        searchResults,
        executeSearch,           
        updateSearchParams,      
        updateSearchParamsAndSearch,  
        setAutoSearch,          
        autoSearchEnabled,      
        clearSearch,
        hasSearchParams,
        getCachedResults,
    };

    return (
        <SearchContext.Provider value={value}>
            {children}
        </SearchContext.Provider>
    );
};