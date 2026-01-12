/**
 * User ID Mapping Utilities
 * 
 * Maps Clerk user IDs to old Supabase Auth UUIDs to allow access to legacy data
 */

import { getSupabaseAdminClient } from './supabase-admin';

/**
 * Get mapped Supabase UUID for a Clerk user ID
 * Returns null if no mapping exists
 */
export async function getMappedSupabaseUuid(clerkUserId: string): Promise<string | null> {
  try {
    const { client: supabaseAdmin, error: adminError } = getSupabaseAdminClient();
    if (adminError || !supabaseAdmin) {
      console.error('Error getting Supabase admin client:', adminError);
      return null;
    }

    const { data, error } = await supabaseAdmin
      .from('user_id_mappings')
      .select('supabase_uuid')
      .eq('clerk_user_id', clerkUserId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No mapping found
        return null;
      }
      console.error('Error fetching user ID mapping:', error);
      return null;
    }

    return data?.supabase_uuid || null;
  } catch (error) {
    console.error('Error in getMappedSupabaseUuid:', error);
    return null;
  }
}

/**
 * Get all user IDs (Clerk ID and mapped Supabase UUID) for querying
 * Returns array of user IDs to use in OR queries
 */
export async function getAllUserIdsForQuery(clerkUserId: string): Promise<string[]> {
  const ids: string[] = [clerkUserId];
  
  const mappedUuid = await getMappedSupabaseUuid(clerkUserId);
  if (mappedUuid) {
    ids.push(mappedUuid);
  }
  
  return ids;
}
