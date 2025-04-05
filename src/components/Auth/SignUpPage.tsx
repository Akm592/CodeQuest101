import { useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext"; // Adjust path if needed
import { Button } from "../ui/button"; // Adjust path if needed
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card"; // Adjust path if needed
import { Input } from "../ui/input"; // Adjust path if needed
import { Label } from "../ui/label"; // Adjust path if needed
import { AlertCircle, CheckCircle, User as UserIcon, Mail, Lock } from "lucide-react"; // Aliased User to UserIcon

// Google SVG Icon Component (for better control and dark mode compatibility)
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
    <path fill="#EA4335" d="M24 9.5c3.4 0 6.3 1.2 8.6 3.2l6.5-6.5C35.2 2.8 30 1 24 1 15.5 1 8.1 6.2 4.8 13.7l7.6 5.9C14.4 13.5 18.8 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.2-.4-4.7H24v9h12.7c-.6 2.9-2.2 5.4-4.7 7.1l7.6 5.9c4.5-4.1 7.1-10.2 7.1-17.3z"/>
    <path fill="#FBBC05" d="M12.4 19.6c-1.2 3.6-1.2 7.6 0 11.2l-7.6 5.9C1.1 30.4 0 27.3 0 24s1.1-6.4 4.8-9.8l7.6 5.4z"/>
    <path fill="#34A853" d="M24 47c6 0 11.1-2 14.8-5.4l-7.6-5.9c-2 1.3-4.5 2.1-7.2 2.1-5.2 0-9.6-4-11.6-9.6l-7.6 5.9C8.1 41.8 15.5 47 24 47z"/>
    <path fill="none" d="M0 0h48v48H0z"/>
  </svg>
);

