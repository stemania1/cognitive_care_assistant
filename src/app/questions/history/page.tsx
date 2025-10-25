"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useHistoricalData } from "@/hooks/useHistoricalData";
import { isGuestUser, getGuestUserId } from "@/lib/guestDataManager";
import { supabase } from "@/lib/supabaseClient";
import { ALL_QUESTIONS } from "@/constants/questions";
import { DailyCheckSession, RecentAnswer } from "@/types/daily-questions";

export default function QuestionsHistoryPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const { sessions, recentAnswers, loadSessions, loadRecentAnswers, deleteSession, deleteDailyChecks } = useHistoricalData(userId);

  useEffect(() => {
    async function initializeUser() {
      try {
        const guestStatus = await isGuestUser();
        setIsGuest(guestStatus);
        
        if (guestStatus) {
          const guestUserId = getGuestUserId();
          setUserId(guestUserId);
        } else {
          // For regular users, get the actual user ID from Supabase
          const { data: { user } } = await supabase.auth.getUser();
          if (user?.id) {
            setUserId(user.id);
          } else {
            console.error('No user ID found for regular user');
            setUserId(null);
          }
        }
      } catch (error) {
        console.error('Error initializing user:', error);
      } finally {
        setLoading(false);
      }
    }

    initializeUser();
  }, []);

  useEffect(() => {
    if (userId) {
      console.log('Prior Questionnaires: Loading data for userId:', userId, 'isGuest:', isGuest);
      loadSessions();
      loadRecentAnswers();
    }
  }, [userId, loadSessions, loadRecentAnswers, isGuest]);

  // Debug logging
  console.log('Prior Questionnaires Debug:', {
    userId,
    isGuest,
    sessionsCount: sessions.length,
    recentAnswersCount: recentAnswers.length,
    sessions: sessions,
    recentAnswers: recentAnswers
  });

  // Group answers by session/date for display
  const questionnaireData = recentAnswers.map(answer => {
    const session = sessions.find(s => s.date === answer.date);
    const completionTime = session?.duration_ms ? Math.round(session.duration_ms / 1000) : 0;
    
    // Create a map of question_id to answer for easy lookup
    const answersMap = new Map();
    answer.answers.forEach(a => {
      if (a.question_id) {
        answersMap.set(a.question_id, a.answer);
      }
    });

    return {
      date: answer.date,
      sessionId: session?.id, // Store the actual session ID (UUID)
      createdAt: answer.created_at || session?.created_at || '',
      completionTime,
      answers: answersMap
    };
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const formatCompletionTime = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const handleDeleteSession = async (date: string) => {
    console.log('=== DELETE SESSION DEBUG ===');
    console.log('Date to delete:', date);
    console.log('UserId:', userId);
    console.log('IsGuest:', isGuest);
    console.log('Sessions before delete:', sessions);
    console.log('RecentAnswers before delete:', recentAnswers);
    
    // Find the questionnaire data for this date
    const questionnaire = questionnaireData.find(q => q.date === date);
    const sessionId = questionnaire?.sessionId;
    
    console.log('Found questionnaire:', questionnaire);
    console.log('Session ID to delete:', sessionId);
    
    if (!sessionId) {
      console.log('No session ID found for date:', date);
      alert('No session found for this date. Cannot delete.');
      return;
    }
    
    const confirmed = window.confirm(
      `Are you sure you want to delete the questionnaire from ${date}?\n\nThis action cannot be undone.`
    );
    
    if (confirmed) {
      try {
        console.log('User confirmed deletion, proceeding...');
        
        // Delete both the session and all answers for this date
        console.log('Calling deleteSession with sessionId:', sessionId);
        await deleteSession(sessionId);
        console.log('deleteSession completed');
        
        console.log('Calling deleteDailyChecks with date:', date);
        await deleteDailyChecks(date);
        console.log('deleteDailyChecks completed');
        
        // Reload data after deletion
        console.log('Reloading sessions...');
        await loadSessions();
        console.log('Sessions reloaded');
        
        console.log('Reloading recent answers...');
        await loadRecentAnswers();
        console.log('Recent answers reloaded');
        
        console.log('Delete process completed successfully');
      } catch (error) {
        console.error('Error deleting session:', error);
        alert('Failed to delete questionnaire. Please try again.');
      }
    } else {
      console.log('User cancelled deletion');
    }
  };

  const exportToCSV = () => {
    try {
      const headers = ['Date', 'Time', 'Completion Time', ...ALL_QUESTIONS.map(q => `Q${ALL_QUESTIONS.indexOf(q) + 1}: ${q.text}`)];
      const rows = [headers];
      
      questionnaireData.forEach(questionnaire => {
        const { date, time } = formatDateTime(questionnaire.createdAt);
        const completionTime = formatCompletionTime(questionnaire.completionTime);
        
        const row = [
          date,
          time,
          completionTime,
          ...ALL_QUESTIONS.map(q => questionnaire.answers.get(q.id) || 'No answer')
        ];
        rows.push(row);
      });
      
      const csv = rows
        .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\r\n');
      
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'questionnaire_history.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Failed to export CSV. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-black via-[#0b0520] to-[#0b1a3a] text-white">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent mx-auto mb-4"></div>
            <p className="text-white/70">Loading questionnaire history...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-black via-[#0b0520] to-[#0b1a3a] text-white">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(1200px_600px_at_50%_-200px,rgba(168,85,247,0.25),transparent),radial-gradient(900px_500px_at_80%_120%,rgba(34,211,238,0.18),transparent),radial-gradient(800px_400px_at_10%_120%,rgba(59,130,246,0.12),transparent)]" />
      <div className="pointer-events-none absolute -top-24 right-1/2 h-[420px] w-[420px] translate-x-1/2 rounded-full bg-gradient-to-r from-fuchsia-500/25 via-purple-500/20 to-cyan-500/25 blur-3xl -z-10" />

      <main className="relative p-6 sm:p-12">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex flex-col">
              <h1 className="text-2xl sm:text-3xl font-semibold">Prior Questionnaires</h1>
              <p className="text-sm text-white/70 mt-1">
                View all your completed questionnaires with answers and completion times
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={exportToCSV}
                className="px-4 py-2 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-400/30 hover:bg-blue-500/30 transition-colors text-sm font-medium"
                disabled={questionnaireData.length === 0}
              >
                Export CSV
              </button>
              <Link 
                href="/daily-questions" 
                className="px-4 py-2 rounded-lg bg-white/10 text-white border border-white/15 hover:bg-white/20 transition-colors text-sm font-medium"
              >
                Back to Questions
              </Link>
            </div>
          </div>

          {/* Questionnaire Table */}
          {questionnaireData.length === 0 ? (
            <div className="text-center py-12">
              <div className="mb-6">
                <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-r from-purple-500/30 to-blue-500/30 flex items-center justify-center mb-4">
                  <svg className="w-10 h-10 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No Questionnaires Yet</h3>
              <p className="text-white/70 mb-6">
                Complete and save a questionnaire to see it here.
              </p>
              <Link 
                href="/daily-questions"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Start Questionnaire
              </Link>
            </div>
          ) : (
            <div className="rounded-lg border border-white/10 bg-white/5 overflow-hidden">
              {/* Table Header */}
              <div className="bg-white/5 border-b border-white/10 p-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Questionnaire History</h2>
                  <div className="text-sm text-white/70">
                    {questionnaireData.length} questionnaire{questionnaireData.length !== 1 ? 's' : ''} completed
                  </div>
                </div>
              </div>

              {/* Table Content */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5">
                      <th className="text-left py-3 px-4 font-medium text-cyan-300 min-w-[120px]">Date/Time</th>
                      <th className="text-left py-3 px-4 font-medium text-cyan-300 min-w-[100px]">Completion Time</th>
                      {ALL_QUESTIONS.map((question, index) => (
                        <th key={question.id} className="text-left py-3 px-4 font-medium text-cyan-300 min-w-[200px]">
                          <div className="text-xs text-white/90">
                            Q{index + 1}: {question.text}
                          </div>
                        </th>
                      ))}
                      <th className="text-center py-3 px-4 font-medium text-cyan-300 min-w-[80px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {questionnaireData.map((questionnaire, index) => {
                      const { date, time } = formatDateTime(questionnaire.createdAt);
                      return (
                        <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="py-3 px-4 text-white/90">
                            <div className="font-medium">{date}</div>
                            <div className="text-xs text-white/60">{time}</div>
                          </td>
                          <td className="py-3 px-4 text-white/90">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-300 border border-green-400/30">
                              {formatCompletionTime(questionnaire.completionTime)}
                            </span>
                          </td>
                          {ALL_QUESTIONS.map((question) => {
                            const answer = questionnaire.answers.get(question.id);
                            return (
                              <td key={question.id} className="py-3 px-4 text-white/70">
                                {answer ? (
                                  <div className="truncate max-w-[200px]" title={answer}>
                                    {answer}
                                  </div>
                                ) : (
                                  <div className="text-white/40 italic">No answer</div>
                                )}
                              </td>
                            );
                          })}
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => handleDeleteSession(questionnaire.date)}
                              className="px-3 py-1 rounded-md bg-red-600/20 text-red-400 hover:bg-red-600/30 hover:text-red-300 transition-colors text-xs font-medium"
                              title="Delete this questionnaire"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}