// ./src/contexts/AuthContext.tsx
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signInWithOAuth: (provider: "google") => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  createChatSession: () => Promise<any>;
  getChatSession: () => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch the initial session
    const initializeAuth = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) console.error("Error fetching session:", error);
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    };

    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth event:", event);
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Cleanup subscription
    return () => subscription.unsubscribe();
  }, []);

  // OAuth Sign-In (e.g., Google)
  const signInWithOAuth = async (provider: "google") => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) throw new Error(`OAuth login failed: ${error.message}`);
  };

  // Email/Password Sign-In
  const signInWithEmail = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(`Email login failed: ${error.message}`);
    setSession(data.session);
    setUser(data.user);
  };

  // Email/Password Sign-Up
  const signUpWithEmail = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) throw new Error(`Sign-up failed: ${error.message}`);
    if (data.session) {
      setSession(data.session);
      setUser(data.user);
    }
  };

  // Sign Out
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(`Sign-out failed: ${error.message}`);
    setSession(null);
    setUser(null);
  };

   // New: Create a new chat session for the authenticated user.
   const createChatSession = async () => {
    if (!user) throw new Error("User not authenticated");
    const { data, error } = await supabase
      .from("chat_sessions")
      .insert({ user_id: user.id }) // user.id should be the UUID from Supabase Auth, which should match your users.id in the new schema.
      .select();
    if (error) {
      console.error("Error creating chat session:", error);
      throw error;
    }
    // Assuming data is returned as an array with the new session.
    return data && data.length > 0 ? data[0] : null; // Return the newly created session data
  };

  // New: Retrieve the latest chat session for the current user.
  const getChatSession = async () => {
    if (!user) throw new Error("User not authenticated");
    // Check that user.id is a valid UUID (it should be if coming from Supabase Auth)
    console.log("Fetching chat session for user:", user.id);
    const { data, error } = await supabase
      .from("chat_sessions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }) // Still ordered by created_at, consider using session_start_time if more relevant
      .limit(1);
    if (error) {
      console.error(
        "Error retrieving chat session:",
        error.message,
        error.details
      );
      throw error;
    }
    return data && data.length > 0 ? data[0] : null;
  };


  const value = {
    user,
    session,
    isLoading,
    signInWithOAuth,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    createChatSession,
    getChatSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};