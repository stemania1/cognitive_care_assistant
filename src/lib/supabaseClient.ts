import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Note: We still create the client with fallback strings to avoid hard crashes
// during build, but consumers should gate on `isSupabaseConfigured` for UX.
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-key"
);

// Function to clear all authentication data
export const clearAuthSession = async () => {
  try {
    // Sign out from Supabase
    await supabase.auth.signOut();
    
    // Clear local storage
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
    }
    
    console.log('Authentication session cleared');
    return true;
  } catch (error) {
    console.error('Error clearing auth session:', error);
    return false;
  }
};

// Function to handle refresh token errors
export const handleRefreshTokenError = async () => {
  console.log('Refresh token error detected, clearing session...');
  await clearAuthSession();
  
  // Redirect to sign-in page
  if (typeof window !== 'undefined') {
    window.location.href = '/signin';
  }
};


