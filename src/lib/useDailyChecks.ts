import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';
import { getGuestDataManager, isGuestUser } from './guestDataManager';

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
  photo_url?: string;
}

export interface DailyCheckInput {
  questionId: string;
  questionText: string;
  answer: string;
  answerType?: 'text' | 'choice';
  date?: string;
  photoUrl?: string;
}

export function useDailyChecks(userId: string | null) {
  const [checks, setChecks] = useState<Record<string, DailyCheck>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(false);

  // Check if user is guest
  useEffect(() => {
    const checkGuestStatus = async () => {
      if (userId) {
        const guestStatus = await isGuestUser();
        setIsGuest(guestStatus);
      }
    };
    checkGuestStatus();
  }, [userId]);

  const fetchDailyChecks = useCallback(async (date?: string) => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      if (isGuest) {
        // For guest users, fetch from local storage
        const guestManager = getGuestDataManager();
        const guestChecks = guestManager.getDailyChecks();
        
        // Convert to the expected format
        const checksMap: Record<string, DailyCheck> = {};
        Object.values(guestChecks).forEach((check: any) => {
          checksMap[check.question_id] = check;
        });
        
        setChecks(checksMap);
      } else {
        // For regular users, fetch from API
        const params = new URLSearchParams({ userId });
        if (date) params.append('date', date);

        console.log('Fetching daily checks from API:', `/api/daily-checks?${params}`);
        const response = await fetch(`/api/daily-checks?${params}`);
        console.log('API response status:', response.status);
        
        const result = await response.json();
        console.log('API response data:', result);

        if (!response.ok) {
          const errorMessage = result.error || result.details || result.message || 'Failed to fetch daily checks';
          console.error('API Error:', errorMessage, 'Response:', result);
          throw new Error(errorMessage);
        }

        // Convert array to object keyed by question_id for easy lookup
        const checksMap: Record<string, DailyCheck> = {};
        if (result.data && Array.isArray(result.data)) {
          result.data.forEach((check: DailyCheck) => {
            checksMap[check.question_id] = check;
          });
        } else {
          console.warn('Unexpected API response structure:', result);
        }

        setChecks(checksMap);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching daily checks:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, isGuest]);

  const saveDailyCheck = useCallback(async (input: DailyCheckInput) => {
    if (!userId) return;

    try {
      if (isGuest) {
        // For guest users, save to local storage
        const guestManager = getGuestDataManager();
        const checkData = {
          id: `guest_${Date.now()}_${input.questionId}`,
          user_id: userId,
          question_id: input.questionId,
          question_text: input.questionText,
          answer: input.answer,
          answer_type: input.answerType || 'text',
          date: input.date || new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          photo_url: input.photoUrl
        };
        
        guestManager.saveDailyCheck(checkData);
        
        // Update local state
        setChecks(prev => ({
          ...prev,
          [input.questionId]: checkData,
        }));
        
        return checkData;
      } else {
        // For regular users, save via API
        const body: any = {
          userId,
          questionId: input.questionId,
          questionText: input.questionText,
          answer: input.answer,
          answerType: input.answerType || 'text',
          date: input.date || new Date().toISOString().split('T')[0],
        };
        
        if (input.photoUrl) {
          body.photoUrl = input.photoUrl;
        }

        const response = await fetch('/api/daily-checks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });

        const result = await response.json();

        if (!response.ok) {
          const errorMessage = result.details || result.error || result.message || 'Failed to save daily check';
          console.error('API Error:', errorMessage, 'Response:', result);
          throw new Error(errorMessage);
        }

        // Update local state
        setChecks(prev => ({
          ...prev,
          [input.questionId]: result.data,
        }));

        return result.data;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error saving daily check:', err);
      throw err;
    }
  }, [userId, isGuest]);

  const getAnswer = useCallback((questionId: string): string => {
    return checks[questionId]?.answer || '';
  }, [checks]);

  const hasAnswer = useCallback((questionId: string): boolean => {
    return Boolean(checks[questionId]?.answer);
  }, [checks]);

  const clearChecks = useCallback(() => {
    setChecks({});
  }, []);

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
    clearChecks,
    isGuest,
  };
}
