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
  const [showSaveWarning, setShowSaveWarning] = useState(false);
  
  const { saveDailyCheck, getAnswer, hasAnswer, loading: dbLoading } = useDailyChecks(userId);
  const { windowStart, todaysQuestions, nextThree, prevThree } = useQuestionNavigation(today);
  const { sessions, recentAnswers, loadSessions, loadRecentAnswers, deleteDailyChecks } = useHistoricalData(userId);

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        // If there's an auth error (like refresh token issues), check for guest session
        if (error) {
          console.log('Auth error, checking for guest session:', error.message);
          const guestSession = localStorage.getItem('cognitive_care_guest_session');
          if (guestSession) {
            const session = JSON.parse(guestSession);
            setUserId(session.userId);
          }
          return;
        }
        
        if (user?.id) {
          setUserId(user.id);
        } else {
          // Check for guest session in localStorage
          const guestSession = localStorage.getItem('cognitive_care_guest_session');
          if (guestSession) {
            const session = JSON.parse(guestSession);
            setUserId(session.userId);
          }
        }
      } catch (error) {
        console.error('Error getting user:', error);
        // Fall back to guest session check
        const guestSession = localStorage.getItem('cognitive_care_guest_session');
        if (guestSession) {
          const session = JSON.parse(guestSession);
          setUserId(session.userId);
        }
      }
    };
    getUser();
  }, []);

  function setAnswer(id: string, value: string) {
    if (!startedAt) setStartedAt(Date.now());
    setAnswers((prev) => ({ ...prev, [id]: value }));
    // Hide warning when user starts answering
    if (showSaveWarning) setShowSaveWarning(false);
  }

  function setPhotoUrl(id: string, url: string) {
    setPhotoUrls((prev) => ({ ...prev, [id]: url }));
  }

  async function saveAll() {
    if (!userId) {
      alert('Please sign in to save your answers.');
      return;
    }

    // Check if any questions are answered
    const hasAnyAnswers = todaysQuestions.some(q => {
      const value = (answers[q.id] ?? getAnswer(q.id) ?? "").toString().trim();
      return value.length > 0;
    });

    if (!hasAnyAnswers) {
      setShowSaveWarning(true);
      // Hide the warning after 5 seconds
      setTimeout(() => setShowSaveWarning(false), 5000);
      return;
    }

    // Hide any existing warning
    setShowSaveWarning(false);

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

        async function showProgress() {
          setShowHistory(true);
          
          try {
            await loadSessions();
            await loadRecentAnswers();
          } catch (error) {
            console.error('Error loading progress data:', error);
          }
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

            {/* Save Button - Moved to top */}
            <div className="mb-6 text-center">
              <button
                onClick={saveAll}
                disabled={saving}
                className="rounded-full bg-cyan-500 px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed"
                type="button"
              >
                {saving ? 'Saving...' : 'Save Answers'}
              </button>
            </div>

            {/* Save Warning Banner */}
            {showSaveWarning && (
              <div className="mb-6 rounded-lg border-2 border-orange-500 bg-orange-500/10 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span className="text-orange-400 font-medium">
                      ⚠️ All questions on the page need to be answered before saving
                    </span>
                  </div>
                  <button
                    onClick={() => setShowSaveWarning(false)}
                    className="text-orange-400 hover:text-orange-300 transition-colors"
                    type="button"
                    aria-label="Dismiss warning"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Navigation - Moved below Save Button */}
            <div className="mb-6">
              <QuestionNavigation
                windowStart={windowStart}
                totalQuestions={ALL_QUESTIONS.length}
                onPrevious={prevThree}
                onNext={nextThree}
              />
            </div>

            {dbLoading ? (
              <div className="text-center py-8">
                <div className="text-white/60">Loading...</div>
              </div>
            ) : (
              <>
                {/* Questions */}
                <div className="space-y-4 mb-6">
                  {todaysQuestions.map((q, index) => (
                    <QuestionCard
                      key={q.id}
                      question={q}
                      value={answers[q.id] ?? getAnswer(q.id) ?? ""}
                      onChange={(value) => setAnswer(q.id, value)}
                      photoUrl={photoUrls[q.id]}
                      onPhotoChange={(url) => setPhotoUrl(q.id, url)}
                      userId={userId || undefined}
                      questionNumber={index + 1}
                    />
                  ))}
                </div>

                {/* Completion Time */}
                {completionTime && (
                  <div className="mt-4 text-center">
                    <div className="text-sm text-white/70">
                      Completed in {completionTime} seconds
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Historical Data - Show regardless of questions state */}
            {showHistory && (
              <div className="mt-8 space-y-6">
                {(() => {
                  if (sessions.length === 0 && recentAnswers.length === 0) {
                    return (
                      <div className="rounded-lg border-2 border-blue-500 bg-blue-500/10 p-8 mb-8" style={{zIndex: 9999, position: 'relative'}}>
                          <div className="text-center">
                            <div className="mb-6">
                              <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-r from-blue-500/30 to-cyan-500/30 flex items-center justify-center mb-4">
                                <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                              </div>
                            </div>
                            <h3 className="text-2xl font-bold text-blue-400 mb-4">📊 No Data Recorded Yet</h3>
                            <p className="text-lg text-gray-300 mb-6">
                              You haven't completed any daily questions yet. Complete some questions and save your answers to start tracking your progress.
                            </p>
                            <div className="text-lg text-blue-400 bg-blue-400/10 p-4 rounded-lg border border-blue-400/20">
                              💡 <strong>Get Started:</strong> Answer the questions above and click "Save Answers" to create your first progress entry.
                            </div>
                          </div>
                        </div>
                    );
                  } else {
                    return (
                      <>
                        <CompletionChart sessions={sessions} />
                        <RecentAnswersTable 
                          recentAnswers={recentAnswers} 
                          onDeleteDailyChecks={deleteDailyChecks}
                        />
                      </>
                    );
                  }
                })()}
              </div>
            )}
          </div>
        </main>
      </div>
    </AuthenticationGuard>
  );
}