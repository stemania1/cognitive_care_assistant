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
  const [questionnaireSaved, setQuestionnaireSaved] = useState(false);
  const [questionnaireStarted, setQuestionnaireStarted] = useState(false);
  const [currentlyFocusedQuestion, setCurrentlyFocusedQuestion] = useState<string | null>(null);
  const [savedQuestions, setSavedQuestions] = useState<Set<string>>(new Set());
  const [forceFreshStart, setForceFreshStart] = useState(false);
  const [autoNavigating, setAutoNavigating] = useState(false);
  const [hasAutoNavigated, setHasAutoNavigated] = useState(false);
  const [showPriorResponses, setShowPriorResponses] = useState(false);
  
  const { saveDailyCheck, getAnswer, hasAnswer, clearChecks, loading: dbLoading } = useDailyChecks(userId);
  const { windowStart, todaysQuestions, nextThree, prevThree, resetToStart, navigateToPage } = useQuestionNavigation(today);
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

  // Reset auto-navigation flag when page changes
  useEffect(() => {
    setHasAutoNavigated(false);
  }, [windowStart]);

  function setAnswer(id: string, value: string) {
    if (!startedAt) setStartedAt(Date.now());
    setAnswers((prev) => ({ ...prev, [id]: value }));
    
    // If user starts editing a saved answer, remove it from savedQuestions
    if (savedQuestions.has(id)) {
      setSavedQuestions(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
    
    // Turn off force fresh start when user starts typing
    if (forceFreshStart && value.trim()) {
      setForceFreshStart(false);
    }
  }

  function setPhotoUrl(id: string, url: string) {
    setPhotoUrls((prev) => ({ ...prev, [id]: url }));
  }

  function checkAndAutoNavigate() {
    // Prevent multiple auto-navigations
    if (hasAutoNavigated || autoNavigating) {
      return;
    }

    // Check if all questions on current page have answers
    const allQuestionsAnswered = todaysQuestions.every(q => {
      const hasLocalAnswer = answers[q.id] && answers[q.id].trim();
      const hasSavedAnswer = getAnswer(q.id) && getAnswer(q.id).trim();
      return hasLocalAnswer || hasSavedAnswer;
    });

    if (allQuestionsAnswered) {
      // Check if there's a next page available
      const nextWindowStart = windowStart + todaysQuestions.length;
      console.log('Auto-navigation check:', {
        windowStart,
        todaysQuestionsLength: todaysQuestions.length,
        nextWindowStart,
        allQuestionsLength: ALL_QUESTIONS.length,
        allQuestionsAnswered
      });
      
      if (nextWindowStart < ALL_QUESTIONS.length) {
        // Mark that we're about to auto-navigate
        setHasAutoNavigated(true);
        setAutoNavigating(true);
        
        // Auto-navigate to next page after a short delay
        setTimeout(() => {
          console.log('Auto-navigating from', windowStart, 'to next page');
          // Use direct navigation instead of nextThree() to ensure exact positioning
          const targetWindowStart = windowStart + todaysQuestions.length;
          console.log('Target window start:', targetWindowStart);
          navigateToPage(targetWindowStart);
          setAutoNavigating(false);
        }, 1500); // 1.5 second delay to show the completion
      }
    }
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
      
      // Mark question as saved for visual feedback
      setSavedQuestions(prev => new Set(prev).add(questionId));
      
      // Check if all questions on current page are answered and auto-navigate
      checkAndAutoNavigate();
      
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
      // Save only unsaved answered questions (those not already saved via "Save Answer")
      let savedCount = 0;
      for (const q of todaysQuestions) {
        const value = (answers[q.id] ?? getAnswer(q.id) ?? "").toString().trim();
        if (!value) continue;
        
        // Check if this answer was already saved individually
        const existingAnswer = getAnswer(q.id);
        if (!existingAnswer || existingAnswer.trim() === "") {
          // This answer hasn't been saved yet, save it now
          const photoUrl = photoUrls[q.id];
          await saveDailyCheck({
            questionId: q.id,
            questionText: q.text,
            answer: value,
            answerType: q.choices ? 'choice' : 'text',
            date: today,
            photoUrl: photoUrl || undefined,
          });
          savedCount++;
        }
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

      // Mark questionnaire as saved and load saved answers as read-only
      setQuestionnaireSaved(true);
      setAnswers({}); // Clear local answers so UI shows empty fields
      setPhotoUrls({}); // Clear local photo URLs
      setStartedAt(null);
      setCompletionTime(null);
      
      // Refresh recent answers data
      await loadRecentAnswers();
      
      // Calculate completion statistics
      const answeredQuestions = todaysQuestions.filter(q => {
        const value = (answers[q.id] ?? getAnswer(q.id) ?? "").toString().trim();
        return value.length > 0;
      }).length;
      
      const completionTimeText = startedAt ? 
        `Completed in ${Math.round((Date.now() - startedAt) / 1000)} seconds` : 
        'Completion time not available';
      
      alert(`Questionnaire Saved!\n\n📊 Questions Answered: ${answeredQuestions} of ${todaysQuestions.length}\n💾 New Answers Saved: ${savedCount}\n⏱️ ${completionTimeText}\n\nRedirecting to home page...`);
      
      // Reset questionnaire state before redirecting
      resetQuestionnaireState();
      
      // Redirect to home page after a short delay
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 2000);
    } catch (error) {
      console.error('Error saving questionnaire:', error);
      alert('Failed to save questionnaire. Please try again.');
    }
  }

  async function startDailyQuestionnaire() {
    setQuestionnaireStarted(true);
    setStartedAt(Date.now());
    setQuestionnaireSaved(false);
    setForceFreshStart(true);
    
    // Reset to start from question 1
    resetToStart();
    
    // Clear any existing saved answers for today to ensure fresh start
    await deleteDailyChecks(today);
    clearChecks(); // Also clear local state
  }

  async function startNewQuestionnaire() {
    // Reset questionnaire state
    resetQuestionnaireState();
    
    // Reset to start from question 1
    resetToStart();
    
    // Clear stored answers from database/localStorage
    await deleteDailyChecks(today);
    clearChecks(); // Also clear local state
    
    // Refresh the data to ensure UI updates
    await loadRecentAnswers();
  }

  // Handle focus changes for auto-save
  const handleQuestionFocus = async (questionId: string) => {
    // If there was a previously focused question with an answer, save it
    if (currentlyFocusedQuestion && currentlyFocusedQuestion !== questionId) {
      const previousAnswer = answers[currentlyFocusedQuestion];
      if (previousAnswer && previousAnswer.trim()) {
        await saveIndividualAnswer(currentlyFocusedQuestion);
      }
    }
    setCurrentlyFocusedQuestion(questionId);
  };

  const handleQuestionBlur = async (questionId: string) => {
    // Save the current question when it loses focus
    const currentAnswer = answers[questionId];
    if (currentAnswer && currentAnswer.trim()) {
      await saveIndividualAnswer(questionId);
    }
  };

  const handleBackToHome = () => {
    // Check if questionnaire has been started and has unsaved answers
    if (questionnaireStarted && !questionnaireSaved) {
      const hasAnswers = todaysQuestions.some(q => {
        const answer = answers[q.id] ?? getAnswer(q.id) ?? "";
        return answer.trim().length > 0;
      });

      if (hasAnswers) {
        const confirmed = window.confirm(
          "⚠️ Warning: You have unsaved answers!\n\n" +
          "Going back to home will discard your current answers.\n\n" +
          "Are you sure you want to go back?"
        );
        
        if (!confirmed) {
          return; // User cancelled, stay on page
        }
      }
    }
    
    // Reset questionnaire state before leaving
    resetQuestionnaireState();
    
    // Navigate to dashboard
    window.location.href = '/dashboard';
  };

  const resetQuestionnaireState = () => {
    // Reset all questionnaire state to initial values
    setQuestionnaireStarted(false);
    setQuestionnaireSaved(false);
    setAnswers({});
    setPhotoUrls({});
    setStartedAt(null);
    setCompletionTime(null);
    setSavedQuestions(new Set());
    setCurrentlyFocusedQuestion(null);
    setShowHistory(false);
    setForceFreshStart(false);
    setAutoNavigating(false);
    setHasAutoNavigated(false);
    setShowPriorResponses(false);
  };

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
                <button
                  onClick={() => setShowPriorResponses(!showPriorResponses)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    showPriorResponses 
                      ? 'bg-purple-500 text-white hover:bg-purple-600' 
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                  type="button"
                >
                  Show Prior Responses
                </button>
                <button
                  onClick={handleBackToHome}
                  className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20"
                  type="button"
                >
                  Back to Home
                </button>
              </div>
            </div>

            {/* Auto-Navigation Indicator */}
            {autoNavigating && (
              <div className="mb-4 rounded-lg bg-green-500/20 border border-green-400/30 p-4 text-center">
                <div className="flex items-center justify-center gap-2 text-green-300">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-green-300 border-t-transparent"></div>
                  <span className="font-medium">All questions completed! Moving to next page...</span>
                </div>
              </div>
            )}

            {/* Start Questionnaire Section */}
            {!questionnaireStarted && !questionnaireSaved && (
              <div className="mb-6 text-center">
                <div className="rounded-lg border border-white/10 bg-white/5 p-6">
                  <h2 className="text-xl font-semibold mb-4">Ready to Start Your Daily Questions?</h2>
                  <p className="text-white/70 mb-6">
                    Answer questions about your day, mood, and experiences. Take your time and be honest with your responses.
                  </p>
                  <button
                    onClick={() => startDailyQuestionnaire()}
                    className="px-8 py-3 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-3 mx-auto"
                    type="button"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-lg">Start Daily Questionnaire</span>
                  </button>
                </div>
              </div>
            )}


            {!questionnaireStarted ? (
              <div className="text-center py-8">
                <div className="text-white/60">Click "Start Daily Questionnaire" above to begin</div>
              </div>
            ) : dbLoading ? (
              <div className="text-center py-8">
                <div className="text-white/60">Loading...</div>
              </div>
            ) : (
              <>
                {/* Save Questionnaire Tile */}
                <div className="mb-6">
                  {questionnaireSaved ? (
                    <div className="flex gap-3">
                      <button
                        onClick={startNewQuestionnaire}
                        className="flex-1 py-4 px-6 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
                        type="button"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span className="text-lg">Start New Questionnaire</span>
                      </button>
                      <button
                        onClick={() => deleteDailyChecks(today)}
                        className="px-6 py-4 rounded-lg bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
                        type="button"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span className="text-lg">Delete</span>
                      </button>
                    </div>
                  ) : (
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
                  )}
                </div>

                {/* Historical Data - Show below Save Questionnaire when displayed */}
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

                {/* Prior Responses Section */}
                {showPriorResponses && (
                  <div className="mb-6 space-y-6">
                    <div className="rounded-lg border border-purple-500/30 bg-purple-500/10 p-6">
                      <h2 className="text-xl font-semibold text-purple-300 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Prior Questionnaire Responses
                      </h2>
                      
                      {sessions.length === 0 ? (
                        <div className="text-center py-8">
                          <div className="text-purple-300/70 mb-2">
                            <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <p className="text-purple-300/70 text-lg font-medium">No Prior Responses</p>
                          <p className="text-purple-300/50 text-sm mt-2">Complete and save a questionnaire to see your responses here.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {sessions.map((session, index) => (
                            <div key={session.id} className="rounded-lg border border-purple-400/20 bg-purple-500/5 p-4">
                              <div className="flex items-center justify-between mb-3">
                                <h3 className="text-lg font-medium text-purple-200">
                                  Questionnaire #{sessions.length - index}
                                </h3>
                                <div className="text-sm text-purple-300/70">
                                  {new Date(session.date).toLocaleDateString()} at {new Date(session.created_at).toLocaleTimeString()}
                                </div>
                              </div>
                              
                              <div className="grid gap-3">
                                {session.answers.map((answer, answerIndex) => {
                                  const question = ALL_QUESTIONS.find(q => q.id === answer.question_id);
                                  return (
                                    <div key={answerIndex} className="flex flex-col sm:flex-row sm:items-start gap-2 p-3 rounded-md bg-purple-500/10 border border-purple-400/10">
                                      <div className="sm:w-1/3">
                                        <div className="text-sm font-medium text-purple-300">
                                          Q{ALL_QUESTIONS.findIndex(q => q.id === answer.question_id) + 1}
                                        </div>
                                        <div className="text-xs text-purple-300/70 mt-1">
                                          {question?.text || 'Unknown Question'}
                                        </div>
                                      </div>
                                      <div className="sm:w-2/3">
                                        <div className="text-sm text-white/90 bg-white/5 rounded p-2">
                                          {answer.answer}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Navigation */}
                <div className="mb-6">
                  <QuestionNavigation
                    windowStart={windowStart}
                    totalQuestions={ALL_QUESTIONS.length}
                    questionsPerPage={todaysQuestions.length}
                    onPrevious={prevThree}
                    onNext={nextThree}
                  />
                </div>

                {/* Questions */}
                <div className="space-y-4 mb-6">
                {todaysQuestions.map((q, index) => (
                  <QuestionCard
                    key={q.id}
                    question={q}
                    value={forceFreshStart ? "" : (answers[q.id] ?? (questionnaireStarted ? getAnswer(q.id) : ""))}
                    onChange={(value) => setAnswer(q.id, value)}
                    photoUrl={photoUrls[q.id]}
                    onPhotoChange={(url) => setPhotoUrl(q.id, url)}
                    userId={userId || undefined}
                    questionNumber={windowStart + index + 1}
                    onSave={saveIndividualAnswer}
                    readOnly={questionnaireSaved}
                    onFocus={handleQuestionFocus}
                    onBlur={handleQuestionBlur}
                    isSaved={savedQuestions.has(q.id)}
                  />
                ))}
                </div>

                {/* Completion Time */}
                {completionTime && !showHistory && (
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