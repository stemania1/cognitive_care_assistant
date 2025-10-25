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
    if (!userId) return;
    
    try {
      // Check if user is guest
      const isGuest = await isGuestUser();
      
      if (isGuest) {
        // For guest users, remove from localStorage
        const guestManager = getGuestDataManager();
        const sessions = guestManager.getSessions();
        const updatedSessions = sessions.filter(session => session.id !== sessionId);
        
        // Update localStorage (we need to modify the guest manager to support this)
        // For now, we'll just reload the data
        await loadSessions();
      } else {
        // For regular users, delete via API
        const res = await fetch('/api/daily-check-sessions', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, sessionId })
        });
        if (res.ok) {
          await loadSessions();
        }
      }
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  }, [userId, loadSessions]);

  const deleteDailyChecks = useCallback(async (date: string) => {
    if (!userId) return;
    
    try {
      // Check if user is guest
      const isGuest = await isGuestUser();
      
      if (isGuest) {
        // For guest users, remove from localStorage
        const guestManager = getGuestDataManager();
        guestManager.deleteDailyChecksByDate(date);
        
        // Reload the data to reflect changes
        await loadRecentAnswers();
      } else {
        // For regular users, delete via API
        const res = await fetch('/api/daily-checks', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, date })
        });
        if (res.ok) {
          await loadRecentAnswers();
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
