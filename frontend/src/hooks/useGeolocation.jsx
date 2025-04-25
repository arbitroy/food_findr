import { useState, useEffect } from 'react';

const useGeolocation = (options = {}) => {
    const [location, setLocation] = useState({
        latitude: null,
        longitude: null,
        error: null,
        loading: true
    });

    const onSuccess = (position) => {
        setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            error: null,
            loading: false
        });
    };

    const onError = (error) => {
        setLocation({
            latitude: null,
            longitude: null,
            error: error.message,
            loading: false
        });
    };

    const requestLocation = () => {
        setLocation(prev => ({ ...prev, loading: true }));

        if (!navigator.geolocation) {
            setLocation({
                latitude: null,
                longitude: null,
                error: 'Geolocation is not supported by your browser',
                loading: false
            });
            return;
        }

        navigator.geolocation.getCurrentPosition(onSuccess, onError, options);
    };

    useEffect(() => {
        if (options.enableOnMount) {
            requestLocation();
        } else {
            setLocation(prev => ({ ...prev, loading: false }));
        }
    }, []);

    return { ...location, requestLocation };
};

export default useGeolocation;