
import { Link } from 'react-router-dom'; // Use Link for internal navigation if applicable

const Footer = () => {
    // Example year - consider making this dynamic
    const currentYear = new Date().getFullYear();

    return (
        // Use a dark background, consistent with the theme. Add padding and a top border.
        <footer className="bg-black text-gray-400 py-8 border-t border-gray-800/70 w-full">
            <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row justify-between items-center text-center md:text-left gap-4">
                    {/* Copyright Info */}
                    <div className="mb-4 md:mb-0">
                        <p className="text-sm">
                            © {currentYear} CodeQuest101. All rights reserved.
                        </p>
                    </div>
                    {/* Footer Links */}
                    <nav className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-6" aria-label="Footer navigation">
                        {/* Use Link component if these are internal routes */}
                        <Link to="/terms" className="text-sm hover:text-teal-400 transition-colors duration-200">
                            Terms of Service
                        </Link>
                        <Link to="/privacy" className="text-sm hover:text-teal-400 transition-colors duration-200">
                            Privacy Policy
                        </Link>
                        <Link to="/contact" className="text-sm hover:text-teal-400 transition-colors duration-200">
                            Contact
                        </Link>
                        {/* Example external link */}
                         <a
                            href="https://github.com/Akm592/CodeQuest101"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm hover:text-teal-400 transition-colors duration-200"
                         >
                            GitHub
                        </a>
                    </nav>
                </div>
            </div>
        </footer>
    );
}

export default Footer;