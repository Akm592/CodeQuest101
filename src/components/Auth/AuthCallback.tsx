import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabaseClient";

export const AuthCallback = () => {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      const { searchParams } = new URL(window.location.href);
      const code = searchParams.get("code");
      if (code) {
        await supabase.auth.exchangeCodeForSession(code);
      }
    };
    handleCallback();
  }, []);

  if (isLoading) return <div>Processing...</div>;
  if (user) return <Navigate to="/chat" replace />;

  return <div>Authentication failed. <a href="/login">Try again</a></div>;
};