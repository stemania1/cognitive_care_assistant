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

// Wrapper function to safely get user, handling refresh token errors
export const safeGetUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      // Check if it's a refresh token error
      if (error.message && (error.message.includes('Refresh Token') || error.message.includes('refresh_token'))) {
        console.log('Refresh token error in safeGetUser, handling...');
        await handleRefreshTokenError();
        return { user: null, error: null };
      }
      
      // Check if it's an "Auth session missing" error - this is normal when not logged in
      if (error.message && (error.message.includes('Auth session missing') || error.message.includes('session missing'))) {
        // This is normal when there's no session - just return no user
        return { user: null, error: null };
      }
      
      // For other errors, just return them
      return { user: null, error };
    }
    
    return { user, error: null };
  } catch (err: any) {
    // Check if it's a refresh token error
    if (err?.message && (err.message.includes('Refresh Token') || err.message.includes('refresh_token'))) {
      console.log('Refresh token error caught in safeGetUser, handling...');
      await handleRefreshTokenError();
      return { user: null, error: null };
    }
    
    // Check if it's an "Auth session missing" error - this is normal when not logged in
    if (err?.message && (err.message.includes('Auth session missing') || err.message.includes('session missing'))) {
      // This is normal when there's no session - just return no user
      return { user: null, error: null };
    }
    
    return { user: null, error: err };
  }
};


