import { useState, useEffect } from "react";
import { Menu, X, User, LogOut } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
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

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const isActiveLink = (href: string) => {
    return href === "/" ? location.pathname === "/" : location.pathname.startsWith(href);
  };

  return (
    <header
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? "bg-background/80 backdrop-blur-md border-b border-white/5 py-2 shadow-lg" : "bg-transparent py-4"
        }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="text-2xl font-bold bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 flex items-center justify-center border border-teal-500/30">
              <span className="text-teal-400 font-mono text-lg">{`{}`}</span>
            </div>
            CodeQuest101
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <div className="flex items-center bg-white/5 rounded-full px-4 py-1.5 border border-white/5 mr-4 backdrop-blur-sm">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all duration-300 ${isActiveLink(link.href)
                      ? "bg-teal-500/20 text-teal-300 shadow-[0_0_15px_rgba(45,212,191,0.3)]"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>

            <div className="flex items-center space-x-3 pl-2 border-l border-white/10">
              {isLoading ? (
                <div className="h-9 w-9 animate-pulse rounded-full bg-white/10" />
              ) : user ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5">
                    <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-teal-500 to-cyan-600 flex items-center justify-center text-white text-xs ring-2 ring-black">
                      {user.user_metadata?.avatar_url ? (
                        <img
                          src={user.user_metadata.avatar_url}
                          alt="Avatar"
                          className="h-full w-full object-cover rounded-full"
                        />
                      ) : (
                        <User className="h-3 w-3" />
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-300 max-w-[100px] truncate">
                      {user.user_metadata?.full_name || user.email?.split("@")[0]}
                    </span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link to="/login" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
                    Log in
                  </Link>
                  <Link to="/signup">
                    <button className="bg-teal-600 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-teal-500 hover:shadow-[0_0_20px_rgba(45,212,191,0.4)] transition-all duration-300">
                      Sign Up
                    </button>
                  </Link>
                </div>
              )}
            </div>
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-gray-300 hover:text-white"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`md:hidden absolute w-full bg-[#0a0f1c] border-b border-white/10 shadow-2xl transition-all duration-300 ease-in-out overflow-hidden ${isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}
      >
        <div className="px-4 pt-4 pb-6 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.href}
              className={`block px-4 py-3 rounded-xl text-base font-medium transition-all ${isActiveLink(link.href)
                  ? "bg-teal-500/10 text-teal-300 border border-teal-500/20"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              onClick={() => setIsMenuOpen(false)}
            >
              {link.name}
            </Link>
          ))}

          <div className="pt-4 mt-4 border-t border-white/10">
            {user ? (
              <button
                onClick={() => { handleSignOut(); setIsMenuOpen(false); }}
                className="w-full flex items-center justify-center gap-2 p-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
              >
                <LogOut className="h-5 w-5" />
                Sign Out
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                  <button className="w-full py-3 rounded-xl text-gray-300 bg-white/5 hover:bg-white/10 transition-colors">Log In</button>
                </Link>
                <Link to="/signup" onClick={() => setIsMenuOpen(false)}>
                  <button className="w-full py-3 rounded-xl text-black bg-teal-400 hover:bg-teal-300 font-medium transition-colors">Sign Up</button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;