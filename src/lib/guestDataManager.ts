import { supabase } from './supabaseClient';

export interface GuestData {
  dailyChecks: Record<string, any>;
  sessions: any[];
  photos: any[];
}

const GUEST_DATA_KEY = 'cognitive_care_guest_data';
const GUEST_DATA_EXPIRY_DAYS = 7; // Guest data expires after 7 days

export class GuestDataManager {
  private static instance: GuestDataManager;
  private guestData: GuestData | null = null;

  private constructor() {
    this.loadGuestData();
  }

  public static getInstance(): GuestDataManager {
    if (!GuestDataManager.instance) {
      GuestDataManager.instance = new GuestDataManager();
    }
    return GuestDataManager.instance;
  }

  private loadGuestData(): void {
    try {
      const stored = localStorage.getItem(GUEST_DATA_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Check if data has expired
        if (this.isDataExpired(parsed.createdAt)) {
          this.clearGuestData();
          return;
        }
        this.guestData = parsed.data;
      }
    } catch (error) {
      console.error('Error loading guest data:', error);
      this.clearGuestData();
    }
  }

  private isDataExpired(createdAt: string): boolean {
    const created = new Date(createdAt);
    const now = new Date();
    const diffDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays > GUEST_DATA_EXPIRY_DAYS;
  }

  private saveGuestData(): void {
    try {
      const dataToStore = {
        data: this.guestData,
        createdAt: new Date().toISOString()
      };
      localStorage.setItem(GUEST_DATA_KEY, JSON.stringify(dataToStore));
    } catch (error) {
      console.error('Error saving guest data:', error);
    }
  }

  private clearGuestData(): void {
    this.guestData = {
      dailyChecks: {},
      sessions: [],
      photos: []
    };
    localStorage.removeItem(GUEST_DATA_KEY);
  }

  public getDailyChecks(): Record<string, any> {
    return this.guestData?.dailyChecks || {};
  }

  public saveDailyCheck(check: any): void {
    if (!this.guestData) {
      this.guestData = {
        dailyChecks: {},
        sessions: [],
        photos: []
      };
    }
    
    this.guestData.dailyChecks[check.question_id] = check;
    this.saveGuestData();
  }

  public getSessions(): any[] {
    return this.guestData?.sessions || [];
  }

  public saveSession(session: any): void {
    if (!this.guestData) {
      this.guestData = {
        dailyChecks: {},
        sessions: [],
        photos: []
      };
    }
    
    this.guestData.sessions.unshift(session);
    // Keep only last 14 sessions
    this.guestData.sessions = this.guestData.sessions.slice(0, 14);
    this.saveGuestData();
  }

  public getPhotos(): any[] {
    return this.guestData?.photos || [];
  }

  public savePhoto(photo: any): void {
    if (!this.guestData) {
      this.guestData = {
        dailyChecks: {},
        sessions: [],
        photos: []
      };
    }
    
    this.guestData.photos.unshift(photo);
    this.saveGuestData();
  }

  public deleteDailyChecksByDate(date: string): void {
    if (!this.guestData) return;
    
    // Remove all daily checks for the specified date
    const updatedChecks = Object.fromEntries(
      Object.entries(this.guestData.dailyChecks).filter(([_, check]: [string, any]) => check.date !== date)
    );
    
    this.guestData.dailyChecks = updatedChecks;
    this.saveGuestData();
  }

  public deleteSession(sessionId: string): void {
    console.log('=== GUEST DATA MANAGER DELETE SESSION ===');
    console.log('SessionId to delete:', sessionId);
    console.log('Current guest data:', this.guestData);
    
    if (!this.guestData) {
      console.log('No guest data found, returning');
      return;
    }
    
    console.log('Sessions before delete:', this.guestData.sessions);
    
    // Remove the session with the specified ID
    this.guestData.sessions = this.guestData.sessions.filter((session: any) => {
      console.log('Checking session:', session.id, 'against:', sessionId, 'match:', session.id === sessionId);
      return session.id !== sessionId;
    });
    
    console.log('Sessions after delete:', this.guestData.sessions);
    this.saveGuestData();
    console.log('Guest data saved');
  }

  public clearAllData(): void {
    this.clearGuestData();
  }

  public async migrateToAccount(userId: string): Promise<void> {
    if (!this.guestData) return;

    try {
      // Migrate daily checks
      for (const check of Object.values(this.guestData.dailyChecks)) {
        await this.migrateDailyCheck(userId, check);
      }

      // Migrate sessions
      for (const session of this.guestData.sessions) {
        await this.migrateSession(userId, session);
      }

      // Clear guest data after successful migration
      this.clearAllData();
    } catch (error) {
      console.error('Error migrating guest data:', error);
      throw error;
    }
  }

