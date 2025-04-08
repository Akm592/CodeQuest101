import { useEffect } from "react";
import { Navigate, Link } from "react-router-dom"; // Added Link
import { useAuth } from "../../contexts/AuthContext"; // Adjust path if needed
import { supabase } from "../../lib/supabaseClient"; // Adjust path if needed
import { Loader2, AlertTriangle } from "lucide-react"; // Added Icons

export const AuthCallback = () => {
  const { user, isLoading, setIsLoading } = useAuth(); // Assuming setIsLoading is available

  useEffect(() => {
    let isMounted = true; // Prevent state updates on unmounted component

    const handleCallback = async () => {
      // Ensure isLoading is true initially if not set by context
      if (setIsLoading) setIsLoading(true);

      const { searchParams } = new URL(window.location.href);
      const code = searchParams.get("code");
      const error = searchParams.get("error");
      const errorDescription = searchParams.get("error_description");

      if (error) {
        console.error("OAuth Error:", error, errorDescription);
        if (isMounted && setIsLoading) setIsLoading(false); // Stop loading on error
        // Potentially display the error message to the user
        return;
      }

      if (code) {
        try {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
             console.error("Code exchange error:", exchangeError);
          }
          // The user state should update automatically via onAuthStateChange listener
          // handled within AuthContext, triggering a re-render and navigation.
        } catch (exchangeCatchError) {
           console.error("Caught exception during code exchange:", exchangeCatchError);
        } finally {
             if (isMounted && setIsLoading) setIsLoading(false); // Let AuthContext handle setting isLoading to false based on user state change
        }
      } else {
         console.warn("No auth code found in callback URL.");
         if (isMounted && setIsLoading) setIsLoading(false); // No code, stop loading
      }
    };

    handleCallback();

    return () => {
      isMounted = false; // Cleanup
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setIsLoading]); // Add setIsLoading dependency if used

  // --- Render Logic ---

  // Still loading auth state (handled by AuthContext ideally)
  if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-950 to-black text-gray-400 w-screen p-4">
            <Loader2 className="h-10 w-10 animate-spin text-teal-500 mb-4" />
            <p>Processing authentication...</p>
        </div>
      );
  }

  // User successfully authenticated and loaded
  if (user) {
      return <Navigate to="/chat" replace />; // Navigate to the main app page
  }

  // Authentication failed or no user found after processing
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-950 to-black text-gray-300 w-screen p-4">
        <div className="text-center max-w-md p-6 bg-gray-900 border border-gray-700 rounded-lg shadow-xl">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-100 mb-2">Authentication Failed</h1>
            <p className="text-gray-400 mb-6">
                Something went wrong during the authentication process. Please try signing in again.
            </p>
            <Link
                to="/login"
                className="inline-block bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-gray-900"
            >
                Return to Sign In
            </Link>
        </div>
    </div>
  );
};