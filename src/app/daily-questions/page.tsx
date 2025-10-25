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
  }

  function setPhotoUrl(id: string, url: string) {
    setPhotoUrls((prev) => ({ ...prev, [id]: url }));
  }

  async function saveIndividualAnswer(questionId: string) {
    if (!userId) {
      alert('Please sign in to save your answers.');
      return;
    }

    const question = todaysQuestions.find(q => q.id === questionId);
    if (!question) return;

    const value = (answers[questionId] ?? getAnswer(questionId) ?? "").toString().trim();
    if (!value) {
      alert('Please enter an answer before saving.');
      return;
    }

    try {
      const photoUrl = photoUrls[questionId];
      await saveDailyCheck({
        questionId: question.id,
        questionText: question.text,
        answer: value,
        answerType: question.choices ? 'choice' : 'text',
        date: today,
        photoUrl: photoUrl || undefined,
      });
      
      // Refresh recent answers data to show the newly saved answer
      await loadRecentAnswers();
      
      // Show success feedback
      console.log(`Answer saved for question: ${question.text}`);
    } catch (error) {
      console.error('Error saving individual answer:', error);
      alert('Failed to save answer. Please try again.');
      throw error; // Re-throw so QuestionCard can handle it
    }
  }

  async function saveQuestionnaire() {
    if (!userId) {
      alert('Please sign in to save your questionnaire.');
      return;
    }

    // Check if any questions are answered
    const hasAnyAnswers = todaysQuestions.some(q => {
      const value = (answers[q.id] ?? getAnswer(q.id) ?? "").toString().trim();
      return value.length > 0;
    });

    if (!hasAnyAnswers) {
      alert('Please answer at least one question before saving the questionnaire.');
      return;
    }

    try {
      // Save all answered questions
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

      // Save session data if we have timing info
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

      // Reset all answers and state
      setAnswers({});
      setPhotoUrls({});
      setStartedAt(null);
      setCompletionTime(null);
      
      // Refresh recent answers data
      await loadRecentAnswers();
      
      alert('Questionnaire saved successfully! All answers have been reset.');
    } catch (error) {
      console.error('Error saving questionnaire:', error);
      alert('Failed to save questionnaire. Please try again.');
    }
  }


  async function showProgress() {
    setShowHistory(!showHistory);
    
    if (!showHistory) {
      try {
        await loadSessions();
        await loadRecentAnswers();
      } catch (error) {
        console.error('Error loading progress data:', error);
      }
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
                <span className="text-xs opacity-70">
                  Questions {windowStart + 1}–{windowStart + todaysQuestions.length} of {ALL_QUESTIONS.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={showProgress}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    showHistory 
                      ? 'bg-cyan-500 text-white hover:bg-cyan-600' 
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                  type="button"
                >
                  Show Answers
                </button>
                <Link href="/dashboard" className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20">
                  Back to Home
                </Link>
              </div>
            </div>

            {/* Historical Data - Show at top when displayed */}
            {showHistory && (
              <div className="mb-6 space-y-6">
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



            {/* Navigation - Moved below Save Button */}
            <div className="mb-6">
              <QuestionNavigation
                windowStart={windowStart}
                totalQuestions={ALL_QUESTIONS.length}
                questionsPerPage={todaysQuestions.length}
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
                {/* Save Questionnaire Tile */}
                <div className="mb-6">
                  <button
                    onClick={saveQuestionnaire}
                    className="w-full py-4 px-6 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
                    type="button"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span className="text-lg">Save Questionnaire</span>
                  </button>
                </div>

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
                    questionNumber={windowStart + index + 1}
                    onSave={saveIndividualAnswer}
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

          </div>
        </main>
      </div>
    </AuthenticationGuard>
  );
}