



const Footer = () => {
    return (
        <footer className="bg-gray-800 text-white py-8">
            <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row justify-between items-center text-center md:text-left"> {/* Centered text on small screens */}
                    <div className="mb-4 md:mb-0">
                        <p className="text-sm text-gray-300">© 2025 CodeQuest101. All rights reserved.</p> {/* Lighter text color */}
                    </div>
                    <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4"> {/* Vertical spacing on small screens */}
                        <a href="#" className="hover:text-blue-400 text-sm text-gray-300"> {/* Lighter text color */}
                            Terms of Service
                        </a>
                        <a href="#" className="hover:text-blue-400 text-sm text-gray-300"> {/* Lighter text color */}
                            Privacy Policy
                        </a>
                        <a href="#" className="hover:text-blue-400 text-sm text-gray-300"> {/* Lighter text color */}
                            Contact
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
