import { Link } from 'react-router-dom';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-primary-dark text-white py-8">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                        <h3 className="text-xl font-bold mb-4">Food Findr</h3>
                        <p className="text-primary-light">
                            Find restaurants that match your dietary preferences quickly and easily.
                        </p>
                    </div>

                    <div>
                        <h3 className="text-xl font-bold mb-4">Quick Links</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link to="/" className="text-primary-light hover:text-white transition-colors">
                                    Home
                                </Link>
                            </li>
                            <li>
                                <Link to="/search" className="text-primary-light hover:text-white transition-colors">
                                    Search
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-xl font-bold mb-4">Dietary Options</h3>
                        <div className="flex flex-wrap gap-2">
                            <span className="px-3 py-1 bg-primary text-white rounded-full text-sm">Vegan</span>
                            <span className="px-3 py-1 bg-primary text-white rounded-full text-sm">Vegetarian</span>
                            <span className="px-3 py-1 bg-primary text-white rounded-full text-sm">Halal</span>
                            <span className="px-3 py-1 bg-primary text-white rounded-full text-sm">Kosher</span>
                            <span className="px-3 py-1 bg-primary text-white rounded-full text-sm">Gluten-Free</span>
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-primary text-center">
                    <p>&copy; {currentYear} Food Findr. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;