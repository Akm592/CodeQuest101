import { useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext"; // Adjust path if needed
import { Button } from "../ui/button"; // Adjust path if needed
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../ui/card"; // Adjust path if needed
import { Input } from "../ui/input"; // Adjust path if needed
import { Label } from "../ui/label"; // Adjust path if needed
import { AlertCircle, Mail, Lock, Loader2 } from "lucide-react"; // Added Loader2

// Google SVG Icon Component (reuse from SignUp)
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
    <path fill="#EA4335" d="M24 9.5c3.4 0 6.3 1.2 8.6 3.2l6.5-6.5C35.2 2.8 30 1 24 1 15.5 1 8.1 6.2 4.8 13.7l7.6 5.9C14.4 13.5 18.8 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.2-.4-4.7H24v9h12.7c-.6 2.9-2.2 5.4-4.7 7.1l7.6 5.9c4.5-4.1 7.1-10.2 7.1-17.3z"/>
    <path fill="#FBBC05" d="M12.4 19.6c-1.2 3.6-1.2 7.6 0 11.2l-7.6 5.9C1.1 30.4 0 27.3 0 24s1.1-6.4 4.8-9.8l7.6 5.4z"/>
    <path fill="#34A853" d="M24 47c6 0 11.1-2 14.8-5.4l-7.6-5.9c-2 1.3-4.5 2.1-7.2 2.1-5.2 0-9.6-4-11.6-9.6l-7.6 5.9C8.1 41.8 15.5 47 24 47z"/>
    <path fill="none" d="M0 0h48v48H0z"/>
  </svg>
);

export const LoginPage = () => {
  const { user, signInWithOAuth, signInWithPassword, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Display a loading indicator while auth state is resolving
  if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-950 to-black text-gray-400 w-screen">
            <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
        </div>
      );
  }

  // Redirect if already logged in
  if (user) {
      return <Navigate to="/chat" replace />; // Or dashboard, etc.
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await signInWithPassword(email, password);
      // Navigation happens automatically if successful (due to user state change)
    } catch (err: any) {
      console.error("Email sign-in error:", err);
      setError(err.message || "Invalid email or password. Please try again.");
      setSubmitting(false); // Only reset submitting state on error
    }
  };

  const handleGoogleLogin = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await signInWithOAuth("google");
      // Navigation likely automatic
    } catch (err: any) {
      console.error("Google sign-in error:", err);
      setError(err.message || "Failed to sign in with Google.");
      setSubmitting(false); // Only reset on error
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-950 to-black p-4 w-screen text-gray-300">
      <Card className="w-full max-w-md bg-gray-900 border border-gray-700/50 shadow-xl">
        <CardHeader className="space-y-1 pb-6">
          <CardTitle className="text-2xl md:text-3xl font-bold text-center text-gray-100">
            Welcome Back!
          </CardTitle>
          <CardDescription className="text-center text-gray-400">
            Sign in to access your CodeQuest101 dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="p-3 text-sm text-red-400 bg-red-900/30 border border-red-500/30 rounded-md flex items-start gap-2">
              <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleEmailLogin} className="space-y-4">
            {/* Email Input */}
            <div className="space-y-2">
              <Label htmlFor="email" className="font-medium text-gray-300">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={submitting}
                  placeholder="name@example.com"
                  className="h-10 pl-10 bg-gray-800 border-gray-600 text-gray-100 placeholder:text-gray-500 focus:border-teal-500 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="font-medium text-gray-300">Password</Label>
                <Link
                  to="/forgot-password"
                  className="text-sm text-teal-400 hover:text-teal-300 transition-colors underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={submitting}
                  placeholder="••••••••"
                  className="h-10 pl-10 bg-gray-800 border-gray-600 text-gray-100 placeholder:text-gray-500 focus:border-teal-500 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={submitting}
              className="w-full h-11 mt-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          {/* Separator */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-900 text-gray-500">
                Or continue with
              </span>
            </div>
          </div>

          {/* OAuth Button */}
          <Button
            onClick={handleGoogleLogin}
            disabled={submitting}
            variant="outline"
            className="w-full h-11 flex items-center justify-center gap-2 border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-70 disabled:cursor-not-allowed"
          >
             <GoogleIcon />
              <span className="text-sm font-medium">
                 {submitting ? "Connecting..." : "Sign in with Google"}
              </span>
          </Button>
        </CardContent>

        <CardFooter className="flex justify-center border-t border-gray-700/50 pt-6 pb-6">
          <p className="text-sm text-gray-400">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="font-medium text-teal-400 hover:text-teal-300 transition-colors duration-200 underline"
            >
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};