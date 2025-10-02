import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';

export interface DailyCheck {
  id: string;
  user_id: string;
  question_id: string;
  question_text: string;
  answer: string;
  answer_type: 'text' | 'choice';
  date: string;
  created_at: string;
  updated_at: string;
}

export interface DailyCheckInput {
  questionId: string;
  questionText: string;
  answer: string;
  answerType?: 'text' | 'choice';
  date?: string;
}

export function useDailyChecks(userId: string | null) {
  const [checks, setChecks] = useState<Record<string, DailyCheck>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDailyChecks = useCallback(async (date?: string) => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ userId });
      if (date) params.append('date', date);

      const response = await fetch(`/api/daily-checks?${params}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch daily checks');
      }

      // Convert array to object keyed by question_id for easy lookup
      const checksMap: Record<string, DailyCheck> = {};
      result.data.forEach((check: DailyCheck) => {
        checksMap[check.question_id] = check;
      });

      setChecks(checksMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching daily checks:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const saveDailyCheck = useCallback(async (input: DailyCheckInput) => {
    if (!userId) return;

    try {
      const response = await fetch('/api/daily-checks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          questionId: input.questionId,
          questionText: input.questionText,
          answer: input.answer,
          answerType: input.answerType || 'text',
          date: input.date || new Date().toISOString().split('T')[0],
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save daily check');
      }

      // Update local state
      setChecks(prev => ({
        ...prev,
        [input.questionId]: result.data,
      }));

      return result.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error saving daily check:', err);
      throw err;
    }
  }, [userId]);

  const getAnswer = useCallback((questionId: string): string => {
    return checks[questionId]?.answer || '';
  }, [checks]);

  const hasAnswer = useCallback((questionId: string): boolean => {
    return Boolean(checks[questionId]?.answer);
  }, [checks]);

  // Load today's checks on mount
  useEffect(() => {
    if (userId) {
      fetchDailyChecks();
    }
  }, [userId, fetchDailyChecks]);

  return {
    checks,
    loading,
    error,
    fetchDailyChecks,
    saveDailyCheck,
    getAnswer,
    hasAnswer,
  };
}
