import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';

const NotFoundPage = () => {
    return (
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
            <div className="mb-8">
                <div className="text-primary-dark text-9xl font-bold">404</div>
                <h1 className="text-4xl font-bold text-primary-dark mb-4">Page Not Found</h1>
                <p className="text-xl text-gray-600 mb-8">
                    The page you are looking for doesn't exist or has been moved.
                </p>
            </div>

            <div className="mb-8">
                <svg
                    className="mx-auto h-48 w-48 text-primary-light"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M9 10H9.01"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M15 10H15.01"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M8 15C8 15 9.5 13 12 13C14.5 13 16 15 16 15"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </div>

            <Link to="/">
                <Button size="lg">
                    Return to Home
                </Button>
            </Link>
        </div>
    );
};

export default NotFoundPage;