import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSearch } from '../context/SearchContext';
import { getDietaryTrends, getNearbyRestaurants } from '../services/api';
import SearchForm from '../components/search/SearchForm';
import DietaryBadge from '../components/ui/DietaryBadge';
import RestaurantCard from '../components/restaurants/RestaurantCard';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const HomePage = () => {
    const navigate = useNavigate();
    const { searchParams, setSearchParams } = useSearch();
    const [dietaryTrends, setDietaryTrends] = useState(null);
    const [nearbyRestaurants, setNearbyRestaurants] = useState(null);
    const [loading, setLoading] = useState({
        trends: true,
        nearby: false
    });
    const [error, setError] = useState({
        trends: null,
        nearby: null
    });

    // Fetch dietary trends when the page loads
    useEffect(() => {
        const fetchDietaryTrends = async () => {
            try {
                setLoading(prev => ({ ...prev, trends: true }));
                const data = await getDietaryTrends();
                setDietaryTrends(data.dietary_trends);
            } catch (err) {
                setError(prev => ({ ...prev, trends: 'Failed to load dietary trends' }));
                console.error(err);
            } finally {
                setLoading(prev => ({ ...prev, trends: false }));
            }
        };

        fetchDietaryTrends();
    }, []);

    // Set up dietary restriction filter
    const handleDietaryFilter = (restriction) => {
        setSearchParams({
            ...searchParams,
            dietary_restrictions: [restriction]
        });
        navigate('/search');
    };

    return (
        <div className="max-w-6xl mx-auto">
            {/* Hero Section */}
            <section className="py-12 px-4 md:py-20 text-center">
                <h1 className="text-4xl md:text-5xl font-bold text-primary-dark mb-6">
                    Find Your Perfect Dining Experience
                </h1>
                <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                    Discover restaurants that match your dietary preferences quickly and easily.
                    Whether you're looking for vegan, vegetarian, halal, kosher, or gluten-free options.
                </p>

                {/* Dietary Badges */}
                <div className="flex flex-wrap justify-center gap-3 mb-12">
                    <DietaryBadge type="vegan" size="lg" onClick={() => handleDietaryFilter('vegan')} />
                    <DietaryBadge type="vegetarian" size="lg" onClick={() => handleDietaryFilter('vegetarian')} />
                    <DietaryBadge type="halal" size="lg" onClick={() => handleDietaryFilter('halal')} />
                    <DietaryBadge type="kosher" size="lg" onClick={() => handleDietaryFilter('kosher')} />
                    <DietaryBadge type="gluten_free" size="lg" onClick={() => handleDietaryFilter('gluten_free')} />
                </div>
            </section>

            {/* Search Form Section */}
            <section className="mb-16">
                <div className="max-w-3xl mx-auto px-4">
                    <SearchForm />
                </div>
            </section>

            {/* Dietary Trends Section */}
            <section className="mb-16 px-4">
                <h2 className="text-3xl font-bold text-primary-dark mb-6 text-center">
                    Dietary Trends
                </h2>
                <p className="text-gray-600 text-center mb-8 max-w-3xl mx-auto">
                    Explore the most popular dietary options available at restaurants in our database.
                </p>

                {loading.trends ? (
                    <div className="text-center py-8">
                        <LoadingSpinner />
                    </div>
                ) : error.trends ? (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-center">
                        {error.trends}
                    </div>
                ) : dietaryTrends ? (
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        {Object.entries(dietaryTrends).map(([diet, percentage]) => (
                            <div
                                key={diet}
                                className="bg-white rounded-lg shadow-md p-4 text-center cursor-pointer hover:shadow-lg transition-shadow"
                                onClick={() => handleDietaryFilter(diet)}
                            >
                                <div className="mb-3 flex justify-center">
                                    <DietaryBadge type={diet} />
                                </div>
                                <div className="text-2xl font-bold text-primary-dark mb-1">
                                    {percentage}%
                                </div>
                                <div className="text-gray-600 text-sm">
                                    of restaurants
                                </div>
                            </div>
                        ))}
                    </div>
                ) : null}
            </section>

            {/* Featured Section */}
            <section className="px-4 mb-16">
                <div className="bg-primary-light bg-opacity-20 rounded-xl p-6 md:p-10">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-bold text-primary-dark mb-3">
                            Why Use Food Findr?
                        </h2>
                        <p className="text-gray-600 max-w-3xl mx-auto">
                            We've built features to help you find the perfect restaurant based on your unique dietary needs.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-white p-6 rounded-lg shadow-md">
                            <div className="text-primary-dark text-4xl mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-primary-dark mb-2">Advanced Filtering</h3>
                            <p className="text-gray-600">
                                Find restaurants that match your exact dietary needs with our comprehensive filtering system.
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-md">
                            <div className="text-primary-dark text-4xl mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-primary-dark mb-2">AI-Powered Insights</h3>
                            <p className="text-gray-600">
                                Leverage NLP technology to analyze restaurant reviews and provide accurate dietary information.
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-md">
                            <div className="text-primary-dark text-4xl mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-primary-dark mb-2">Location-Based Results</h3>
                            <p className="text-gray-600">
                                Discover restaurants near you that cater to your dietary preferences using our location services.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Call to Action */}
            <section className="text-center px-4 mb-16">
                <h2 className="text-3xl font-bold text-primary-dark mb-6">
                    Ready to Find Your Next Great Meal?
                </h2>
                <Link to="/search">
                    <Button size="lg">
                        Start Searching Now
                    </Button>
                </Link>
            </section>
        </div>
    );
};

export default HomePage;