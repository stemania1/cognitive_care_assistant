import { useEffect, useState } from 'react';
import { ALL_QUESTIONS } from '@/constants/questions';

export function useQuestionNavigation(today: string) {
  const windowKey = `dailyQuestionsWindow:${today}`;
  const [windowStart, setWindowStart] = useState<number>(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(windowKey);
      if (raw != null) {
        const parsed = parseInt(raw, 10);
        if (!isNaN(parsed) && parsed >= 0 && parsed < ALL_QUESTIONS.length) {
          setWindowStart(parsed);
        }
      }
    } catch {}
  }, [windowKey]);

  const nextThree = () => {
    setWindowStart((prev) => {
      const next = (prev + 3) % ALL_QUESTIONS.length;
      try {
        localStorage.setItem(windowKey, String(next));
      } catch {}
      return next;
    });
  };

  const prevThree = () => {
    setWindowStart((prev) => {
      const next = (prev - 3 + ALL_QUESTIONS.length) % ALL_QUESTIONS.length;
      try {
        localStorage.setItem(windowKey, String(next));
      } catch {}
      return next;
    });
  };

  const todaysQuestions = ALL_QUESTIONS.slice(windowStart, windowStart + 3);

  return {
    windowStart,
    todaysQuestions,
    nextThree,
    prevThree
  };
}