  private async migrateDailyCheck(userId: string, check: any): Promise<void> {
    const response = await fetch('/api/daily-checks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        questionId: check.question_id,
        questionText: check.question_text,
        answer: check.answer,
        answerType: check.answer_type,
        date: check.date,
        photoUrl: check.photo_url
      }),
    });

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error || 'Failed to migrate daily check');
    }
  }

  private async migrateSession(userId: string, session: any): Promise<void> {
    const response = await fetch('/api/daily-check-sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        completedAt: session.completed_at,
        completionTime: session.completion_time,
        answersCount: session.answers_count
      }),
    });

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error || 'Failed to migrate session');
    }
  }
}

// Helper function to check if user is guest
export async function isGuestUser(): Promise<boolean> {
  try {
    // Check if we're on the client side
    if (typeof window === 'undefined') {
      return false;
    }
    
    // PRIORITY: Check Supabase authentication first (most reliable)
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      // If there's an auth error (like refresh token issues), treat as no user
      if (error) {
        // Check if it's an "Auth session missing" error - this is normal when not logged in
        if (error.message && (error.message.includes('Auth session missing') || error.message.includes('session missing'))) {
          // This is normal when there's no session - fall through to localStorage check
          console.log('No auth session (user not logged in), checking localStorage for guest session');
        } else if (error.message && (error.message.includes('Refresh Token') || error.message.includes('refresh_token'))) {
          // Check if it's a refresh token error - if so, it will be handled by the error handler
          console.log('Auth error (likely expired token):', error.message);
          // Import and call the handler
          const { handleRefreshTokenError } = await import('@/lib/supabaseClient');
          await handleRefreshTokenError();
          return false; // Return false since we're redirecting
        } else {
          console.log('Auth error:', error.message);
        }
        // Fall through to localStorage check for other errors
      } else if (user) {
        // If user is authenticated via Supabase
        if (user.is_anonymous) {
          return true;
        }
        
        // If user has an email address, they are definitely not a guest
        if (user.email) {
          // Clean up any leftover guest session data
          localStorage.removeItem('cognitive_care_guest_session');
          console.log('isGuestUser: User has email, not a guest:', user.email);
          return false;
        }
        
        // If it's a regular authenticated user without email, they're still not a guest
        // Clean up any leftover guest session data
        localStorage.removeItem('cognitive_care_guest_session');
        return false;
      }
    } catch (authError: any) {
      // If Supabase auth fails (network issues, expired tokens, etc.), 
      // fall back to localStorage check only
      // Specifically ignore "Auth session missing" errors as they're expected when not logged in
      if (authError?.message && (authError.message.includes('Auth session missing') || authError.message.includes('session missing'))) {
        // This is normal - just continue to localStorage check
        console.log('No auth session (expected when not logged in), checking localStorage');
      } else {
        console.log('Supabase auth check failed:', authError);
      }
    }
    
    // FALLBACK: Only check localStorage if no Supabase user found
    const guestSession = localStorage.getItem('cognitive_care_guest_session');
    if (guestSession) {
      const session = JSON.parse(guestSession);
      // Check if session is still valid (not expired)
      const createdAt = new Date(session.createdAt);
      const now = new Date();
      const diffDays = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
      
      if (diffDays < 7 && session.isGuest === true) { // Guest sessions expire after 7 days
        return true;
      } else {
        // Clean up expired session
        localStorage.removeItem('cognitive_care_guest_session');
      }
    }
    
    // No user and no guest session = not a guest
    return false;
  } catch (error) {
    console.error('Error checking user type:', error);
    return false;
  }
}

// Helper function to get guest user ID
export function getGuestUserId(): string | null {
  try {
    // Check if we're on the client side
    if (typeof window === 'undefined') {
      return null;
    }
    
    const guestSession = localStorage.getItem('cognitive_care_guest_session');
    if (guestSession) {
      const session = JSON.parse(guestSession);
      return session.userId;
    }
    
    // If no localStorage session, return null (will be handled by Supabase auth)
    return null;
  } catch (error) {
    console.error('Error getting guest user ID:', error);
    return null;
  }
}

// Helper function to get guest data manager
export function getGuestDataManager(): GuestDataManager {
  return GuestDataManager.getInstance();
}
