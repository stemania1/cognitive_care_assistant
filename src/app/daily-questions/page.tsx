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
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [currentlyFocusedQuestion, setCurrentlyFocusedQuestion] = useState<string | null>(null);
  const [savedQuestions, setSavedQuestions] = useState<Set<string>>(new Set());
  const [forceFreshStart, setForceFreshStart] = useState(false);
  const [autoNavigating, setAutoNavigating] = useState(false);
  const [hasAutoNavigated, setHasAutoNavigated] = useState(false);
  const [showPriorResponses, setShowPriorResponses] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionData, setCompletionData] = useState<{
    answeredQuestions: number;
    totalQuestions: number;
    savedCount: number;
    completionTime: number;
    answers: Array<{question: string, answer: string}>;
  } | null>(null);
  
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

    console.log('=== SAVING INDIVIDUAL ANSWER ===');
    console.log('questionId:', questionId);
    console.log('value:', value);
    console.log('startedAt:', startedAt);
    console.log('questionnaireStarted:', questionnaireStarted);
    console.log('currentSessionId:', currentSessionId);

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
      
      console.log('Answer saved successfully, reloading recent answers...');
      
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
      
      // Calculate completion statistics and prepare data for modal
      const answeredQuestions = todaysQuestions.filter(q => {
        const value = (answers[q.id] ?? getAnswer(q.id) ?? "").toString().trim();
        return value.length > 0;
      }).length;
      
      const completionTimeSeconds = startedAt ? Math.round((Date.now() - startedAt) / 1000) : 0;
      
      // Prepare answers data for the modal
      const answersData = todaysQuestions.map(q => {
        const value = (answers[q.id] ?? getAnswer(q.id) ?? "").toString().trim();
        return {
          question: q.text,
          answer: value || "No answer provided"
        };
      }).filter(item => item.answer !== "No answer provided");
      
      // Set completion data and show modal
      setCompletionData({
        answeredQuestions,
        totalQuestions: todaysQuestions.length,
        savedCount,
        completionTime: completionTimeSeconds,
        answers: answersData
      });
      setShowCompletionModal(true);
    } catch (error) {
      console.error('Error saving questionnaire:', error);
      alert('Failed to save questionnaire. Please try again.');
    }
  }

  async function startDailyQuestionnaire() {
    setQuestionnaireStarted(true);
    const sessionStartTime = Date.now();
    setStartedAt(sessionStartTime);
    setQuestionnaireSaved(false);
    setForceFreshStart(true);
    
    // Generate a unique session ID for this questionnaire
    const sessionId = `session_${sessionStartTime}_${Math.random().toString(36).substr(2, 9)}`;
    setCurrentSessionId(sessionId);
    
    // Reset to start from question 1
    resetToStart();
    
    // Clear any existing saved answers for today to ensure fresh start
    await deleteDailyChecks(today);
    clearChecks(); // Also clear local state
    
    console.log('Questionnaire started at:', new Date(sessionStartTime).toISOString());
    console.log('Session ID:', sessionId);
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

  const handleCloseCompletionModal = () => {
    setShowCompletionModal(false);
    setCompletionData(null);
    
    // Reset questionnaire state before redirecting
    resetQuestionnaireState();
    
    // Redirect to home page after a short delay
    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 500);
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
    setCurrentSessionId(null);
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
                  onClick={handleBackToHome}
                  className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20"
                  type="button"
                >
                  Back to Home
                </button>
              </div>
            </div>

            {/* Prior Questionnaires Tile */}
            <div className="mb-6">
              <Link
                href="/questions/history"
                className="group relative block rounded-xl border border-white/15 bg-white/5 backdrop-blur px-5 py-6 hover:bg-white/10 transition-all duration-200"
              >
                <div className="pointer-events-none absolute -inset-px rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-30 transition-opacity" />
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-base">
                      📋
                    </span>
                    <div>
                      <h3 className="text-lg font-medium">Prior Questionnaires</h3>
                      <p className="text-sm text-white/70">View your completed questionnaires and answers</p>
                    </div>
                  </div>
                  <span className="text-base opacity-60 transition-transform group-hover:translate-x-0.5">→</span>
                </div>
              </Link>
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
                      // Filter recent answers to only show current questionnaire session
                      // Show answers from today, but only if questionnaire has been started
                      console.log('=== FILTERING RECENT ANSWERS ===');
                      console.log('recentAnswers:', recentAnswers);
                      console.log('questionnaireStarted:', questionnaireStarted);
                      console.log('startedAt:', startedAt);
                      console.log('today:', today);
                      
                      const currentQuestionnaireAnswers = recentAnswers.filter(answer => {
                        console.log('Checking answer:', answer);
                        console.log('answer.date:', answer.date, 'today:', today, 'match:', answer.date === today);
                        console.log('questionnaireStarted:', questionnaireStarted);
                        
                        if (answer.date !== today) {
                          console.log('Filtered out: wrong date');
                          return false;
                        }
                        if (!questionnaireStarted) {
                          console.log('Filtered out: questionnaire not started');
                          return false; // No questionnaire started yet
                        }
                        
                        // Use a more lenient timestamp comparison
                        // Since we clear answers when starting questionnaire, any answer that exists
                        // should be from the current session, but let's add a small buffer
                        if (startedAt && answer.created_at) {
                          const answerTime = new Date(answer.created_at).getTime();
                          console.log('answer.created_at:', answer.created_at);
                          console.log('answerTime:', answerTime, 'startedAt:', startedAt);
                          
                          // Add a 5-minute buffer before startedAt to account for any timing issues
                          const bufferTime = startedAt - (5 * 60 * 1000); // 5 minutes before
                          console.log('bufferTime:', bufferTime, 'answerTime >= bufferTime:', answerTime >= bufferTime);
                          
                          if (answerTime < bufferTime) {
                            console.log('Filtered out: answer saved too long before questionnaire started');
                            return false;
                          }
                        }
                        
                        console.log('Answer included in current questionnaire');
                        return true;
                      });
                      
                      console.log('Filtered answers:', currentQuestionnaireAnswers);
                      
                      // Always show the answers table, even if no answers yet
                      return (
                        <RecentAnswersTable 
                          recentAnswers={currentQuestionnaireAnswers} 
                          onDeleteDailyChecks={deleteDailyChecks}
                        />
                      );
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

      {/* Completion Modal */}
      {showCompletionModal && completionData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Questionnaire Completed!
                </h2>
                <button
                  onClick={handleCloseCompletionModal}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-400">{completionData.answeredQuestions}</div>
                  <div className="text-sm text-blue-300">Questions Answered</div>
                  <div className="text-xs text-blue-300/70">of {completionData.totalQuestions}</div>
                </div>
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-400">{completionData.savedCount}</div>
                  <div className="text-sm text-green-300">New Answers Saved</div>
                </div>
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-400">{completionData.completionTime}</div>
                  <div className="text-sm text-purple-300">Seconds</div>
                  <div className="text-xs text-purple-300/70">Completion Time</div>
                </div>
              </div>

              {/* Answers Summary */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Your Answers
                </h3>
                <div className="space-y-3">
                  {completionData.answers.map((item, index) => (
                    <div key={index} className="bg-white/5 border border-white/10 rounded-lg p-4">
                      <div className="text-sm font-medium text-cyan-300 mb-2">
                        Question {index + 1}
                      </div>
                      <div className="text-sm text-white/90 mb-2">
                        {item.question}
                      </div>
                      <div className="text-white bg-white/10 rounded p-2 text-sm">
                        {item.answer}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Close Button */}
              <div className="flex justify-center">
                <button
                  onClick={handleCloseCompletionModal}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Return to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AuthenticationGuard>
  );
}