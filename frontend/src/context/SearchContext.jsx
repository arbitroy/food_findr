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
    
    // Search cache
    const [searchCache, setSearchCache] = useState(new Map());
    
    // Use ref for abort controller and other mutable values
    const abortControllerRef = useRef(null);
    const lastSearchParamsRef = useRef(null);
    const searchTimeoutRef = useRef(null);

    // Generate cache key from search parameters - stable function
    const getCacheKey = useCallback((params) => {
        return JSON.stringify({
            ...params,
            latitude: params.latitude ? Math.round(params.latitude * 1000) / 1000 : null,
            longitude: params.longitude ? Math.round(params.longitude * 1000) / 1000 : null,
        });
    }, []);

    // Check if search parameters have meaningful values - STABLE VERSION
    const hasSearchParams = useCallback((params) => {
        // Check for meaningful search parameters (excluding max_distance alone)
        const hasQuery = params.query && params.query.trim() !== '';
        const hasLocation = params.latitude !== null && params.longitude !== null;
        const hasDietaryRestrictions = params.dietary_restrictions && params.dietary_restrictions.length > 0;
        const hasRatingFilter = params.min_rating !== null;
        const hasPriceFilter = params.max_price !== null;
        
        // Only return true if we have at least one meaningful search parameter
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

    // FIXED: Remove searchParams dependency and make it more stable
    const executeSearch = useCallback(async (paramsToSearch = null) => {
        // Always use passed params or current searchParams at call time
        const currentParams = paramsToSearch || searchParams;
        
        if (!hasSearchParams(currentParams)) {
            setSearchResults({
                loading: false,
                error: null,
                data: [],
                totalResults: 0,
            });
            return;
        }

        // Prevent duplicate searches
        const paramsKey = getCacheKey(currentParams);
        if (lastSearchParamsRef.current === paramsKey) {
            return;
        }
        lastSearchParamsRef.current = paramsKey;

        // Check cache first
        const cachedResults = getCachedResults(currentParams);
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

            const response = await searchRestaurants(currentParams, {
                signal: newAbortController.signal
            });

            if (!newAbortController.signal.aborted) {
                const newResults = {
                    loading: false,
                    error: null,
                    data: response.restaurants || [],
                    totalResults: response.total_results || 0,
                };
                
                setSearchResultsWithCache(newResults, currentParams);
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
    }, [hasSearchParams, getCachedResults, setSearchResultsWithCache, getCacheKey]);

    // FIXED: Debounced auto-search with better control
    useEffect(() => {
        // Clear any existing timeout
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        // Only auto-search if enabled and we have meaningful params
        if (autoSearchEnabled && hasSearchParams(searchParams)) {
            searchTimeoutRef.current = setTimeout(() => {
                executeSearch(searchParams);
            }, 500);
        }

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [searchParams, autoSearchEnabled, hasSearchParams, executeSearch]);

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
        
        // Execute search immediately, bypassing debounce
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        executeSearch(newParams);
    }, [searchParams, executeSearch]);

    // Enable/disable auto-search with better control
    const setAutoSearch = useCallback((enabled) => {
        setAutoSearchEnabled(enabled);
        
        // Clear any pending searches when disabling
        if (!enabled && searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
    }, []);

    // Clear search
    const clearSearch = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        lastSearchParamsRef.current = null;

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