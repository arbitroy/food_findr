import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSearch } from '../../context/SearchContext';

const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { searchParams, setSearchParams } = useSearch();
    const [query, setQuery] = useState('');
    const navigate = useNavigate();

    const handleSearch = (e) => {
        e.preventDefault();
        setSearchParams({
            ...searchParams,
            query
        });
        navigate('/search');
    };

    return (
        <header className="bg-primary-dark text-white shadow-md">
            <div className="container mx-auto px-4 py-4">
                <div className="flex justify-between items-center">
                    <Link to="/" className="text-2xl font-bold">
                        Food Findr
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-8">
                        <nav className="flex items-center space-x-6">
                            <Link to="/" className="hover:text-primary-light transition-colors">
                                Home
                            </Link>
                            <Link to="/search" className="hover:text-primary-light transition-colors">
                                Search
                            </Link>
                        </nav>

                        <form onSubmit={handleSearch} className="relative">
                            <input
                                type="text"
                                placeholder="Search restaurants..."
                                className="py-2 px-4 pr-10 rounded-full w-64 text-text focus:outline-none focus:ring-2 focus:ring-primary"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                            <button
                                type="submit"
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-primary-dark"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </button>
                        </form>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden text-white focus:outline-none"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                        </svg>
                    </button>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="md:hidden mt-4 pb-4">
                        <nav className="flex flex-col space-y-3">
                            <Link
                                to="/"
                                className="hover:text-primary-light transition-colors"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Home
                            </Link>
                            <Link
                                to="/search"
                                className="hover:text-primary-light transition-colors"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Search
                            </Link>
                        </nav>
                        <form onSubmit={handleSearch} className="mt-4 relative">
                            <input
                                type="text"
                                placeholder="Search restaurants..."
                                className="py-2 px-4 pr-10 rounded-full w-full text-text focus:outline-none focus:ring-2 focus:ring-primary"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                            <button
                                type="submit"
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-primary-dark"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;