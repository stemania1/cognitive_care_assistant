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
    const { data: { user } } = await supabase.auth.getUser();
    return user?.is_anonymous || false;
  } catch (error) {
    console.error('Error checking user type:', error);
    return false;
  }
}

// Helper function to get guest data manager
export function getGuestDataManager(): GuestDataManager {
  return GuestDataManager.getInstance();
}