export const SignUpPage = () => {
  const { user, signInWithOAuth, signUpWithEmail, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [name, setName] = useState(""); // Added name state
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState(""); // Store email for success message

  if (user && !isLoading) {
    return <Navigate to="/chat" replace />; // Redirect to chat or desired page
  }

  const handleOAuthLogin = async (provider: "google") => {
    try {
      setIsSubmitting(true);
      setAuthError(null);
      await signInWithOAuth(provider);
      // Navigation likely happens automatically after OAuth success
    } catch (error) {
      console.error(`Error signing in with ${provider}:`, error);
      setAuthError("Failed to sign in with Google. Please try again.");
      setIsSubmitting(false); // Ensure submit state is reset on error
    }
    // No finally needed here as navigation should take over on success
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setAuthError("Please enter a valid email address.");
      return;
    }
    if (!name.trim()) { // Basic name validation
        setAuthError("Please enter your name.");
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
      // Include name in signup if your backend/auth provider supports it
      // Example: await signUpWithEmail(email, password, { name });
      await signUpWithEmail(email, password); // Assuming basic email/password signup for now
      setSubmittedEmail(email); // Store the email for the success message
      setSignupSuccess(true);
      // Don't clear fields immediately, show success message first
    } catch (error: any) {
      console.error("Error signing up with email:", error);
      // Provide more specific errors if possible (e.g., email already exists)
      setAuthError(error.message || "Failed to sign up. This email might already be in use.");
      setIsSubmitting(false); // Reset submit state only on error
    }
    // No finally needed here if we want to keep isSubmitting true until success screen
  };

  // --- Success Screen ---
  if (signupSuccess) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-950 to-black p-4 w-screen text-gray-300">
        <Card className="w-full max-w-md bg-gray-900 border border-gray-700/50 shadow-xl">
          <CardHeader className="pb-6">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-400" /> {/* Adjusted color */}
            </div>
            <CardTitle className="text-2xl md:text-3xl font-bold text-center text-gray-100">
              Check Your Email
            </CardTitle>
            <CardDescription className="text-center text-gray-400 mt-2">
              We've sent a confirmation link to <strong className="text-teal-400">{submittedEmail}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center pb-6">
            <p className="mb-4 text-gray-300">
              Please click the link in the email to complete your registration and sign in.
            </p>
            <p className="text-sm text-gray-500">
              Didn't receive it? Check your spam folder or{" "}
              <button
                onClick={() => {
                    setSignupSuccess(false); // Go back to signup form
                    setPassword(""); // Clear sensitive fields
                    setConfirmPassword("");
                    setIsSubmitting(false); // Allow resubmit
                }}
                className="text-teal-400 hover:text-teal-300 transition-colors underline"
              >
                try signing up again
              </button>.
            </p>
          </CardContent>
           <CardFooter className="flex justify-center pt-4">
                <Link to="/login" className="text-sm text-teal-400 hover:text-teal-300 transition-colors">
                    Back to Sign In
                </Link>
           </CardFooter>
        </Card>
      </div>
    );
  }

  // --- Sign Up Form ---
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-950 to-black p-4 w-screen text-gray-300">
      <Card className="w-full max-w-md bg-gray-900 border border-gray-700/50 shadow-xl">
        <CardHeader className="space-y-1 pb-6">
          <CardTitle className="text-2xl md:text-3xl font-bold text-center text-gray-100">
            Create Your CodeQuest101 Account
          </CardTitle>
          <CardDescription className="text-center text-gray-400">
            Unlock interactive code visualizations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {authError && (
            <div className="p-3 text-sm text-red-400 bg-red-900/30 border border-red-500/30 rounded-md flex items-start gap-2">
              <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-500" />
              <span>{authError}</span>
            </div>
          )}

          {/* Combined Form */}
          <form onSubmit={handleEmailSignUp} className="space-y-4">
            {/* Name Input */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-300 font-medium">Name</Label>
              <div className="relative">
                 <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                 <Input
                    id="name"
                    type="text" // Use text type for name
                    placeholder="Your Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={isSubmitting}
                    className="h-10 pl-10 bg-gray-800 border-gray-600 text-gray-100 placeholder:text-gray-500 focus:border-teal-500 focus:ring-teal-500"
                  />
              </div>
            </div>

            {/* Email Input */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300 font-medium">Email</Label>
               <div className="relative">
                 <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                 <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isSubmitting}
                  className="h-10 pl-10 bg-gray-800 border-gray-600 text-gray-100 placeholder:text-gray-500 focus:border-teal-500 focus:ring-teal-500"
                />
               </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300 font-medium">Password</Label>
              <div className="relative">
                 <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                 <Input
                  id="password"
                  type="password"
                  placeholder="•••••••• (min 6 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isSubmitting}
                  className="h-10 pl-10 bg-gray-800 border-gray-600 text-gray-100 placeholder:text-gray-500 focus:border-teal-500 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* Confirm Password Input */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-gray-300 font-medium">Confirm Password</Label>
              <div className="relative">
                 <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                 <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isSubmitting}
                  className="h-10 pl-10 bg-gray-800 border-gray-600 text-gray-100 placeholder:text-gray-500 focus:border-teal-500 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-11 mt-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-70 disabled:cursor-not-allowed"
              disabled={isSubmitting || isLoading}
            >
              {isSubmitting ? "Creating Account..." : "Create Account"}
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
          <div className="space-y-3">
            <Button
              type="button"
              className="w-full h-11 flex items-center justify-center gap-2 border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-70 disabled:cursor-not-allowed"
              onClick={() => handleOAuthLogin("google")}
              disabled={isSubmitting || isLoading}
              variant="outline" // Uses outline styles defined in className
            >
              <GoogleIcon />
              <span className="text-sm font-medium">
                {isSubmitting ? "Connecting..." : "Sign up with Google"}
              </span>
            </Button>
            {/* Add other OAuth providers here if needed */}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-center space-y-3 pt-4 pb-6 px-8 border-t border-gray-700/50 mt-6">
          <div className="text-sm text-center text-gray-400">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-teal-400 hover:text-teal-300 font-medium transition-colors duration-200 underline"
            >
              Sign in
            </Link>
          </div>
          <p className="text-xs text-gray-500 text-center">
            By signing up, you agree to our <Link to="/terms" className="underline hover:text-gray-300">Terms</Link> and <Link to="/privacy" className="underline hover:text-gray-300">Privacy Policy</Link>.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};