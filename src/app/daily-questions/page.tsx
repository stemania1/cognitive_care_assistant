"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useDailyChecks } from "@/lib/useDailyChecks";
import { supabase } from "@/lib/supabaseClient";
import { getTodayKey } from "@/utils/date";
import { ALL_QUESTIONS } from "@/constants/questions";
import { useQuestionNavigation } from "@/hooks/useQuestionNavigation";
import { useHistoricalData } from "@/hooks/useHistoricalData";
import { AuthenticationGuard } from "@/app/components/daily-questions/AuthenticationGuard";
import { QuestionCard } from "@/app/components/daily-questions/QuestionCard";
import { QuestionNavigation } from "@/app/components/daily-questions/QuestionNavigation";
import { CompletionChart } from "@/app/components/daily-questions/CompletionChart";
import { RecentAnswersTable } from "@/app/components/daily-questions/RecentAnswersTable";

export default function DailyQuestionsPage() {
  const today = useMemo(() => getTodayKey(), []);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [completionTime, setCompletionTime] = useState<number | null>(null);
  
  const { saveDailyCheck, getAnswer, hasAnswer, loading: dbLoading } = useDailyChecks(userId);
  const { windowStart, todaysQuestions, nextThree, prevThree } = useQuestionNavigation(today);
  const { sessions, recentAnswers, loadSessions, loadRecentAnswers, deleteDailyChecks } = useHistoricalData(userId);

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
  }, []);

  function setAnswer(id: string, value: string) {
    if (!startedAt) setStartedAt(Date.now());
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  function setPhotoUrl(id: string, url: string) {
    setPhotoUrls((prev) => ({ ...prev, [id]: url }));
  }

  async function saveAll() {
    if (!userId) {
      alert('Please sign in to save your answers.');
      return;
    }
    try {
      setSaving(true);
      for (const q of todaysQuestions) {
        const value = (answers[q.id] ?? getAnswer(q.id) ?? "").toString().trim();
        if (!value) continue;
        const photoUrl = photoUrls[q.id];
        await saveDailyCheck({
          questionId: q.id,
          questionText: q.text,
          answer: value,
          answerType: q.choices ? 'choice' : 'text',
          date: today,
          photoUrl: photoUrl || undefined,
        });
      }
      if (startedAt) {
        const durationMs = Date.now() - startedAt;
        const durationSeconds = Math.round(durationMs / 1000);
        setCompletionTime(durationSeconds);
        try {
          await fetch('/api/daily-check-sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, date: today, setStartIndex: windowStart, durationMs })
          });
        } catch (error) {
          console.error('Error saving session:', error);
        }
      }
      setSaved(true);
      setShowHistory(true);
      await loadSessions();
      await loadRecentAnswers();
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setSaving(false);
    }
  }

  function showProgress() {
    setShowHistory(true);
    loadSessions();
    loadRecentAnswers();
  }

  return (
    <AuthenticationGuard userId={userId}>
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-black via-[#0b0520] to-[#0b1a3a] text-white">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(1200px_600px_at_50%_-200px,rgba(168,85,247,0.25),transparent),radial-gradient(900px_500px_at_80%_120%,rgba(34,211,238,0.18),transparent),radial-gradient(800px_400px_at_10%_120%,rgba(59,130,246,0.12),transparent)]" />
        <div className="pointer-events-none absolute -top-24 right-1/2 h-[420px] w-[420px] translate-x-1/2 rounded-full bg-gradient-to-r from-fuchsia-500/25 via-purple-500/20 to-cyan-500/25 blur-3xl -z-10" />

        <main className="relative p-6 sm:p-12">
          <div className="mx-auto max-w-3xl">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex flex-col">
                <h1 className="text-2xl sm:text-3xl font-semibold">Daily Questions</h1>
                <span className="text-xs opacity-70">Set label: Questions {((windowStart % ALL_QUESTIONS.length) + 1)}–{(((windowStart + 3) % ALL_QUESTIONS.length) + 1)} of {ALL_QUESTIONS.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={showProgress}
                  className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20"
                  type="button"
                >
                  Show Progress
                </button>
                <Link href="/dashboard" className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20">
                  Back to Home
                </Link>
              </div>
            </div>

            {dbLoading ? (
              <div className="text-center py-8">
                <div className="text-white/60">Loading...</div>
              </div>
            ) : (
              <>
                {/* Questions */}
                <div className="space-y-4 mb-6">
                  {todaysQuestions.map((q) => (
                    <QuestionCard
                      key={q.id}
                      question={q}
                      value={answers[q.id] ?? getAnswer(q.id) ?? ""}
                      onChange={(value) => setAnswer(q.id, value)}
                      photoUrl={photoUrls[q.id]}
                      onPhotoChange={(url) => setPhotoUrl(q.id, url)}
                      userId={userId || undefined}
                    />
                  ))}
                </div>

                {/* Navigation */}
                <QuestionNavigation
                  windowStart={windowStart}
                  totalQuestions={ALL_QUESTIONS.length}
                  onPrevious={prevThree}
                  onNext={nextThree}
                />

                {/* Save Button */}
                <div className="mt-6 text-center">
                  <button
                    onClick={saveAll}
                    disabled={saving}
                    className="rounded-full bg-cyan-500 px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    type="button"
                  >
                    {saving ? 'Saving...' : 'Save Answers'}
                  </button>
                </div>

                {/* Completion Time */}
                {completionTime && (
                  <div className="mt-4 text-center">
                    <div className="text-sm text-white/70">
                      Completed in {completionTime} seconds
                    </div>
                  </div>
                )}

                {/* Historical Data */}
                {showHistory && (
                  <div className="mt-8 space-y-6">
                    <CompletionChart sessions={sessions} />
                    <RecentAnswersTable 
                      recentAnswers={recentAnswers} 
                      onDeleteDailyChecks={deleteDailyChecks}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </AuthenticationGuard>
  );
}