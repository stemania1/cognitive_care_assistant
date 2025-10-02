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
  
  const { saveDailyCheck, getAnswer, hasAnswer, loading: dbLoading } = useDailyChecks(userId);

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
  }, []);

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

  // Load answers from database when questions change
  useEffect(() => {
    if (todaysQuestions.length > 0) {
      const initialAnswers: Record<string, string> = {};
      todaysQuestions.forEach(q => {
        const answer = getAnswer(q.id);
        if (answer) {
          initialAnswers[q.id] = answer;
        }
      });
      setAnswers(initialAnswers);
    }
  }, [todaysQuestions, getAnswer]);

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
    setAnswers((prev) => ({ ...prev, [id]: value }));
    saveOne(id, value);
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
      setSaved(true);
      window.setTimeout(() => setSaved(false), 800);
    } catch (error) {
      console.error('Error saving answers:', error);
    } finally {
      setSaving(false);
    }
  }

  const answeredCount = todaysQuestions.reduce((n, q) => (hasAnswer(q.id) ? n + 1 : n), 0);

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
            <h1 className="text-2xl sm:text-3xl font-semibold">Daily Questions</h1>
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
              <button
                type="button"
                onClick={saveAll}
                disabled={saving || !userId}
                className="text-sm rounded-md border border-white/15 bg-white/10 px-3 py-1 hover:bg-white/15 disabled:opacity-50"
                aria-label="Save today's answers"
              >
                {saving ? 'Saving…' : 'Save'}
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
                          (answers[q.id] === choice || getAnswer(q.id) === choice) ? "bg-emerald-500 text-black" : "bg-white/10 hover:bg-white/15"
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
                    value={answers[q.id] ?? getAnswer(q.id) ?? ""}
                    onChange={(e) => setAnswer(q.id, e.target.value)}
                    placeholder="Type your answer"
                    className="w-full rounded-md border border-white/10 bg-white/10 px-3 py-2 text-sm outline-none placeholder-white/40"
                  />
                )}
              </div>
            ))}

            <div className="flex items-center justify-end">
              <Link
                href="/questions/history"
                className="mt-1 px-3 py-1 rounded-md border border-white/15 bg-white/10 text-xs hover:bg-white/15"
              >
                View saved answers
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Link href="/dashboard" className="fixed bottom-6 left-6 sm:bottom-8 sm:left-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 hover:bg-white/15 transition">
        <span className="text-sm">← Back to Home</span>
      </Link>
    </div>
  );
}


