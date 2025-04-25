import React from 'react';

const PriceIndicator = ({ price, max = 4 }) => {
    return (
        <div className="flex items-center">
            {[...Array(max)].map((_, i) => (
                <span
                    key={i}
                    className={`text-lg font-medium ${i < price ? 'text-primary' : 'text-gray-300'
                        }`}
                >
                    $
                </span>
            ))}
            <span className="ml-2 text-sm text-gray-500">
                ({getPriceLabel(price)})
            </span>
        </div>
    );
};

// Helper function to get a text label for the price level
const getPriceLabel = (price) => {
    switch (price) {
        case 1:
            return 'Inexpensive';
        case 2:
            return 'Moderate';
        case 3:
            return 'Expensive';
        case 4:
            return 'Very Expensive';
        default:
            return 'Unknown';
    }
};

export default PriceIndicator;