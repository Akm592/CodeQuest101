// Code for handling the OAuth callback from Supabase
// // ../../../src/components/Auth/AuthCallback.tsx
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";

export const AuthCallback = () => {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the code from the URL
        const { searchParams } = new URL(window.location.href);
        const code = searchParams.get("code");

        if (!code) {
          setError("No code provided in the callback URL");
          return;
        }

        // Handle the OAuth callback with Supabase
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          throw error;
        }
      } catch (err) {
        console.error("Error handling auth callback:", err);
        setError("Failed to complete authentication. Please try again.");
      }
    };

    handleAuthCallback();
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="bg-red-50 p-4 rounded-md text-red-500 mb-4">
          {error}
        </div>
        <a
          href="/login"
          className="text-blue-500 hover:text-blue-700 underline"
        >
          Return to login
        </a>
      </div>
    );
  }

  // Redirect to dashboard on successful authentication
  return <Navigate to="/chat" replace />;
};
