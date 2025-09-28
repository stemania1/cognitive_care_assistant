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
  waterTimes: string[];
  foodTimes: string[];
};

export default function RemindersPage() {
  const storageKey = "reminders:v1";
  const [state, setState] = useState<RemindersState>({
    drinkWater: false,
    takeMedicine: false,
    eatFood: false,
    medicineDosage: "",
    medicineTimes: [],
    waterTimes: [],
    foodTimes: [],
  });
  const [saved, setSaved] = useState(false);
  const [timeInput, setTimeInput] = useState<string>("");
  const [waterTimeInput, setWaterTimeInput] = useState<string>("");
  const [foodTimeInput, setFoodTimeInput] = useState<string>("");

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

  function addWaterTime() {
    if (!waterTimeInput) return;
    setState((prev) => {
      if (prev.waterTimes.includes(waterTimeInput)) return prev;
      const next = { ...prev, waterTimes: [...prev.waterTimes, waterTimeInput].sort() };
      persist(next);
      return next;
    });
    setWaterTimeInput("");
  }

  function removeWaterTime(t: string) {
    setState((prev) => {
      const next = { ...prev, waterTimes: prev.waterTimes.filter((x) => x !== t) };
      persist(next);
      return next;
    });
  }

  function addFoodTime() {
    if (!foodTimeInput) return;
    setState((prev) => {
      if (prev.foodTimes.includes(foodTimeInput)) return prev;
      const next = { ...prev, foodTimes: [...prev.foodTimes, foodTimeInput].sort() };
      persist(next);
      return next;
    });
    setFoodTimeInput("");
  }

  function removeFoodTime(t: string) {
    setState((prev) => {
      const next = { ...prev, foodTimes: prev.foodTimes.filter((x) => x !== t) };
      persist(next);
      return next;
    });
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-black via-[#0b0520] to-[#0b1a3a] text-white">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(1200px_600px_at_50%_-200px,rgba(168,85,247,0.25),transparent),radial-gradient(900px_500px_at_80%_120%,rgba(34,211,238,0.18),transparent),radial-gradient(800px_400px_at_10%_120%,rgba(59,130,246,0.12),transparent)]" />
      <div className="pointer-events-none absolute -top-24 right-1/2 h-[420px] w-[420px] translate-x-1/2 rounded-full bg-gradient-to-r from-fuchsia-500/25 via-purple-500/20 to-cyan-500/25 blur-3xl -z-10" />

      <main className="relative mx-auto max-w-2xl px-6 sm:px-10 py-12 sm:py-16">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold mb-1">Nutrition</h1>
            <p className="opacity-80">Hydration, meals, and medicine reminders.</p>
          </div>
          {saved ? <span className="text-xs text-amber-400">Saved</span> : <span className="text-xs opacity-60">Auto-saves</span>}
        </div>

        {/* Drink Water */}
        <section className="rounded-xl border border-white/10 bg-white/5 p-4 mb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Drink Water</h2>
            <button
              type="button"
              aria-pressed={state.drinkWater}
              onClick={() => updateToggle("drinkWater", !state.drinkWater)}
              className={`relative h-6 w-11 rounded-full transition-colors ${state.drinkWater ? "bg-amber-400" : "bg-white/15"}`}
            >
              <span className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-white transition-all ${state.drinkWater ? "right-1" : "left-1"}`} />
              <span className="sr-only">Toggle drink water reminders</span>
            </button>
          </div>
          {state.drinkWater ? (
            <div className="mt-3">
              <label className="block text-xs opacity-80 mb-1">Times to drink</label>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="time"
                  value={waterTimeInput}
                  onChange={(e) => setWaterTimeInput(e.target.value)}
                  className="rounded-md border border-white/10 bg-white/10 px-3 py-2 text-sm outline-none"
                />
                <button
                  type="button"
                  onClick={addWaterTime}
                  className="rounded-md border border-white/15 bg-white/10 px-3 py-2 text-sm hover:bg-white/15"
                >
                  Add
                </button>
              </div>
              {state.waterTimes.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {state.waterTimes.map((t) => (
                    <span key={t} className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-xs">
                      {t}
                      <button
                        type="button"
                        onClick={() => removeWaterTime(t)}
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
          ) : (
            <p className="mt-2 text-xs opacity-70">Turn on to get reminded to drink water regularly.</p>
          )}
        </section>

        {/* Medicine */}
        <section className="rounded-xl border border-white/10 bg-white/5 p-4 mb-4">
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

        {/* Eat Food */}
        <section className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Eat Food</h2>
            <button
              type="button"
              aria-pressed={state.eatFood}
              onClick={() => updateToggle("eatFood", !state.eatFood)}
              className={`relative h-6 w-11 rounded-full transition-colors ${state.eatFood ? "bg-amber-400" : "bg-white/15"}`}
            >
              <span className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-white transition-all ${state.eatFood ? "right-1" : "left-1"}`} />
              <span className="sr-only">Toggle eat food reminders</span>
            </button>
          </div>
          {state.eatFood ? (
            <div className="mt-3">
              <label className="block text-xs opacity-80 mb-1">Meal times</label>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="time"
                  value={foodTimeInput}
                  onChange={(e) => setFoodTimeInput(e.target.value)}
                  className="rounded-md border border-white/10 bg-white/10 px-3 py-2 text-sm outline-none"
                />
                <button
                  type="button"
                  onClick={addFoodTime}
                  className="rounded-md border border-white/15 bg-white/10 px-3 py-2 text-sm hover:bg-white/15"
                >
                  Add
                </button>
              </div>
              {state.foodTimes.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {state.foodTimes.map((t) => (
                    <span key={t} className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-xs">
                      {t}
                      <button
                        type="button"
                        onClick={() => removeFoodTime(t)}
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
          ) : (
            <p className="mt-2 text-xs opacity-70">Turn on to get reminded about meals and snacks.</p>
          )}
        </section>
      </main>

      <Link href="/dashboard" className="fixed bottom-6 left-6 sm:bottom-8 sm:left-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 hover:bg-white/15 transition">
        <span className="text-sm">← Back to Home</span>
      </Link>
    </div>
  );
}


