// Code for the Login component
// ../../../src/components/Auth/Login.tsx
import { useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

export const LoginPage = () => {
  const { user, signInWithOAuth, signInWithEmail, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already logged in
  if (user && !isLoading) {
    return <Navigate to="/chat" replace />;
  }

  const handleOAuthLogin = async (provider: "google" | "github") => {
    try {
      setIsSubmitting(true);
      setAuthError(null);
      await signInWithOAuth(provider);
    } catch (error) {
      console.error(`Error signing in with ${provider}:`, error);
      setAuthError("Failed to sign in. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setAuthError(null);
      await signInWithEmail(email, password);
    } catch (error) {
      console.error("Error signing in with email:", error);
      setAuthError("Invalid email or password. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Sign In
          </CardTitle>
          <CardDescription className="text-center">
            Sign in to access your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {authError && (
            <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
              {authError}
            </div>
          )}

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Signing in..." : "Sign In with Email"}
            </Button>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                Or continue with
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Button
              type="button"
              className="w-full flex items-center justify-center gap-2"
              onClick={() => handleOAuthLogin("google")}
              disabled={isSubmitting}
              variant="outline"
            >
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12.2465 14.5864V9.83889H20.4363C20.5947 10.4239 20.673 11.0385 20.673 11.6826C20.673 15.4192 17.8619 19.0004 12.2465 19.0004C7.18058 19.0004 3 14.8199 3 9.75386C3 4.6878 7.18058 0.507324 12.2465 0.507324C14.7344 0.507324 16.8928 1.4771 18.5319 3.12478L15.3611 6.12311C14.61 5.37196 13.5454 4.85164 12.2465 4.85164C9.59002 4.85164 7.34339 7.0983 7.34339 9.75386C7.34339 12.4094 9.59002 14.6561 12.2465 14.6561C14.4539 14.6561 15.8096 13.7249 16.3517 12.2911C16.532 11.9307 16.6365 11.5467 16.6836 11.1529H12.2465V14.5864Z"
                  fill="currentColor"
                />
              </svg>
              Continue with Google
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-center">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Sign up
            </Link>
          </div>
          <p className="text-xs text-gray-500 text-center">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};
