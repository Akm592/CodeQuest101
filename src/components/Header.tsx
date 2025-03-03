import { useState, useEffect } from "react";
import { Menu, X, User, LogOut } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navLinks = [
    { name: "Visualizations", href: "/" },
    { name: "AI Chatbot", href: "/chat" },
    { name: "About", href: "/about" }, // Changed from #about to make it a route
  ];

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Function to check if link is active
  const isActiveLink = (href: string) => {
    if (href === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-auto bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to="/"
            className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"
          >
            CodeQuest101
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className={`text-sm font-medium ${
                  isActiveLink(link.href)
                    ? "text-blue-600"
                    : "text-gray-600 hover:text-blue-600"
                }`}
              >
                {link.name}
              </Link>
            ))}

            {isLoading ? (
              <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200" />
            ) : user ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white overflow-hidden">
                    {user.user_metadata?.avatar_url ? (
                      <img
                        src={user.user_metadata.avatar_url}
                        alt={user.user_metadata?.full_name || "User"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {user.user_metadata?.full_name ||
                      user.email?.split("@")[0] ||
                      "User"}
                  </span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-1 text-sm text-gray-600 hover:text-red-600 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <Link to="/login">
                <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">
                  Sign In
                </button>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-blue-600 hover:bg-gray-100"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
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

      {/* Mobile menu, show/hide based on menu state */}
      <div className={`md:hidden ${isMenuOpen ? "block" : "hidden"}`}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-100">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.href}
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActiveLink(link.href)
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              {link.name}
            </Link>
          ))}

          {isLoading ? (
            <div className="py-4 flex justify-center">
              <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200" />
            </div>
          ) : user ? (
            <div className="px-3 py-3 border-t border-gray-100 mt-2">
              <div className="flex items-center space-x-3 mb-3">
                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white overflow-hidden">
                  {user.user_metadata?.avatar_url ? (
                    <img
                      src={user.user_metadata.avatar_url}
                      alt={user.user_metadata?.full_name || "User"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                </div>
                <span className="text-sm font-medium text-gray-700">
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
                className="w-full flex items-center justify-center space-x-2 bg-gray-50 hover:bg-gray-100 py-2 rounded-md text-sm text-gray-600 hover:text-red-600 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div className="px-3 py-3 border-t border-gray-100 mt-2">
              <Link 
                to="/login" 
                onClick={() => setIsMenuOpen(false)}
                className="block w-full"
              >
                <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">
                  Sign In
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;