// lib/supabaseClient.ts (Example - adjust based on your current implementation)
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY as string;
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const getCurrentSession = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
};

export const getCurrentUser = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // Fetch additional user data
    const { data: profile, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    // If profile doesn't exist, create it (fallback)
    if (error?.code === "PGRST116") {
      // Code for "no rows found"
      const { data: newProfile } = await supabase
        .from("users")
        .insert({ id: user.id, email: user.email })
        .select()
        .single();
      return { ...user, profile: newProfile };
    }

    return { ...user, profile };
  }
  return user;
};