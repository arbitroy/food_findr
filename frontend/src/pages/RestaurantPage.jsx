import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getRestaurantDetails, getRestaurantInsights } from '../services/api';
import RestaurantDetails from '../components/restaurants/RestaurantDetails';
import ReviewsSection from '../components/restaurants/ReviewsSection';
import InsightsSection from '../components/restaurants/InsightsSection';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Button from '../components/ui/Button';

const RestaurantPage = () => {
    const { id } = useParams();
    const [restaurant, setRestaurant] = useState(null);
    const [insights, setInsights] = useState(null);
    const [loading, setLoading] = useState({
        details: true,
        insights: true
    });
    const [error, setError] = useState({
        details: null,
        insights: null
    });

    // Fetch restaurant details
    useEffect(() => {
        const fetchRestaurantDetails = async () => {
            try {
                setLoading(prev => ({ ...prev, details: true }));
                const data = await getRestaurantDetails(id);
                setRestaurant(data);
            } catch (err) {
                console.error('Error fetching restaurant details:', err);
                setError(prev => ({ ...prev, details: 'Failed to load restaurant details' }));
            } finally {
                setLoading(prev => ({ ...prev, details: false }));
            }
        };

        if (id) {
            fetchRestaurantDetails();
        }
    }, [id]);

    // Fetch restaurant insights
    useEffect(() => {
        const fetchRestaurantInsights = async () => {
            try {
                setLoading(prev => ({ ...prev, insights: true }));
                const data = await getRestaurantInsights(id);
                setInsights(data.insights);
            } catch (err) {
                console.error('Error fetching restaurant insights:', err);
                setError(prev => ({ ...prev, insights: 'Failed to load restaurant insights' }));
            } finally {
                setLoading(prev => ({ ...prev, insights: false }));
            }
        };

        if (id) {
            fetchRestaurantInsights();
        }
    }, [id]);

    if (loading.details) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <LoadingSpinner size="lg" />
                <p className="mt-4 text-gray-600">Loading restaurant details...</p>
            </div>
        );
    }

    if (error.details) {
        return (
            <div className="max-w-4xl mx-auto px-4">
                <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-8 rounded-lg text-center">
                    <h2 className="text-xl font-bold mb-2">Error</h2>
                    <p className="mb-6">{error.details}</p>
                    <Link to="/search">
                        <Button variant="primary">Back to Search</Button>
                    </Link>
                </div>
            </div>
        );
    }

    if (!restaurant) {
        return (
            <div className="max-w-4xl mx-auto px-4">
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-6 py-8 rounded-lg text-center">
                    <h2 className="text-xl font-bold mb-2">Restaurant Not Found</h2>
                    <p className="mb-6">The restaurant you're looking for could not be found.</p>
                    <Link to="/search">
                        <Button variant="primary">Back to Search</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-4 pb-12">
            {/* Back Button */}
            <div className="mb-6">
                <Link to="/search" className="inline-flex items-center text-primary hover:text-primary-dark">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                    Back to search results
                </Link>
            </div>

            {/* Restaurant Details */}
            <RestaurantDetails restaurant={restaurant} />

            {/* Insights Section */}
            <InsightsSection
                insights={insights}
                loading={loading.insights}
                error={error.insights}
            />

            {/* Reviews Section */}
            {restaurant.recent_reviews && (
                <ReviewsSection reviews={restaurant.recent_reviews} />
            )}
        </div>
    );
};

export default RestaurantPage;