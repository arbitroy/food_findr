import React from 'react';

const sizes = {
    sm: 'h-5 w-5',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
};

const LoadingSpinner = ({ size = 'md', className = '' }) => {
    const sizeClass = sizes[size] || sizes.md;

    return (
        <div className={`flex justify-center items-center ${className}`}>
            <div className={`${sizeClass} animate-spin rounded-full border-4 border-primary border-t-transparent`} role="status">
                <span className="sr-only">Loading...</span>
            </div>
        </div>
    );
};

export default LoadingSpinner;