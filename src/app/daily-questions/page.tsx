"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useDailyChecks } from "@/lib/useDailyChecks";
import { supabase } from "@/lib/supabaseClient";

type Question = { id: string; text: string; choices?: string[] };
type StoredAnswer = string | { v: string; t: string };

function getTodayKey(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

const ALL_QUESTIONS: Question[] = [
  { id: "favoriteColor", text: "What is your favorite color?" },
  { id: "favoriteMeal", text: "What’s your favorite meal of the day — breakfast, lunch, or dinner?", choices: ["Breakfast", "Lunch", "Dinner"] },
  { id: "catsDogs", text: "Do you like cats, dogs, or both?", choices: ["Cats", "Dogs", "Both"] },
  { id: "favoriteSeat", text: "What’s your favorite place to sit at home?" },
  { id: "favoriteAsChild", text: "What was your favorite thing to do when you were younger?" },
  { id: "firstJob", text: "What was your first job or something you enjoyed doing?" },
  { id: "drinkPref", text: "What do you like to drink — tea, coffee, or something else?", choices: ["Tea", "Coffee", "Something else"] },
  { id: "smile", text: "What makes you smile?" },
  { id: "weather", text: "What kind of weather do you enjoy?" },
  { id: "calm", text: "What helps you feel calm?" },
  { id: "children", text: "Do you have any children?" },
  { id: "grandchildren", text: "Do you have any grandchildren?" },
  { id: "parentsNames", text: "What were your parents’ names?" },
  { id: "siblings", text: "Do you have any brothers or sisters?" },
  { id: "fullName", text: "What is your full name?" },
  { id: "birthday", text: "When is your birthday (or do you remember what time of year it is)?" },
  { id: "married", text: "Were you married?" },
  { id: "born", text: "Where were you born or where did you grow up?" },
];

export default function DailyQuestionsPage() {
  const today = useMemo(() => getTodayKey(), []);
  const windowKey = useMemo(() => `dailyQuestionsWindow:${today}`, [today]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [windowStart, setWindowStart] = useState<number>(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [sessions, setSessions] = useState<Array<{ id: string; created_at: string; duration_ms: number; set_start_index: number }>>([]);
  const [recentAnswers, setRecentAnswers] = useState<Array<{ date: string; answers: Array<{ question: string; answer: string }> }>>([]);
  const [completionTime, setCompletionTime] = useState<number | null>(null);
  
  const { saveDailyCheck, getAnswer, hasAnswer, loading: dbLoading } = useDailyChecks(userId);

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
  }, []);

  // Load historical sessions
  const loadSessions = async () => {
    if (!userId) return;
    try {
      const params = new URLSearchParams({ userId, limit: '10' });
      const res = await fetch(`/api/daily-check-sessions?${params}`);
      const json = await res.json();
      if (res.ok) {
        setSessions(json.data || []);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  // Delete a session
  const deleteSession = async (sessionId: string) => {
    if (!userId) return;
    try {
      const res = await fetch('/api/daily-check-sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, sessionId })
      });
      if (res.ok) {
        await loadSessions(); // Reload sessions after deletion
      }
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  // Load recent answers
  const loadRecentAnswers = async () => {
    if (!userId) return;
    try {
      const params = new URLSearchParams({ userId });
      const res = await fetch(`/api/daily-checks?${params}`);
      const json = await res.json();
      if (res.ok) {
        const answers = json.data || [];
        // Group by date
        const grouped = answers.reduce((acc: any, check: any) => {
          const date = check.date;
          if (!acc[date]) {
            acc[date] = { date, created_at: check.created_at, answers: [] };
          }
          acc[date].answers.push({
            question: check.question_text,
            answer: check.answer
          });
          return acc;
        }, {});
        
        // Convert to array and sort by date (newest first)
        const sortedAnswers = Object.values(grouped).sort((a: any, b: any) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        
        setRecentAnswers(sortedAnswers.slice(0, 5)); // Show last 5 days
      }
    } catch (error) {
      console.error('Error loading answers:', error);
    }
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem(windowKey);
      if (raw != null) {
        const parsed = Number(raw);
        if (!Number.isNaN(parsed)) {
          setWindowStart(parsed % ALL_QUESTIONS.length);
          return;
        }
      }
      const base = Math.floor(Date.now() / 86400000);
      const start = base % ALL_QUESTIONS.length;
      setWindowStart(start);
      localStorage.setItem(windowKey, String(start));
    } catch {}
  }, [windowKey]);

  const todaysQuestions = useMemo(() => {
    return [0, 1, 2].map((i) => ALL_QUESTIONS[(windowStart + i) % ALL_QUESTIONS.length]);
  }, [windowStart]);

  // Start with empty answers when questions change
  useEffect(() => {
    if (todaysQuestions.length > 0) {
      setAnswers({});
      setCompletionTime(null); // Reset completion time for new questions
      setShowHistory(false); // Hide history for new questions
    }
  }, [todaysQuestions]);

  async function saveOne(id: string, value: string) {
    if (!userId) return;
    
    try {
      const question = ALL_QUESTIONS.find(q => q.id === id);
      if (!question) return;

      await saveDailyCheck({
        questionId: id,
        questionText: question.text,
        answer: value,
        answerType: question.choices ? 'choice' : 'text',
        date: today
      });
      
      setSaved(true);
      window.setTimeout(() => setSaved(false), 800);
    } catch (error) {
      console.error('Error saving answer:', error);
    }
  }

  function setAnswer(id: string, value: string) {
    if (!startedAt) setStartedAt(Date.now());
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  async function saveAll() {
    if (!userId) return;
    try {
      setSaving(true);
      for (const q of todaysQuestions) {
        const value = (answers[q.id] ?? getAnswer(q.id) ?? "").toString().trim();
        if (!value) continue;
        await saveDailyCheck({
          questionId: q.id,
          questionText: q.text,
          answer: value,
          answerType: q.choices ? 'choice' : 'text',
          date: today,
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
        } catch {}
        setStartedAt(null);
      }
      setSaved(true);
      setShowHistory(true);
      await Promise.all([loadSessions(), loadRecentAnswers()]); // Load updated data
      window.setTimeout(() => setSaved(false), 800);
    } catch (error) {
      console.error('Error saving answers:', error);
    } finally {
      setSaving(false);
    }
  }

  const answeredCount = todaysQuestions.reduce((n, q) => (answers[q.id] ? n + 1 : n), 0);

  function nextThree() {
    setWindowStart((prev) => {
      const next = (prev + 3) % ALL_QUESTIONS.length;
      try {
        localStorage.setItem(windowKey, String(next));
      } catch {}
      return next;
    });
  }

  function prevThree() {
    setWindowStart((prev) => {
      const next = (prev - 3 + ALL_QUESTIONS.length) % ALL_QUESTIONS.length;
      try {
        localStorage.setItem(windowKey, String(next));
      } catch {}
      return next;
    });
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-black via-[#0b0520] to-[#0b1a3a] text-white">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(1200px_600px_at_50%_-200px,rgba(168,85,247,0.25),transparent),radial-gradient(900px_500px_at_80%_120%,rgba(34,211,238,0.18),transparent),radial-gradient(800px_400px_at_10%_120%,rgba(59,130,246,0.12),transparent)]" />
      <div className="pointer-events-none absolute -top-24 right-1/2 h-[420px] w-[420px] translate-x-1/2 rounded-full bg-gradient-to-r from-fuchsia-500/25 via-purple-500/20 to-cyan-500/25 blur-3xl -z-10" />

      <main className="relative p-8 sm:p-16">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex flex-col">
              <h1 className="text-2xl sm:text-3xl font-semibold">Daily Questions</h1>
              <span className="text-xs opacity-70">Set label: Questions {((windowStart % ALL_QUESTIONS.length) + 1)}–{(((windowStart + 2) % ALL_QUESTIONS.length) + 1)} of {ALL_QUESTIONS.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={prevThree}
                className="text-sm rounded-md border border-white/15 bg-white/10 px-3 py-1 hover:bg-white/15"
                aria-label="Show previous three questions"
              >
                Prev 3
              </button>
              <button
                type="button"
                onClick={nextThree}
                className="text-sm rounded-md border border-white/15 bg-white/10 px-3 py-1 hover:bg-white/15"
                aria-label="Show next three questions"
              >
                Next 3
              </button>
              {saved ? (
                <span className="text-xs text-emerald-300">Saved</span>
              ) : dbLoading ? (
                <span className="text-xs opacity-60">Loading...</span>
              ) : (
                <span className="text-xs opacity-60">{answeredCount}/3 answered</span>
              )}
            </div>
          </div>


          <div className="flex flex-col gap-3">
            {todaysQuestions.map((q) => (
              <div key={q.id} className="rounded-lg border border-white/10 bg-white/5 p-3">
                <p className="text-sm mb-2">{q.text}</p>
                {q.choices ? (
                  <div className="flex gap-2 flex-wrap">
                    {q.choices.map((choice) => (
                      <button
                        key={choice}
                        onClick={() => setAnswer(q.id, choice)}
                        className={`px-3 py-1 rounded-full text-xs transition-colors ${
                          answers[q.id] === choice ? "bg-emerald-500 text-black" : "bg-white/10 hover:bg-white/15"
                        }`}
                        type="button"
                      >
                        {choice}
                      </button>
                    ))}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={answers[q.id] ?? ""}
                    onChange={(e) => setAnswer(q.id, e.target.value)}
                    placeholder="Type your answer"
                    className="w-full rounded-md border border-white/10 bg-white/10 px-3 py-2 text-sm outline-none placeholder-white/40"
                  />
                )}
              </div>
            ))}

            {/* Save Button */}
            <div className="mt-6 flex flex-col items-center gap-4">
              <button
                type="button"
                onClick={saveAll}
                disabled={saving || !userId || answeredCount === 0}
                className="w-full max-w-md py-4 px-6 rounded-xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-cyan-500 text-white font-semibold text-lg hover:from-purple-600 hover:via-fuchsia-600 hover:to-cyan-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:ring-offset-2 focus:ring-offset-black transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                aria-label="Save today's answers"
              >
                {saving ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving...</span>
                  </div>
                ) : (
                  `Save Answers (${answeredCount}/3)`
                )}
              </button>
              
            {/* Show completion time only after saving */}
            {completionTime !== null && (
              <div className="text-center text-cyan-300 text-lg font-medium mb-4">
                Completed in {completionTime} seconds
              </div>
            )}

            <div className="flex items-center justify-center gap-4">
              <button
                onClick={async () => {
                  setShowHistory(true);
                  await Promise.all([loadSessions(), loadRecentAnswers()]);
                }}
                className="px-4 py-2 rounded-lg border border-white/15 bg-white/10 text-sm hover:bg-white/15 transition-colors"
              >
                Show Progress
              </button>
              <Link
                href="/questions/history"
                className="px-4 py-2 rounded-lg border border-white/15 bg-white/10 text-sm hover:bg-white/15 transition-colors"
              >
                View saved answers
              </Link>
            </div>
            </div>

            {/* Historical Data - shown after saving or when button is clicked */}
            {showHistory && (
              <div className="mt-8 space-y-6">
                <h2 className="text-xl font-semibold text-center">Your Progress</h2>
                
                {sessions.length === 0 && recentAnswers.length === 0 ? (
                  <div className="text-center text-white/60 py-8">
                    <p>No progress data available yet.</p>
                    <p className="text-sm mt-2">Complete some questions and save to see your progress here.</p>
                  </div>
                ) : (
                  <>
                
                {/* Historical Chart */}
                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                  <h3 className="text-lg font-medium mb-4">Completion Times (Line Chart)</h3>
                  <div className="h-72 relative">
                    <svg className="w-full h-full" viewBox="0 0 400 220">
                      {sessions.length > 0 ? (() => {
                        const data = sessions.slice(0, 10).reverse(); // Show oldest to newest
                        const maxSeconds = Math.max(...data.map(s => s.duration_ms / 1000), 1);
                        const minSeconds = Math.min(...data.map(s => s.duration_ms / 1000), 0);
                        const range = maxSeconds - minSeconds || 1;
                        const padding = 20;
                        const chartWidth = 360;
                        const chartHeight = 160;
                        
                        // Create line path
                        const points = data.map((session, idx) => {
                          const x = padding + (data.length > 1 ? (idx / (data.length - 1)) * chartWidth : chartWidth / 2);
                          const y = padding + chartHeight - ((session.duration_ms / 1000 - minSeconds) / range) * chartHeight;
                          return `${x},${y}`;
                        }).join(' L');
                        
                        // Create dots
                        const dots = data.map((session, idx) => {
                          const x = padding + (data.length > 1 ? (idx / (data.length - 1)) * chartWidth : chartWidth / 2);
                          const y = padding + chartHeight - ((session.duration_ms / 1000 - minSeconds) / range) * chartHeight;
                          return { x, y, seconds: Math.round(session.duration_ms / 1000), id: session.id };
                        });
                        
                        return (
                          <>
                            {/* Grid lines */}
                            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
                              <g key={i}>
                                <line
                                  x1={padding}
                                  y1={padding + chartHeight * ratio}
                                  x2={padding + chartWidth}
                                  y2={padding + chartHeight * ratio}
                                  stroke="rgba(255,255,255,0.1)"
                                  strokeWidth="1"
                                />
                                <text
                                  x={5}
                                  y={padding + chartHeight * ratio + 4}
                                  fontSize="10"
                                  fill="rgba(255,255,255,0.6)"
                                >
                                  {Math.round(maxSeconds - range * ratio)}s
                                </text>
                              </g>
                            ))}
                            
                            {/* Line */}
                            <path
                              d={`M ${points}`}
                              fill="none"
                              stroke="url(#gradient)"
                              strokeWidth="2"
                            />
                            
                            {/* Gradient definition */}
                            <defs>
                              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#06b6d4" />
                                <stop offset="100%" stopColor="#8b5cf6" />
                              </linearGradient>
                            </defs>
                            
                            {/* Dots */}
                            {dots.map((dot, idx) => (
                              <g key={idx}>
                                {/* Main data point circle */}
                                <circle
                                  cx={dot.x}
                                  cy={dot.y}
                                  r="6"
                                  fill="#06b6d4"
                                  stroke="white"
                                  strokeWidth="2"
                                />
                                {/* Inner highlight */}
                                <circle
                                  cx={dot.x}
                                  cy={dot.y}
                                  r="3"
                                  fill="white"
                                  opacity="0.3"
                                />
                                {/* Time label */}
                                <text
                                  x={dot.x}
                                  y={dot.y - 12}
                                  fontSize="11"
                                  fill="white"
                                  textAnchor="middle"
                                  fontWeight="bold"
                                >
                                  {dot.seconds}s
                                </text>
                              </g>
                            ))}
                            
                            {/* X-axis labels */}
                            {data.map((session, idx) => {
                              const x = padding + (data.length > 1 ? (idx / (data.length - 1)) * chartWidth : chartWidth / 2);
                              // Use the local date from the session for the date display
                              const sessionDate = new Date(session.date + 'T00:00:00');
                              // Use created_at for the time display (this is the actual completion time)
                              const createdDate = new Date(session.created_at);
                              return (
                                <g key={idx}>
                                  <text
                                    x={x}
                                    y={padding + chartHeight + 15}
                                    fontSize="9"
                                    fill="rgba(255,255,255,0.6)"
                                    textAnchor="middle"
                                  >
                                    {sessionDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                  </text>
                                  <text
                                    x={x}
                                    y={padding + chartHeight + 28}
                                    fontSize="8"
                                    fill="rgba(255,255,255,0.5)"
                                    textAnchor="middle"
                                  >
                                    {createdDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                  </text>
                                </g>
                              );
                            })}
                          </>
                        );
                      })() : (
                        <text
                          x="200"
                          y="110"
                          fontSize="14"
                          fill="rgba(255,255,255,0.6)"
                          textAnchor="middle"
                        >
                          No completion data available yet
                        </text>
                      )}
                    </svg>
                  </div>
                </div>

                {/* Historical Table */}
                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                  <h3 className="text-lg font-medium mb-4">Recent Answers</h3>
                  {recentAnswers.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-white/10">
                            <th className="text-left py-2 px-3 font-medium text-cyan-300">Date/Time</th>
                            {recentAnswers[0]?.answers.map((qa, idx) => (
                              <th key={idx} className="text-left py-2 px-3 font-medium text-cyan-300 max-w-48">
                                <div className="truncate" title={qa.question}>
                                  {qa.question}
                                </div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {recentAnswers.map((dayData, dayIdx) => (
                            <tr key={dayIdx} className="border-b border-white/5 hover:bg-white/5">
                              <td className="py-3 px-3 text-white/90 font-medium">
                                <div className="text-xs">
                                  {new Date(dayData.date).toLocaleDateString(undefined, { 
                                    month: 'short', 
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </div>
                                <div className="text-xs text-white/60">
                                  {dayData.created_at ? 
                                    new Date(dayData.created_at).toLocaleTimeString(undefined, { 
                                      hour: '2-digit', 
                                      minute: '2-digit' 
                                    }) : 
                                    'N/A'
                                  }
                                </div>
                              </td>
                              {dayData.answers.map((qa, qaIdx) => (
                                <td key={qaIdx} className="py-3 px-3 text-white/70 max-w-48">
                                  <div className="truncate" title={qa.answer}>
                                    {qa.answer}
                                  </div>
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center text-white/60 py-4">
                      No answers saved yet. Complete some questions and save to see your history here.
                    </div>
                  )}
                </div>

                <div className="text-center">
                  <button
                    onClick={() => setShowHistory(false)}
                    className="px-4 py-2 rounded-lg border border-white/15 bg-white/10 text-sm hover:bg-white/15 transition-colors"
                  >
                    Hide History
                  </button>
                </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <Link href="/dashboard" className="fixed bottom-6 left-6 sm:bottom-8 sm:left-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 hover:bg-white/15 transition">
        <span className="text-sm">← Back to Home</span>
      </Link>
    </div>
  );
}




