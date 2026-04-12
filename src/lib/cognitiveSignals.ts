/**
 * Client-side signals derived from CCA local activity (memory games, daily questions).
 * Used by the biomedical brain mapping — not a clinical diagnosis.
 */

import { getGameStats } from "@/utils/memory-games-tracking";

export type CognitiveSignals = {
  /** 0 = weak memory performance, 1 = strong */
  memoryStrength: number;
  /** 0 = strong language/response patterns, 1 = concern */
  languageConcern: number;
  /** 0 = strong executive/engagement, 1 = concern (confusion / disorientation heuristics) */
  executiveConcern: number;
  /** Data sources available (for UI copy) */
  hasMemoryStats: boolean;
  hasDailyAnswers: boolean;
};

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

/**
 * Heuristic: short or empty free-text answers suggest difficulty (not diagnostic).
 */
function analyzeDailyQuestionAnswers(): { concern: number; hasData: boolean } {
  if (typeof window === "undefined") {
    return { concern: 0.35, hasData: false };
  }
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith("dailyQuestions:")) keys.push(k);
    }
    if (keys.length === 0) return { concern: 0.35, hasData: false };

    let total = 0;
    let shortCount = 0;
    for (const key of keys.slice(-14)) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as Record<string, { v?: string } | string>;
      for (const val of Object.values(parsed)) {
        const text = typeof val === "string" ? val : val?.v ?? "";
        const t = String(text).trim();
        if (!t) continue;
        total += 1;
        if (t.length < 12) shortCount += 1;
      }
    }
    if (total === 0) return { concern: 0.35, hasData: false };
    const ratio = shortCount / total;
    return { concern: clamp01(0.2 + ratio * 1.2), hasData: true };
  } catch {
    return { concern: 0.35, hasData: false };
  }
}

export function readCognitiveSignalsFromApp(): CognitiveSignals {
  if (typeof window === "undefined") {
    return {
      memoryStrength: 0.55,
      languageConcern: 0.35,
      executiveConcern: 0.35,
      hasMemoryStats: false,
      hasDailyAnswers: false,
    };
  }

  const stats = getGameStats("memory");
  const hasMemoryStats = stats.totalCompletions > 0 || stats.totalIncorrectAttempts > 0;

  let memoryStrength = 0.55;
  if (hasMemoryStats && stats.totalCompletions > 0) {
    const avgIncorrectPerGame =
      stats.totalIncorrectAttempts / Math.max(1, stats.totalCompletions);
    const incorrectPenalty = clamp01(avgIncorrectPerGame / 8);
    let timeScore = 0.55;
    if (stats.averageCompletionTime > 0 && Number.isFinite(stats.averageCompletionTime)) {
      const sec = stats.averageCompletionTime / 1000;
      timeScore = clamp01(1.15 - sec / 120);
    }
    memoryStrength = clamp01(0.55 * (1 - incorrectPenalty) + 0.45 * timeScore);
  }

  const daily = analyzeDailyQuestionAnswers();
  const languageConcern = daily.concern;
  const executiveConcern = clamp01(0.25 + daily.concern * 0.65 + (1 - memoryStrength) * 0.15);

  return {
    memoryStrength,
    languageConcern,
    executiveConcern,
    hasMemoryStats,
    hasDailyAnswers: daily.hasData,
  };
}
