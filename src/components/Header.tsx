import { useState, useEffect } from "react";
import { Menu, X, User, LogOut } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext"; // Assuming path is correct

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navLinks = [
    { name: "Visualizations", href: "/" },
    { name: "AI Chatbot", href: "/chat" },
    { name: "About", href: "/about" },
  ];

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
      // Optionally: Add user feedback for sign-out errors
    }
  };

  const isActiveLink = (href: string) => {
    // Handle exact match for home '/' and startsWith for others
    return href === "/" ? location.pathname === "/" : location.pathname.startsWith(href);
  };

  return (
    // Sticky header with dark background and subtle bottom border
    <header className="sticky top-0 z-50 bg-gray-950 border-b border-gray-800/70">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo with updated gradient for dark background */}
          <Link
            to="/"
            className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent hover:opacity-90 transition-opacity"
            aria-label="CodeQuest101 Home"
          >
            CodeQuest101
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex md:items-center md:space-x-8" aria-label="Main navigation">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className={`text-sm font-medium transition-colors duration-200 ${
                  isActiveLink(link.href)
                    ? "text-teal-400" // Active link color
                    : "text-gray-400 hover:text-teal-400" // Inactive link color
                }`}
                aria-current={isActiveLink(link.href) ? "page" : undefined}
              >
                {link.name}
              </Link>
            ))}

            {/* Auth Section */}
            <div className="flex items-center space-x-4 pl-4">
              {isLoading ? (
                <div className="h-8 w-8 animate-pulse rounded-full bg-gray-700" />
              ) : user ? (
                <div className="flex items-center space-x-4">
                  {/* User Info */}
                  <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 rounded-full bg-teal-700 flex items-center justify-center text-white overflow-hidden ring-2 ring-gray-600">
                      {user.user_metadata?.avatar_url ? (
                        <img
                          src={user.user_metadata.avatar_url}
                          alt={user.user_metadata?.full_name || "User Avatar"}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <User className="h-4 w-4" />
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-300 hidden lg:inline">
                      {user.user_metadata?.full_name ||
                        user.email?.split("@")[0] ||
                        "User"}
                    </span>
                  </div>
                  {/* Logout Button */}
                  <button
                    onClick={handleSignOut}
                    className="flex items-center space-x-1 text-sm text-gray-400 hover:text-red-500 transition-colors"
                    aria-label="Sign out"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                </div>
              ) : (
                // Sign In Button
                <Link to="/login">
                  <button className="bg-teal-600 text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-teal-700 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-gray-950">
                    Sign In
                  </button>
                </Link>
              )}
            </div>
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-teal-400 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-teal-500"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-controls="mobile-menu"
              aria-expanded={isMenuOpen}
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div
         className={`md:hidden absolute w-full bg-gray-900 shadow-lg border-t border-gray-800 ${isMenuOpen ? 'block' : 'hidden'}`}
         id="mobile-menu"
      >
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.href}
              className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                isActiveLink(link.href)
                  ? "text-teal-300 bg-teal-900/30" // Active mobile link
                  : "text-gray-300 hover:text-teal-300 hover:bg-gray-800" // Inactive mobile link
              }`}
              onClick={() => setIsMenuOpen(false)}
              aria-current={isActiveLink(link.href) ? "page" : undefined}
            >
              {link.name}
            </Link>
          ))}
        </div>
        {/* Mobile Auth Section */}
        <div className="px-3 pt-3 pb-3 border-t border-gray-800">
          {isLoading ? (
             <div className="flex justify-center py-2">
                 <div className="h-8 w-8 animate-pulse rounded-full bg-gray-700" />
             </div>
          ) : user ? (
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="h-9 w-9 rounded-full bg-teal-700 flex items-center justify-center text-white overflow-hidden ring-2 ring-gray-600">
                  {user.user_metadata?.avatar_url ? (
                    <img
                      src={user.user_metadata.avatar_url}
                      alt={user.user_metadata?.full_name || "User Avatar"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                </div>
                <span className="text-sm font-medium text-gray-300">
                  {user.user_metadata?.full_name ||
                    user.email?.split("@")[0] ||
                    "User"}
                </span>
              </div>
              <button
                onClick={() => {
                  handleSignOut();
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center justify-center space-x-2 bg-gray-800 hover:bg-gray-700 py-2 rounded-md text-sm text-gray-400 hover:text-red-500 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              onClick={() => setIsMenuOpen(false)}
              className="block w-full"
            >
              <button className="w-full bg-teal-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-teal-700 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-gray-900">
                Sign In
              </button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;