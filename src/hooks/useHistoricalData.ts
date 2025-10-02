import { useState, useCallback } from 'react';
import { DailyCheckSession, RecentAnswer } from '@/types/daily-questions';
import { groupAnswersByQuestionSets } from '@/utils/data-transformation';

export function useHistoricalData(userId: string | null) {
  const [sessions, setSessions] = useState<DailyCheckSession[]>([]);
  const [recentAnswers, setRecentAnswers] = useState<RecentAnswer[]>([]);
  const [loading, setLoading] = useState(false);

  const loadSessions = useCallback(async () => {
    if (!userId) return;
    try {
      const params = new URLSearchParams({ userId, limit: '10' });
      const res = await fetch(`/api/daily-check-sessions?${params}`);
      const json = await res.json();
      if (res.ok) {
        setSessions(json.data || []);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  }, [userId]);

  const loadRecentAnswers = useCallback(async () => {
    if (!userId) return;
    try {
      const params = new URLSearchParams({ userId });
      const res = await fetch(`/api/daily-checks?${params}`);
      const json = await res.json();
      if (res.ok) {
        const answers = json.data || [];
        const groupedAnswers = groupAnswersByQuestionSets(answers);
        setRecentAnswers(groupedAnswers);
      }
    } catch (error) {
      console.error('Error loading answers:', error);
    }
  }, [userId]);

  const deleteSession = useCallback(async (sessionId: string) => {
    if (!userId) return;
    try {
      const res = await fetch('/api/daily-check-sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, sessionId })
      });
      if (res.ok) {
        await loadSessions();
      }
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  }, [userId, loadSessions]);

  const deleteDailyChecks = useCallback(async (date: string) => {
    if (!userId) return;
    try {
      const res = await fetch('/api/daily-checks', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, date })
      });
      if (res.ok) {
        await loadRecentAnswers();
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
