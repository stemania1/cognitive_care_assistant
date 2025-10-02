"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type QAItem = { date: string; entries: Array<{ q: string; a: string }> };

const QUESTIONS_INDEX: Record<string, string> = {
  favoriteColor: "What is your favorite color?",
  favoriteMeal: "What’s your favorite meal of the day — breakfast, lunch, or dinner?",
  catsDogs: "Do you like cats, dogs, or both?",
  favoriteSeat: "What’s your favorite place to sit at home?",
  favoriteAsChild: "What was your favorite thing to do when you were younger?",
  firstJob: "What was your first job or something you enjoyed doing?",
  drinkPref: "What do you like to drink — tea, coffee, or something else?",
  smile: "What makes you smile?",
  weather: "What kind of weather do you enjoy?",
  calm: "What helps you feel calm?",
  children: "Do you have any children?",
  grandchildren: "Do you have any grandchildren?",
  parentsNames: "What were your parents’ names?",
  siblings: "Do you have any brothers or sisters?",
  fullName: "What is your full name?",
  birthday: "When is your birthday (or do you remember what time of year it is)?",
  married: "Were you married?",
  born: "Where were you born or where did you grow up?",
};

export default function QuestionsHistoryPage() {
  const [items, setItems] = useState<QAItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadItems() {
    try {
      setLoading(true);
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setItems([]);
        return;
      }
      const params = new URLSearchParams({ userId: user.id });
      const res = await fetch(`/api/daily-checks?${params}`);
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to fetch");
      }
      const rows: Array<{ date: string; question_text: string; question_id: string; answer: string }> = json.data || [];
      const byDate = new Map<string, Array<{ q: string; a: string }>>();
      for (const r of rows) {
        const qText = r.question_text || QUESTIONS_INDEX[r.question_id] || r.question_id;
        const list = byDate.get(r.date) || [];
        list.push({ q: qText, a: r.answer });
        byDate.set(r.date, list);
      }
      const merged: QAItem[] = Array.from(byDate.entries()).map(([date, entries]) => ({ date, entries }));
      merged.sort((a, b) => (a.date > b.date ? -1 : a.date < b.date ? 1 : 0));
      setItems(merged);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadItems();
  }, []);

  function clearAll() {
    const ok = window.confirm("Clear all saved Daily Questions answers?");
    if (!ok) return;
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i) || "";
        if (key.startsWith("dailyQuestions:")) keysToRemove.push(key);
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch {}
    loadItems();
  }

  function exportCsv() {
    try {
      const rows: string[][] = [["Date", "Question", "Answer"]];
      for (const item of items) {
        for (const entry of item.entries) {
          rows.push([item.date, entry.q, entry.a]);
        }
      }
      const csv = rows
        .map((r) => r.map((v) => '"' + String(v).replace(/"/g, '""') + '"').join(","))
        .join("\r\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "daily_questions_history.csv";
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      a.remove();
    } catch {}
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-black via-[#0b0520] to-[#0b1a3a] text-white">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(1200px_600px_at_50%_-200px,rgba(168,85,247,0.25),transparent),radial-gradient(900px_500px_at_80%_120%,rgba(34,211,238,0.18),transparent),radial-gradient(800px_400px_at_10%_120%,rgba(59,130,246,0.12),transparent)]" />
      <div className="pointer-events-none absolute -top-24 right-1/2 h-[420px] w-[420px] translate-x-1/2 rounded-full bg-gradient-to-r from-fuchsia-500/25 via-purple-500/20 to-cyan-500/25 blur-3xl -z-10" />

      <main className="relative p-8 sm:p-16">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl sm:text-3xl font-semibold">Saved Answers</h1>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={exportCsv}
                className="text-sm rounded-md border border-white/15 bg-white/10 px-3 py-1 hover:bg-white/15"
                aria-label="Export saved answers as CSV"
              >
                Export CSV
              </button>
              <button
                type="button"
                onClick={clearAll}
                className="text-sm rounded-md border border-red-400/40 bg-red-500/20 px-3 py-1 hover:bg-red-500/30"
                aria-label="Clear all saved answers"
              >
                Clear All
              </button>
              <Link href="/dashboard" className="text-sm rounded-md border border-white/15 bg-white/10 px-3 py-1 hover:bg-white/15">
                Home
              </Link>
            </div>
          </div>

          {items.length === 0 ? (
            <p className="opacity-80">No saved answers yet.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {items.map((g) => (
                <div key={g.date} className="rounded-lg border border-white/10 bg-white/5 p-4">
                  <p className="mb-2 font-medium opacity-90">{g.date}</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {g.entries.map((e, idx) => (
                      <li key={idx} className="opacity-85">
                        <span className="opacity-95">{e.q}</span>: {e.a}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}


