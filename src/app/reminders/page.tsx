"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAlertCenter } from "../components/AlertCenter";

type ReminderKey = "drinkWater" | "takeMedicine" | "eatFood";

type CustomReminder = {
  id: string;
  name: string;
  enabled: boolean;
  times: string[];
};

type RemindersState = {
  drinkWater: boolean;
  takeMedicine: boolean;
  eatFood: boolean;
  medicineDosage: string;
  medicineTimes: string[];
  waterTimes: string[];
  foodTimes: string[];
  customReminders: CustomReminder[];
};

export default function RemindersPage() {
  const storageKey = "reminders:v2";
  const { addAlert } = useAlertCenter();
  const triggeredAlertsRef = useRef<Map<string, number>>(new Map());
  const [state, setState] = useState<RemindersState>({
    drinkWater: false,
    takeMedicine: false,
    eatFood: false,
    medicineDosage: "",
    medicineTimes: [],
    waterTimes: [],
    foodTimes: [],
    customReminders: [],
  });
  const [saved, setSaved] = useState(false);
  const [timeInput, setTimeInput] = useState<string>("");
  const [waterTimeInput, setWaterTimeInput] = useState<string>("");
  const [foodTimeInput, setFoodTimeInput] = useState<string>("");
  const [customTimeInputs, setCustomTimeInputs] = useState<Record<string, string>>({});
  const [countdown, setCountdown] = useState<string>("");
  const [nextReminder, setNextReminder] = useState<{ message: string; time: string } | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState<string>("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setState((prev) => ({ ...prev, ...JSON.parse(raw) }));
    } catch {}
  }, []);

  // Calculate countdown to next reminder
  useEffect(() => {
    const calculateNextReminder = () => {
      const now = new Date();
      const currentTimeInSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
      
      const allReminders: { time: string; message: string; priority: number }[] = [];
      
      // Collect all enabled reminders
      if (state.drinkWater && state.waterTimes.length > 0) {
        state.waterTimes.forEach(t => {
          const [hours, minutes] = t.split(':').map(Number);
          allReminders.push({ time: t, message: "💧 Time to drink water!", priority: 1 });
        });
      }
      
      if (state.takeMedicine && state.medicineTimes.length > 0) {
        state.medicineTimes.forEach(t => {
          allReminders.push({ 
            time: t, 
            message: `💊 Time to take medicine${state.medicineDosage ? ` (${state.medicineDosage})` : ''}`, 
            priority: 2 
          });
        });
      }
      
      if (state.eatFood && state.foodTimes.length > 0) {
        state.foodTimes.forEach(t => {
          allReminders.push({ time: t, message: "🍽️ Time to eat!", priority: 1 });
        });
      }
      
      state.customReminders
        .filter(r => r.enabled && r.times.length > 0)
        .forEach(reminder => {
          reminder.times.forEach(t => {
            allReminders.push({ time: t, message: `⏰ ${reminder.name || 'Custom reminder'}`, priority: 1 });
          });
        });
      
      // Find next reminder
      const sortedReminders = allReminders
        .map(r => {
          const [hours, minutes] = r.time.split(':').map(Number);
          const reminderTimeInSeconds = hours * 3600 + minutes * 60;
          const diff = reminderTimeInSeconds >= currentTimeInSeconds
            ? reminderTimeInSeconds - currentTimeInSeconds
            : (24 * 3600) - currentTimeInSeconds + reminderTimeInSeconds;
          return { ...r, diff };
        })
        .sort((a, b) => {
          if (a.diff !== b.diff) return a.diff - b.diff;
          return b.priority - a.priority;
        });
      
      if (sortedReminders.length > 0) {
        const next = sortedReminders[0];
        setNextReminder({ message: next.message, time: next.time });
        
        // Calculate countdown with seconds
        // next.diff is now in seconds
        const hours = Math.floor(next.diff / 3600);
        const minutes = Math.floor((next.diff % 3600) / 60);
        const seconds = next.diff % 60;
        
        if (hours > 0) {
          setCountdown(`${hours}h ${minutes}m ${seconds}s`);
        } else if (minutes > 0) {
          setCountdown(`${minutes}m ${seconds}s`);
        } else {
          setCountdown(`${seconds}s`);
        }
        
        // Check if reminder is due (within 1 minute = 60 seconds)
        if (next.diff <= 60) {
          const alertId = `${next.time}-${next.message}`;
          const now = Date.now();

          // Clear entries older than 4 hours so daily reminders can re-trigger
          triggeredAlertsRef.current.forEach((timestamp, key) => {
            if (now - timestamp > 4 * 60 * 60 * 1000) {
              triggeredAlertsRef.current.delete(key);
            }
          });

          const lastTriggered = triggeredAlertsRef.current.get(alertId) ?? 0;
          if (now - lastTriggered > 60_000) {
            addAlert({
              message: `${next.message} scheduled for ${next.time}`,
              severity: "warning",
              source: "Reminders",
            });
            triggeredAlertsRef.current.set(alertId, now);
          }

          setNotificationMessage(next.message);
          setShowNotification(true);
          setTimeout(() => setShowNotification(false), 5000);
        }
      } else {
        setNextReminder(null);
        setCountdown("");
      }
    };
    
    calculateNextReminder();
    const interval = setInterval(calculateNextReminder, 1000);
    
    return () => clearInterval(interval);
  }, [state]);

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

  function addCustomReminder() {
    setState((prev) => {
      const newReminder: CustomReminder = {
        id: Date.now().toString(),
        name: "",
        enabled: true,
        times: [],
      };
      const next = { ...prev, customReminders: [...prev.customReminders, newReminder] };
      persist(next);
      return next;
    });
  }

  function deleteCustomReminder(id: string) {
    setState((prev) => {
      const next = { ...prev, customReminders: prev.customReminders.filter((r) => r.id !== id) };
      persist(next);
      return next;
    });
    // Clean up time input for this reminder
    setCustomTimeInputs((prev) => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });
  }

  function toggleCustomReminder(id: string) {
    setState((prev) => {
      const next = {
        ...prev,
        customReminders: prev.customReminders.map((r) =>
          r.id === id ? { ...r, enabled: !r.enabled } : r
        ),
      };
      persist(next);
      return next;
    });
  }

  function updateCustomReminderName(id: string, value: string) {
    setState((prev) => {
      const next = {
        ...prev,
        customReminders: prev.customReminders.map((r) =>
          r.id === id ? { ...r, name: value } : r
        ),
      };
      persist(next);
      return next;
    });
  }

  function addCustomTime(id: string) {
    const timeInput = customTimeInputs[id];
    if (!timeInput) return;
    setState((prev) => {
      const next = {
        ...prev,
        customReminders: prev.customReminders.map((r) => {
          if (r.id === id && !r.times.includes(timeInput)) {
            return { ...r, times: [...r.times, timeInput].sort() };
          }
          return r;
        }),
      };
      persist(next);
      return next;
    });
    setCustomTimeInputs((prev) => ({ ...prev, [id]: "" }));
  }

  function removeCustomTime(reminderId: string, time: string) {
    setState((prev) => {
      const next = {
        ...prev,
        customReminders: prev.customReminders.map((r) =>
          r.id === reminderId ? { ...r, times: r.times.filter((t) => t !== time) } : r
        ),
      };
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

        {/* Countdown Section */}
        {nextReminder && (
          <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-80 mb-1">Next Reminder</p>
                <p className="text-lg font-semibold text-amber-300">{nextReminder.message}</p>
                <p className="text-xs opacity-60 mt-1">Scheduled for {nextReminder.time}</p>
              </div>
              <div className="text-right">
                <p className="text-sm opacity-80 mb-1">Time Remaining</p>
                <p className="text-3xl font-bold text-amber-400">{countdown}</p>
              </div>
            </div>
          </div>
        )}

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
        <section className="rounded-xl border border-white/10 bg-white/5 p-4 mb-4">
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

        {/* Custom Reminders Section */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Custom Reminders</h2>
            <button
              type="button"
              onClick={addCustomReminder}
              className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm font-medium hover:bg-cyan-500/20 transition-colors"
            >
              + Add Custom Reminder
            </button>
          </div>

          {state.customReminders.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center">
              <p className="text-sm opacity-70">No custom reminders yet. Click the button above to add one!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {state.customReminders.map((reminder) => (
                <section key={reminder.id} className="rounded-xl border border-cyan-400/30 bg-cyan-500/5 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3 flex-1">
                      <button
                        type="button"
                        aria-pressed={reminder.enabled}
                        onClick={() => toggleCustomReminder(reminder.id)}
                        className={`relative h-6 w-11 rounded-full transition-colors flex-shrink-0 ${reminder.enabled ? "bg-cyan-400" : "bg-white/15"}`}
                      >
                        <span className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-white transition-all ${reminder.enabled ? "right-1" : "left-1"}`} />
                        <span className="sr-only">Toggle reminder</span>
                      </button>
                      <input
                        type="text"
                        value={reminder.name}
                        onChange={(e) => updateCustomReminderName(reminder.id, e.target.value)}
                        placeholder="What do you want to be reminded about?"
                        className="flex-1 rounded-md border border-white/10 bg-white/10 px-3 py-2 text-sm outline-none placeholder-white/40"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteCustomReminder(reminder.id)}
                      className="ml-2 rounded-full bg-red-500/20 hover:bg-red-500/30 px-3 py-2 text-xs text-red-300 transition-colors"
                      aria-label="Delete reminder"
                    >
                      Delete
                    </button>
                  </div>

                  {reminder.enabled && (
                    <div>
                      <label className="block text-xs opacity-80 mb-2">Reminder times</label>
                      <div className="flex items-center gap-2 mb-2">
                        <input
                          type="time"
                          value={customTimeInputs[reminder.id] || ""}
                          onChange={(e) => setCustomTimeInputs((prev) => ({ ...prev, [reminder.id]: e.target.value }))}
                          className="rounded-md border border-white/10 bg-white/10 px-3 py-2 text-sm outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => addCustomTime(reminder.id)}
                          className="rounded-md border border-cyan-400/30 bg-cyan-500/10 px-3 py-2 text-sm hover:bg-cyan-500/20"
                        >
                          Add
                        </button>
                      </div>
                      {reminder.times.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {reminder.times.map((t) => (
                            <span key={t} className="inline-flex items-center gap-1 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-2.5 py-1 text-xs">
                              {t}
                              <button
                                type="button"
                                onClick={() => removeCustomTime(reminder.id, t)}
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
                  )}
                </section>
              ))}
            </div>
          )}
        </div>
      </main>

      <Link href="/dashboard" className="fixed bottom-6 left-6 sm:bottom-8 sm:left-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 hover:bg-white/15 transition">
        <span className="text-sm">← Back to Home</span>
      </Link>

      {/* Floating Notification */}
      {showNotification && (
        <div className="fixed top-6 right-6 sm:top-8 sm:right-8 z-50 animate-in slide-in-from-top-5 duration-300">
          <div className="rounded-xl border border-amber-400/50 bg-gradient-to-br from-amber-500/20 to-orange-500/20 backdrop-blur-lg shadow-2xl p-6 max-w-sm">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 text-3xl animate-pulse">🔔</div>
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-amber-300 mb-1">Reminder!</h4>
                <p className="text-white/90 text-sm">{notificationMessage}</p>
              </div>
              <button
                onClick={() => setShowNotification(false)}
                className="flex-shrink-0 rounded-full p-1 hover:bg-white/10 text-xl text-white/70"
                aria-label="Dismiss"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


