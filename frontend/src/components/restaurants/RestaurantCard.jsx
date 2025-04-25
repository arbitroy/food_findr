import React from 'react';
import { Link } from 'react-router-dom';
import DietaryBadge from '../ui/DietaryBadge';
import RatingStars from '../ui/RatingStars';
import PriceIndicator from '../ui/PriceIndicator';

const RestaurantCard = ({ restaurant }) => {
    const {
        id,
        name,
        address,
        rating,
        price,
        categories = [],
        dietary_options = {},
        distance_km
    } = restaurant;

    // Extract dietary options that are true
    const activeDietaryOptions = Object.entries(dietary_options)
        .filter(([_, isActive]) => isActive)
        .map(([key]) => key);

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:scale-[1.02] hover:shadow-lg">
            <Link to={`/restaurant/${id}`} className="block">
                {/* Restaurant Image (placeholder) */}
                <div className="h-48 bg-primary-light relative">
                    <div className="absolute inset-0 flex items-center justify-center text-white">
                        <span className="text-xl font-semibold">{name.charAt(0)}</span>
                    </div>
                </div>
            </Link>

            <div className="p-4">
                <div className="flex justify-between items-start">
                    <Link to={`/restaurant/${id}`} className="block">
                        <h3 className="text-xl font-bold text-primary-dark truncate">{name}</h3>
                    </Link>
                    <PriceIndicator price={price} />
                </div>

                <div className="mt-2">
                    <RatingStars rating={rating} />
                </div>

                {/* Categories */}
                <div className="mt-2 text-gray-600 text-sm">
                    {categories.join(' • ')}
                </div>

                {/* Address */}
                <div className="mt-1 text-gray-500 text-sm truncate">
                    {address}
                </div>

                {/* Distance if available */}
                {distance_km && (
                    <div className="mt-1 text-gray-500 text-sm">
                        {distance_km} km away
                    </div>
                )}

                {/* Dietary Options */}
                {activeDietaryOptions.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                        {activeDietaryOptions.map(option => (
                            <DietaryBadge key={option} type={option} size="sm" />
                        ))}
                    </div>
                )}

                <Link
                    to={`/restaurant/${id}`}
                    className="mt-4 block text-center bg-primary text-white py-2 rounded hover:bg-primary-dark transition-colors"
                >
                    View Details
                </Link>
            </div>
        </div>
    );
};

export default RestaurantCard;