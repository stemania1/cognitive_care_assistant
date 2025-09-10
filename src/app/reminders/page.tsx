"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type ReminderKey = "drinkWater" | "takeMedicine" | "eatFood";

type RemindersState = {
  drinkWater: boolean;
  takeMedicine: boolean;
  eatFood: boolean;
  medicineDosage: string;
  medicineTimes: string[];
};

export default function RemindersPage() {
  const storageKey = "reminders:v1";
  const [state, setState] = useState<RemindersState>({
    drinkWater: false,
    takeMedicine: false,
    eatFood: false,
    medicineDosage: "",
    medicineTimes: [],
  });
  const [saved, setSaved] = useState(false);
  const [timeInput, setTimeInput] = useState<string>("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setState((prev) => ({ ...prev, ...JSON.parse(raw) }));
    } catch {}
  }, []);

  function persist(next: RemindersState) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      setSaved(true);
      window.setTimeout(() => setSaved(false), 800);
    } catch {}
  }

  function updateToggle(key: ReminderKey, value: boolean) {
    setState((prev) => {
      const next = { ...prev, [key]: value };
      persist(next);
      return next;
    });
  }

  function updateDosage(value: string) {
    setState((prev) => {
      const next = { ...prev, medicineDosage: value };
      persist(next);
      return next;
    });
  }

  function addTime() {
    if (!timeInput) return;
    setState((prev) => {
      if (prev.medicineTimes.includes(timeInput)) return prev;
      const next = { ...prev, medicineTimes: [...prev.medicineTimes, timeInput].sort() };
      persist(next);
      return next;
    });
    setTimeInput("");
  }

  function removeTime(t: string) {
    setState((prev) => {
      const next = { ...prev, medicineTimes: prev.medicineTimes.filter((x) => x !== t) };
      persist(next);
      return next;
    });
  }

  return (
    <>
      <main className="min-h-screen p-8 sm:p-16 grid place-items-center">
        <div className="w-full max-w-2xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold mb-1">Reminders</h1>
              <p className="opacity-80">Drink water, take medicine, and eat food.</p>
            </div>
            {saved ? <span className="text-xs text-amber-400">Saved</span> : <span className="text-xs opacity-60">Auto-saves</span>}
          </div>

          <section className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Medicine</h2>
              <button
                type="button"
                aria-pressed={state.takeMedicine}
                onClick={() => updateToggle("takeMedicine", !state.takeMedicine)}
                className={`relative h-6 w-11 rounded-full transition-colors ${state.takeMedicine ? "bg-amber-400" : "bg-white/15"}`}
              >
                <span className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-white transition-all ${state.takeMedicine ? "right-1" : "left-1"}`} />
                <span className="sr-only">Toggle medicine reminders</span>
              </button>
            </div>

            {state.takeMedicine && (
              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs opacity-80 mb-1">Dosage</label>
                  <input
                    type="text"
                    value={state.medicineDosage}
                    onChange={(e) => updateDosage(e.target.value)}
                    placeholder="e.g., 1 pill, 5 mL, 2 tablets"
                    className="w-full rounded-md border border-white/10 bg-white/10 px-3 py-2 text-sm outline-none placeholder-white/40"
                  />
                </div>
                <div>
                  <label className="block text-xs opacity-80 mb-1">Times to take</label>
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="time"
                      value={timeInput}
                      onChange={(e) => setTimeInput(e.target.value)}
                      className="rounded-md border border-white/10 bg-white/10 px-3 py-2 text-sm outline-none"
                    />
                    <button
                      type="button"
                      onClick={addTime}
                      className="rounded-md border border-white/15 bg-white/10 px-3 py-2 text-sm hover:bg-white/15"
                    >
                      Add
                    </button>
                  </div>
                  {state.medicineTimes.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {state.medicineTimes.map((t) => (
                        <span key={t} className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-xs">
                          {t}
                          <button
                            type="button"
                            onClick={() => removeTime(t)}
                            className="ml-1 rounded-full bg-white/20 px-1.5 py-0.5 hover:bg-white/30"
                            aria-label={`Remove time ${t}`}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs opacity-60">No times added yet.</p>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
      <Link href="/dashboard" className="group fixed bottom-6 left-6 sm:bottom-8 sm:left-8">
        <span className="absolute -inset-2 rounded-full bg-gradient-to-r from-purple-500/30 via-fuchsia-500/25 to-cyan-500/30 blur-xl opacity-60 group-hover:opacity-80 transition-opacity" />
        <span className="relative inline-flex h-12 w-12 items-center justify-center rounded-full border border-black/[.08] dark:border-white/[.12] bg-white/10 backdrop-blur shadow-lg transition-transform duration-200 group-hover:scale-105">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 opacity-90" aria-hidden="true">
            <path d="M11.47 3.84a.75.75 0 0 1 1.06 0l8.25 8.25a.75.75 0 1 1-1.06 1.06l-.97-.97v8.07a.75.75 0 0 1-.75.75h-4.5a.75.75 0 0 1-.75-.75v-4.5h-3v4.5a.75.75 0 0 1-.75.75H4.5a.75.75 0 0 1-.75-.75v-8.07l-.97.97a.75.75 0 1 1-1.06-1.06Z" />
          </svg>
          <span className="sr-only">Home</span>
        </span>
      </Link>
    </>
  );
}


