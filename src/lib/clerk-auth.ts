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

