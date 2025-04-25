import React from 'react';
import DietaryBadge from '../ui/DietaryBadge';
import RatingStars from '../ui/RatingStars';
import PriceIndicator from '../ui/PriceIndicator';
import Button from '../ui/Button';

const RestaurantDetails = ({ restaurant }) => {
    const {
        name,
        address,
        rating,
        price,
        categories = [],
        dietary_options = {},
        latitude,
        longitude,
    } = restaurant;

    // Extract dietary options that are true
    const activeDietaryOptions = Object.entries(dietary_options)
        .filter(([_, isActive]) => isActive)
        .map(([key]) => key);

    // Create Google Maps URL
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Restaurant Header with Image Placeholder */}
            <div className="h-64 bg-primary relative flex justify-center items-center">
                <div className="absolute inset-0 bg-black bg-opacity-40 flex justify-center items-center">
                    <h1 className="text-4xl font-bold text-white">{name}</h1>
                </div>
            </div>

            {/* Details Section */}
            <div className="p-6">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-6">
                    <div>
                        {/* Categories */}
                        <div className="text-gray-600 text-lg mb-2">
                            {categories.join(' • ')}
                        </div>

                        {/* Address */}
                        <div className="text-gray-700 mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {address}
                        </div>

                        {/* Rating & Price */}
                        <div className="flex flex-col sm:flex-row gap-4 mb-4">
                            <div>
                                <span className="text-gray-700 font-medium mr-2">Rating:</span>
                                <RatingStars rating={rating} />
                            </div>
                            <div>
                                <span className="text-gray-700 font-medium mr-2">Price:</span>
                                <PriceIndicator price={price} />
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2">
                        <a
                            href={googleMapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center"
                        >
                            <Button className="w-full">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                </svg>
                                View on Map
                            </Button>
                        </a>
                    </div>
                </div>

                {/* Dietary Options */}
                {activeDietaryOptions.length > 0 && (
                    <div className="mb-6">
                        <h3 className="text-lg font-medium text-gray-800 mb-3">Dietary Options</h3>
                        <div className="flex flex-wrap gap-2">
                            {activeDietaryOptions.map(option => (
                                <DietaryBadge key={option} type={option} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Map Preview */}
                {latitude && longitude && (
                    <div className="mt-6">
                        <h3 className="text-lg font-medium text-gray-800 mb-3">Location</h3>
                        <div className="rounded-lg overflow-hidden h-64 border border-gray-200">
                            <iframe
                                title="Restaurant Location"
                                width="100%"
                                height="100%"
                                frameBorder="0"
                                src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${latitude},${longitude}`}
                                allowFullScreen
                            ></iframe>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RestaurantDetails;