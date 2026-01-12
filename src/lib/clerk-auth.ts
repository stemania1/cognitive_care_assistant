/**
 * Clerk Authentication Utilities
 * 
 * This file provides helper functions for Clerk authentication,
 * serving as a replacement for the Supabase auth functions.
 */

import { auth, currentUser } from "@clerk/nextjs/server";

/**
 * Get the current authenticated user (server-side)
 * Returns null if not authenticated
 */
export async function getClerkUser() {
  try {
    const user = await currentUser();
    return user;
  } catch (error) {
    console.error("Error getting Clerk user:", error);
    return null;
  }
}

/**
 * Get the user ID from the auth object (server-side)
 * Returns null if not authenticated
 */
export async function getClerkUserId(): Promise<string | null> {
  try {
    const { userId } = await auth();
    return userId;
  } catch (error) {
    console.error("Error getting Clerk user ID:", error);
    return null;
  }
}

/**
 * Check if user is authenticated (server-side)
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const { userId } = await auth();
    return !!userId;
  } catch (error) {
    return false;
  }
}


/**
 * Validate that the provided userId matches the authenticated Clerk user
 * Returns the authenticated user ID if valid, throws error if not
 * Use this in API routes to ensure users can only access their own data
 */
export async function validateUserId(requestedUserId: string | null): Promise<string> {
  const authenticatedUserId = await getClerkUserId();
  
  if (!authenticatedUserId) {
    throw new Error('Unauthorized: User not authenticated');
  }
  
  if (!requestedUserId) {
    throw new Error('Bad Request: User ID is required');
  }
  
  if (requestedUserId !== authenticatedUserId) {
    throw new Error('Forbidden: User ID does not match authenticated user');
  }
  
  return authenticatedUserId;
}
