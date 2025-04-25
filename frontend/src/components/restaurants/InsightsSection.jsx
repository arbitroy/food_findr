import React from 'react';
import LoadingSpinner from '../ui/LoadingSpinner';

const InsightsSection = ({ insights, loading, error }) => {
    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6 mt-6">
                <h2 className="text-xl font-bold text-primary-dark mb-4">Insights</h2>
                <div className="flex justify-center py-8">
                    <LoadingSpinner />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6 mt-6">
                <h2 className="text-xl font-bold text-primary-dark mb-4">Insights</h2>
                <div className="p-4 bg-red-50 text-red-700 rounded-md">
                    <p>Error loading insights: {error}</p>
                </div>
            </div>
        );
    }

    if (!insights) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6 mt-6">
                <h2 className="text-xl font-bold text-primary-dark mb-4">Insights</h2>
                <p className="text-gray-600">No insights available for this restaurant.</p>
            </div>
        );
    }

    const { total_reviews, sentiment_analysis, dietary_mentions, key_phrases } = insights;

    // Calculate percentages for sentiment distribution
    const totalSentiments =
        sentiment_analysis?.sentiment_distribution?.positive +
        sentiment_analysis?.sentiment_distribution?.neutral +
        sentiment_analysis?.sentiment_distribution?.negative || 0;

    const sentimentPercentages = {
        positive: totalSentiments ? Math.round((sentiment_analysis?.sentiment_distribution?.positive / totalSentiments) * 100) : 0,
        neutral: totalSentiments ? Math.round((sentiment_analysis?.sentiment_distribution?.neutral / totalSentiments) * 100) : 0,
        negative: totalSentiments ? Math.round((sentiment_analysis?.sentiment_distribution?.negative / totalSentiments) * 100) : 0,
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
            <h2 className="text-xl font-bold text-primary-dark mb-6">AI-Powered Insights</h2>

            {/* Review Count */}
            <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-800 mb-2">Based on {total_reviews} reviews</h3>
            </div>

            {/* Sentiment Analysis */}
            {sentiment_analysis && (
                <div className="mb-8">
                    <h3 className="text-lg font-medium text-gray-800 mb-3">Sentiment Analysis</h3>

                    {/* Sentiment Meter */}
                    <div className="mb-4">
                        <div className="h-6 bg-gray-200 rounded-full overflow-hidden flex">
                            <div
                                className="bg-green-500 h-full"
                                style={{ width: `${sentimentPercentages.positive}%` }}
                                title={`Positive: ${sentimentPercentages.positive}%`}
                            ></div>
                            <div
                                className="bg-gray-400 h-full"
                                style={{ width: `${sentimentPercentages.neutral}%` }}
                                title={`Neutral: ${sentimentPercentages.neutral}%`}
                            ></div>
                            <div
                                className="bg-red-500 h-full"
                                style={{ width: `${sentimentPercentages.negative}%` }}
                                title={`Negative: ${sentimentPercentages.negative}%`}
                            ></div>
                        </div>
                        <div className="flex justify-between text-sm mt-1">
                            <span>Positive ({sentimentPercentages.positive}%)</span>
                            <span>Neutral ({sentimentPercentages.neutral}%)</span>
                            <span>Negative ({sentimentPercentages.negative}%)</span>
                        </div>
                    </div>

                    <div className="p-4 rounded-md bg-blue-50">
                        <p className="text-gray-700">
                            <span className="font-medium">Overall Sentiment:</span>{' '}
                            {sentiment_analysis.average_sentiment > 0.2 ? 'Mostly Positive' :
                                sentiment_analysis.average_sentiment < -0.2 ? 'Mostly Negative' :
                                    'Mixed/Neutral'}
                        </p>
                    </div>
                </div>
            )}

            {/* Dietary Mentions */}
            {dietary_mentions && Object.keys(dietary_mentions).length > 0 && (
                <div className="mb-8">
                    <h3 className="text-lg font-medium text-gray-800 mb-3">Dietary Options Mentioned</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {Object.entries(dietary_mentions).map(([diet, count]) => (
                            <div key={diet} className="bg-gray-100 p-3 rounded-md">
                                <div className="flex justify-between items-center">
                                    <span className="capitalize">{diet.replace('_', ' ')}</span>
                                    <span className="font-medium text-primary-dark">{count}</span>
                                </div>
                                {/* Simple progress bar */}
                                <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
                                    <div
                                        className="bg-primary h-2.5 rounded-full"
                                        style={{ width: `${Math.min(100, (count / total_reviews) * 100 * 3)}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Key Phrases */}
            {key_phrases && key_phrases.length > 0 && (
                <div>
                    <h3 className="text-lg font-medium text-gray-800 mb-3">Common Phrases</h3>
                    <div className="flex flex-wrap gap-2">
                        {key_phrases.map((phrase, index) => (
                            <span
                                key={index}
                                className="bg-primary-light text-primary-dark px-3 py-1 rounded-full text-sm"
                            >
                                {phrase}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default InsightsSection;