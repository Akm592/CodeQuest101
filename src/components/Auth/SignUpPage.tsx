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
import { AlertCircle, CheckCircle, } from "lucide-react";

export const SignUpPage = () => {
  const { user, signInWithOAuth, signUpWithEmail, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  // Redirect if already logged in
  if (user && !isLoading) {
    return <Navigate to="/chat" replace />;
  }

  const handleOAuthLogin = async (provider: "google") => {
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

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setAuthError("Please enter a valid email address.");
      return;
    }
    if (password !== confirmPassword) {
      setAuthError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setAuthError("Password must be at least 6 characters long.");
      return;
    }
    try {
      setIsSubmitting(true);
      setAuthError(null);
      await signUpWithEmail(email, password);
      setSignupSuccess(true);
      // Reset form fields
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error("Error signing up with email:", error);
      setAuthError(error.message || "Failed to sign up. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (signupSuccess) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4 w-screen">
        <Card className="w-full max-w-md shadow-lg border-0">
          <CardHeader className="pb-6">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl md:text-3xl font-bold text-center text-gray-800">
              Check Your Email
            </CardTitle>
            <CardDescription className="text-center text-gray-600 mt-2">
              We've sent a confirmation link to <strong>{email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center pb-6">
            <p className="mb-4 text-gray-700">
              Please check your email and click the confirmation link to
              complete your registration.
            </p>
            <p className="text-sm text-gray-500">
              If you don't see the email, check your spam folder or{" "}
              <Link to="/signup" className="text-blue-600 hover:text-blue-800 transition-colors">
                try again
              </Link>
              .
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4 w-screen ">
      <Card className="w-full max-w-md shadow-lg border-0">
        <CardHeader className="space-y-1 pb-6">
          <CardTitle className="text-2xl md:text-3xl font-bold text-center text-gray-800">
            Create an Account
          </CardTitle>
          <CardDescription className="text-center text-gray-600">
            Sign up to get started with CodeQuest101
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {authError && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md flex items-start gap-2">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleEmailSignUp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-gray-700">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="h-10"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-11 mt-2 bg-blue-600 hover:bg-blue-700 transition-colors"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating Account..." : "Create Account"}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                Or continue with
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              type="button"
              className="w-full h-11 flex items-center justify-center gap-2 transition-all"
              onClick={() => handleOAuthLogin("google")}
              disabled={isSubmitting}
              variant="outline"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                {/* Google SVG path */}
              </svg>
              <span className="text-sm md:text-base">
                {isSubmitting ? "Connecting..." : "Continue with Google"}
              </span>
            </Button>



          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 pt-2 pb-6 px-8">
          <div className="text-sm text-center">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              Sign in
            </Link>
          </div>
          <p className="text-xs text-gray-500 text-center">
            By signing up, you agree to our Terms of Service and Privacy Policy.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};