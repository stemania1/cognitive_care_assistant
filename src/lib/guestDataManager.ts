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
    
    // First check localStorage for guest session (faster and avoids auth errors)
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
    
    // Then check Supabase authentication status (with error handling)
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      // If there's an auth error (like refresh token issues), treat as no user
      if (error) {
        console.log('Auth error (likely expired token):', error.message);
        return false;
      }
      
      // If user is authenticated via Supabase
      if (user) {
        // Check if it's an anonymous user
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
    } catch (authError) {
      // If Supabase auth fails (network issues, expired tokens, etc.), 
      // fall back to localStorage check only
      console.log('Supabase auth check failed:', authError);
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
