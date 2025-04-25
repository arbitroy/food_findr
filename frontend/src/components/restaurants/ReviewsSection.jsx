import React from 'react';
import RatingStars from '../ui/RatingStars';

const ReviewsSection = ({ reviews = [] }) => {
    if (!reviews || reviews.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6 mt-6">
                <h2 className="text-xl font-bold text-primary-dark mb-4">Reviews</h2>
                <p className="text-gray-600">No reviews available for this restaurant.</p>
            </div>
        );
    }

    // Group reviews by sentiment
    const positiveReviews = reviews.filter(review => review.sentiment === 'positive');
    const neutralReviews = reviews.filter(review => review.sentiment === 'neutral');
    const negativeReviews = reviews.filter(review => review.sentiment === 'negative');

    // Calculate average rating
    const averageRating = reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length;

    return (
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
            <h2 className="text-xl font-bold text-primary-dark mb-4">Reviews</h2>

            {/* Review Summary */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex flex-col md:flex-row justify-between">
                    <div>
                        <h3 className="text-lg font-medium mb-2">Average Rating</h3>
                        <div className="flex items-center">
                            <span className="text-2xl font-bold mr-2">{averageRating.toFixed(1)}</span>
                            <RatingStars rating={averageRating} />
                        </div>
                    </div>
                    <div className="mt-4 md:mt-0">
                        <h3 className="text-lg font-medium mb-2">Review Sentiment</h3>
                        <div className="flex gap-3">
                            <div className="flex flex-col items-center">
                                <span className="text-green-500 text-lg font-bold">{positiveReviews.length}</span>
                                <span className="text-sm text-gray-600">Positive</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="text-gray-500 text-lg font-bold">{neutralReviews.length}</span>
                                <span className="text-sm text-gray-600">Neutral</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="text-red-500 text-lg font-bold">{negativeReviews.length}</span>
                                <span className="text-sm text-gray-600">Negative</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* List of Reviews */}
            <div className="space-y-6">
                {reviews.map((review, index) => (
                    <div key={index} className="border-b border-gray-200 pb-4 last:border-0">
                        <div className="flex justify-between items-start mb-2">
                            <RatingStars rating={review.rating} size="sm" />
                            <span className="text-sm text-gray-500">
                                {new Date(review.created_at).toLocaleDateString()}
                            </span>
                        </div>

                        <p className="text-gray-700">{review.text}</p>

                        {/* Sentiment Badge */}
                        <div className="mt-2">
                            <span
                                className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${review.sentiment === 'positive' ? 'bg-green-100 text-green-800' :
                                        review.sentiment === 'negative' ? 'bg-red-100 text-red-800' :
                                            'bg-gray-100 text-gray-800'
                                    }`}
                            >
                                {review.sentiment.charAt(0).toUpperCase() + review.sentiment.slice(1)}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ReviewsSection;