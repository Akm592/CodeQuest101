// ./src/contexts/AuthContext.tsx
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { Session, User } from "@supabase/supabase-js";
import {
  supabase,
  getCurrentUser,
  getCurrentSession,
} from "../lib/supabaseClient";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signInWithOAuth: (provider: "google" | "github") => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  // New functions for chat session integration:
  createChatSession: () => Promise<any>;
  getChatSession: () => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for an existing session on component mount
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        console.log("Initializing auth...");

        // First check if we can get the session directly from supabase
        // This avoids the timeout issue with getCurrentSession()
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();

        if (currentSession) {
          console.log("Session retrieved successfully");
          setSession(currentSession);

          // If we have a session, we can get the user
          const {
            data: { user: currentUser },
          } = await supabase.auth.getUser();
          setUser(currentUser);
        } else {
          // Fallback to getCurrentSession with a safety timeout
          try {
            const timeoutPromise = new Promise<null>((_, reject) => {
              setTimeout(() => {
                reject(new Error("Session retrieval timed out"));
              }, 5000);
            });

            const sessionResult = await Promise.race([
              getCurrentSession(),
              timeoutPromise,
            ]);

            if (sessionResult) {
              setSession(sessionResult as Session);
              const currentUser = await getCurrentUser();
              setUser(currentUser);
            } else {
              setSession(null);
              setUser(null);
            }
          } catch (error) {
            console.log("Fallback session retrieval failed:", error);
            setSession(null);
            setUser(null);
          }
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        setSession(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Set up auth state listener
    const {
      data: { subscription },
    } = // Inside the useEffect in AuthProvider
      supabase.auth.onAuthStateChange(async (event, currentSession) => {
        console.log("Auth state changed:", event);
        setSession(currentSession);
        if (currentSession) {
          const {
            data: { user: currentUser },
            error,
          } = await supabase.auth.getUser();
          if (error) console.error("Error fetching user:", error);
          setUser(currentUser);
        } else {
          setUser(null);
        }
      });

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sign in with OAuth provider
const signInWithOAuth = async (provider: "google" | "github") => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) throw error;

    // If using client-side insertion, check and create the user profile
    if (data.user) {
      const { error: profileError } = await supabase.from("users").upsert({
        id: data.user.id,
        email: data.user.email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (profileError) throw profileError;
    }
  } catch (error) {
    console.error("Error signing in with OAuth:", error);
    throw error;
  }
};

  // Sign in with email and password
  const signInWithEmail = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    } catch (error) {
      console.error("Error signing in with email:", error);
      throw error;
    }
  };

  // Sign up with email and password
  // Update the signUpWithEmail function in AuthContext.tsx
  const signUpWithEmail = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      // If using client-side insertion instead of a trigger:
      if (data.user) {
        const { error: profileError } = await supabase.from("users").upsert({
          id: data.user.id,
          email: data.user.email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        if (profileError) throw profileError;
      }
    } catch (error) {
      console.error("Error signing up with email:", error);
      throw error;
    }
  };

  // Reset password
  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
    } catch (error) {
      console.error("Error resetting password:", error);
      throw error;
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
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
    resetPassword,
    createChatSession,
    getChatSession,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
