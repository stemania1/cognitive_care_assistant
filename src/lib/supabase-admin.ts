import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Creates a Supabase admin client with service role key for server-side operations.
 * This client bypasses Row Level Security (RLS) policies.
 * 
 * @returns Supabase admin client
 * @throws Error if service role key or Supabase URL is not configured
 */
export function createSupabaseAdminClient(): SupabaseClient {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!serviceRoleKey || serviceRoleKey === '<your-service-role-key>') {
    throw new Error('Service role key not configured. Please set SUPABASE_SERVICE_ROLE_KEY in .env.local');
  }

  if (!supabaseUrl) {
    throw new Error('Supabase URL not configured. Please set NEXT_PUBLIC_SUPABASE_URL in .env.local');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

/**
 * Creates a Supabase admin client and returns it along with error handling.
 * Use this in API routes when you need to return a proper HTTP response on error.
 * 
 * @returns Object with client and error (if any)
 */
export function getSupabaseAdminClient(): {
  client: SupabaseClient | null;
  error: { message: string; details?: string } | null;
} {
  try {
    const client = createSupabaseAdminClient();
    return { client, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error creating admin client';
    return {
      client: null,
      error: {
        message: 'Service role key not configured',
        details: errorMessage
      }
    };
  }
}

