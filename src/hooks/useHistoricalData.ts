import { useState, useCallback } from 'react';
import { DailyCheckSession, RecentAnswer } from '@/types/daily-questions';
import { groupAnswersByQuestionSets } from '@/utils/data-transformation';
import { getGuestDataManager, isGuestUser } from '@/lib/guestDataManager';

export function useHistoricalData(userId: string | null) {
  const [sessions, setSessions] = useState<DailyCheckSession[]>([]);
  const [recentAnswers, setRecentAnswers] = useState<RecentAnswer[]>([]);
  const [loading, setLoading] = useState(false);

  const loadSessions = useCallback(async () => {
    console.log('=== LOAD SESSIONS CALLED ===');
    console.log('userId:', userId);
    console.log('userId type:', typeof userId);
    
    if (!userId) {
      console.log('loadSessions: No userId provided');
      return;
    }
    
    try {
      // Check if user is guest
      const isGuest = await isGuestUser();
      console.log('loadSessions: isGuest =', isGuest);
      
      if (isGuest) {
        // For guest users, load from localStorage
        const guestManager = getGuestDataManager();
        const guestSessions = guestManager.getSessions();
        console.log('loadSessions: Guest sessions loaded:', guestSessions);
        setSessions(guestSessions);
      } else {
        // For regular users, load from API
        const params = new URLSearchParams({ userId, limit: '10' });
        console.log('loadSessions: Fetching from API:', `/api/daily-check-sessions?${params}`);
        const res = await fetch(`/api/daily-check-sessions?${params}`);
        const json = await res.json();
        console.log('loadSessions: API response:', json);
        if (res.ok) {
          setSessions(json.data || []);
        }
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  }, [userId]);

  const loadRecentAnswers = useCallback(async () => {
    if (!userId) {
      console.log('loadRecentAnswers: No userId provided');
      return;
    }
    
    try {
      // Check if user is guest
      const isGuest = await isGuestUser();
      console.log('loadRecentAnswers: isGuest =', isGuest);
      
      if (isGuest) {
        // For guest users, load from localStorage
        const guestManager = getGuestDataManager();
        const guestChecks = guestManager.getDailyChecks();
        console.log('loadRecentAnswers: Guest checks loaded:', guestChecks);
        
        // Convert guest data to the expected format
        const answers = Object.values(guestChecks).map((check: any) => ({
          id: check.id,
          user_id: check.user_id,
          question_id: check.question_id,
          question_text: check.question_text,
          answer: check.answer,
          answer_type: check.answer_type,
          date: check.date,
          created_at: check.created_at,
          updated_at: check.updated_at,
          photo_url: check.photo_url
        }));
        
        console.log('loadRecentAnswers: Converted answers:', answers);
        const groupedAnswers = groupAnswersByQuestionSets(answers);
        console.log('loadRecentAnswers: Grouped answers:', groupedAnswers);
        setRecentAnswers(groupedAnswers);
      } else {
        // For regular users, load from API
        const params = new URLSearchParams({ userId });
        console.log('loadRecentAnswers: Fetching from API:', `/api/daily-checks?${params}`);
        const res = await fetch(`/api/daily-checks?${params}`);
        const json = await res.json();
        console.log('loadRecentAnswers: API response:', json);
        if (res.ok) {
          const answers = json.data || [];
          const groupedAnswers = groupAnswersByQuestionSets(answers);
          setRecentAnswers(groupedAnswers);
        }
      }
    } catch (error) {
      console.error('Error loading answers:', error);
    }
  }, [userId]);

  const deleteSession = useCallback(async (sessionId: string) => {
    console.log('=== DELETE SESSION HOOK DEBUG ===');
    console.log('SessionId to delete:', sessionId);
    console.log('UserId:', userId);
    
    if (!userId) {
      console.log('No userId, returning early');
      return;
    }
    
    try {
      // Check if user is guest
      const isGuest = await isGuestUser();
      console.log('IsGuest in deleteSession:', isGuest);
      
      if (isGuest) {
        console.log('Guest user - deleting from localStorage');
        // For guest users, remove from localStorage
        const guestManager = getGuestDataManager();
        console.log('Guest manager sessions before delete:', guestManager.getSessions());
        guestManager.deleteSession(sessionId);
        console.log('Guest manager sessions after delete:', guestManager.getSessions());
        
        // Reload the data to reflect changes
        console.log('Reloading sessions...');
        await loadSessions();
        console.log('Sessions reloaded');
      } else {
        console.log('Regular user - deleting from API');
        // For regular users, delete via API
        const res = await fetch('/api/daily-check-sessions', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, sessionId })
        });
        console.log('API response status:', res.status);
        if (res.ok) {
          console.log('API delete successful, reloading sessions...');
          await loadSessions();
          console.log('Sessions reloaded');
        } else {
          console.error('API delete failed:', await res.text());
        }
      }
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  }, [userId, loadSessions]);

  const deleteDailyChecks = useCallback(async (date: string) => {
    console.log('=== DELETE DAILY CHECKS HOOK DEBUG ===');
    console.log('Date to delete:', date);
    console.log('UserId:', userId);
    
    if (!userId) {
      console.log('No userId, returning early');
      return;
    }
    
    try {
      // Check if user is guest
      const isGuest = await isGuestUser();
      console.log('IsGuest in deleteDailyChecks:', isGuest);
      
      if (isGuest) {
        console.log('Guest user - deleting daily checks from localStorage');
        // For guest users, remove from localStorage
        const guestManager = getGuestDataManager();
        console.log('Guest manager daily checks before delete:', Object.keys(guestManager.getDailyChecks()));
        guestManager.deleteDailyChecksByDate(date);
        console.log('Guest manager daily checks after delete:', Object.keys(guestManager.getDailyChecks()));
        
        // Reload the data to reflect changes
        console.log('Reloading recent answers...');
        await loadRecentAnswers();
        console.log('Recent answers reloaded');
      } else {
        console.log('Regular user - deleting daily checks from API');
        // For regular users, delete via API
        const res = await fetch('/api/daily-checks', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, date })
        });
        console.log('API response status:', res.status);
        if (res.ok) {
          console.log('API delete successful, reloading recent answers...');
          await loadRecentAnswers();
          console.log('Recent answers reloaded');
        } else {
          console.error('API delete failed:', await res.text());
        }
      }
    } catch (error) {
      console.error('Error deleting daily checks:', error);
    }
  }, [userId, loadRecentAnswers]);

  return {
    sessions,
    recentAnswers,
    loading,
    loadSessions,
    loadRecentAnswers,
    deleteSession,
    deleteDailyChecks
  };
}
