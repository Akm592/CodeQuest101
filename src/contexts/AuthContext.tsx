// src/contexts/AuthContext.tsx
import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
} from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

interface AuthContextType {
  supabaseClient: SupabaseClient;
  session: any | null; // Supabase Session type can be more specific if needed
  user: any | null; // Supabase User type can be more specific if needed
  signInWithOAuth: (provider: "google" | "github" | "apple") => Promise<any>; // Adjust providers as needed
  signInWithPassword: (email: string, password?: string) => Promise<any>;
  signUpWithPassword: (email: string, password?: string) => Promise<any>;
  signOut: () => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
  supabaseUrl: string;
  supabaseAnonKey: string;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({
  children,
  supabaseUrl,
  supabaseAnonKey,
}) => {
  const [supabaseClient] = useState(() =>
    createClient(supabaseUrl, supabaseAnonKey)
  );
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user || null);
      setIsLoading(false);
    });

    supabaseClient.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user || null);
    });
  }, [supabaseClient]);

  const clearError = () => setError(null);

  const signInWithOAuth = async (provider: "google" | "github" | "apple") => {
    setIsLoading(true);
    setError(null);
    try {
      const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: provider,
      });
      if (error) {
        setError(error.message);
        setIsLoading(false);
        return false; // Indicate failure
      }
      return true; // Indicate success (redirect handled by Supabase)
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during sign in.");
      setIsLoading(false);
      return false; // Indicate failure
    }
  };

  const signInWithPassword = async (email: string, password?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const {
        error,
        data: { session, user },
      } = await supabaseClient.auth.signInWithPassword({
        email,
        password: password || "",
      }); // Password can be optional if using magic link
      if (error) {
        setError(error.message);
      } else {
        setSession(session);
        setUser(user);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during sign in.");
    } finally {
      setIsLoading(false);
    }
  };

  const signUpWithPassword = async (email: string, password?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const {
        error,
        data: { session, user },
      } = await supabaseClient.auth.signUp({ email, password: password || "" });
      if (error) {
        setError(error.message);
      } else {
        setSession(session);
        setUser(user);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during sign up.");
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { error } = await supabaseClient.auth.signOut();
      if (error) {
        setError(error.message);
        return false; // Indicate failure
      } else {
        return true; // Indicate success
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during sign out.");
      return false; // Indicate failure
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    supabaseClient,
    session,
    user,
    signInWithOAuth,
    signInWithPassword,
    signUpWithPassword,
    signOut,
    isLoading,
    error,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
