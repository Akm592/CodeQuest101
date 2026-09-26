import { useState, useEffect } from "react";
import { Menu, X, User, LogOut } from "lucide-react";
import { Link, useNavigate, useLocation, type To } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, signOut, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // "Visualizations" used to point at "/", which put the user at the top of
  // the home page rather than at the grid it names. ScrollToHash does the
  // scrolling; React Router only puts the fragment in the URL.
  const navLinks: { name: string; to: To; match: string }[] = [
    { name: "Visualizations", to: { pathname: "/", hash: "visualizations" }, match: "/" },
    { name: "AI Chatbot", to: "/chat", match: "/chat" },
    { name: "About", to: "/about", match: "/about" },
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

  const isActiveLink = (match: string) =>
    match === "/" ? location.pathname === "/" : location.pathname.startsWith(match);

  return (
    <header
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? "bg-background/80 backdrop-blur-md border-b border-white/5 py-2 shadow-lg" : "bg-transparent py-4"
        }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="text-2xl font-bold text-primary hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30">
              <span className="text-primary font-mono text-lg">{`{}`}</span>
            </div>
            CodeQuest101
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <div className="flex items-center bg-white/5 rounded-full px-4 py-1.5 border border-white/5 mr-4 backdrop-blur-sm">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.to}
                  className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all duration-300 ${isActiveLink(link.match)
                      ? "bg-primary/20 text-primary shadow-[0_0_15px_hsl(var(--primary)/0.3)]"
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
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
                    <div className="h-6 w-6 rounded-full flex items-center justify-center bg-primary text-xs text-primary-foreground ring-2 ring-background">
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
                    <span className="text-sm font-medium text-muted-foreground max-w-[100px] truncate">
                      {user.user_metadata?.full_name || user.email?.split("@")[0]}
                    </span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    aria-label="Sign out"
                    className="grid h-11 w-11 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link to="/login" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                    Log in
                  </Link>
                  <Link to="/signup">
                    <button className="bg-primary text-primary-foreground px-5 py-2 rounded-full text-sm font-medium hover:bg-primary/90 hover:shadow-[0_0_20px_hsl(var(--primary)/0.4)] transition-all duration-300">
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
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMenuOpen}
              className="grid h-11 w-11 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`md:hidden absolute w-full bg-card border-b border-white/10 shadow-2xl transition-all duration-300 ease-in-out overflow-hidden ${isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}
      >
        <div className="px-4 pt-4 pb-6 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.to}
              className={`block px-4 py-3 rounded-xl text-base font-medium transition-all ${isActiveLink(link.match)
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
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
                className="w-full flex items-center justify-center gap-2 p-3 text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
              >
                <LogOut className="h-5 w-5" />
                Sign Out
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                  <button className="w-full py-3 rounded-xl text-muted-foreground bg-white/5 hover:bg-white/10 transition-colors">Log In</button>
                </Link>
                <Link to="/signup" onClick={() => setIsMenuOpen(false)}>
                  <button className="w-full py-3 rounded-xl text-primary-foreground bg-primary hover:bg-primary/90 font-medium transition-colors">Sign Up</button>
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