"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type ReminderKey = "drinkWater" | "takeMedicine" | "eatFood";

type RemindersState = {
  drinkWater: boolean;
  takeMedicine: boolean;
  eatFood: boolean;
  medicineDosage: string;
  medicineTimes: string[];
};

function getTodayKey(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

type LinkCardProps = {
  href: string;
  title: string;
  description: string;
  accent: string;
  iconGlow: string;
  moduleTag: string;
  emoji: string;
  targetBlank?: boolean;
};

export default function HomeCards() {
  return (
    <div className="cca-dashboard-cards flex flex-col">
      <div className="grid grid-cols-1 sm:grid-cols-2">
      {/* Row 1: Daily Questions + Medication */}
      <LinkCard
        href="/daily-questions"
        title="Daily Checks"
        description="Quick daily check-in questionnaires"
        accent="from-emerald-400/80 via-teal-500/60 to-transparent"
        iconGlow="shadow-[0_0_20px_rgba(52,211,153,0.35)]"
        moduleTag="ASSESSMENT"
        emoji="📝"
      />

      <LinkCard
        href="/reminders"
        title="Medication & Nutrition"
        description="Hydration, meals, and medicine times"
        accent="from-amber-400/80 via-orange-500/50 to-transparent"
        iconGlow="shadow-[0_0_20px_rgba(251,191,36,0.3)]"
        moduleTag="CARE PLAN"
        emoji="🥗"
      />

      {/* Row 2: Exercise + Sleep Behaviors */}
      <LinkCard
        href="/emg"
        title="Exercise"
        description="Analyze muscle activation during workouts"
        accent="from-violet-400/80 via-purple-500/50 to-transparent"
        iconGlow="shadow-[0_0_20px_rgba(167,139,250,0.35)]"
        moduleTag="BIOMETRICS"
        emoji="💪"
      />

      <LinkCard
        href="/sleepbehaviors"
        title="Sleep Behaviors"
        description="Monitor thermal patterns and sleep analysis"
        accent="from-cyan-400/80 via-sky-500/50 to-transparent"
        iconGlow="shadow-[0_0_20px_rgba(34,211,238,0.35)]"
        moduleTag="THERMAL"
        emoji="😴"
      />

      {/* Row 3: Photo Album + Memory Games */}
      <LinkCard
        href="/photo-album"
        title="Photo Album"
        description="View your memories and photos from daily questions"
        accent="from-rose-400/70 via-pink-500/45 to-transparent"
        iconGlow="shadow-[0_0_20px_rgba(244,114,182,0.3)]"
        moduleTag="RECORDS"
        emoji="📸"
      />

      <LinkCard
        href="/memory-games"
        title="Memory Games"
        description="Play cognitive exercises to train memory"
        accent="from-emerald-400/70 via-green-500/45 to-transparent"
        iconGlow="shadow-[0_0_20px_rgba(74,222,128,0.3)]"
        moduleTag="COGNITIVE"
        emoji="🧠"
      />

      {/* Row 4: Biomedical + AI Synopsis */}
      <LinkCard
        href="/dashboard/biomedical"
        title="Biomedical Monitor"
        description="Vitals, brain mapping, and multimodal telemetry"
        accent="from-sky-400/80 via-cyan-500/55 to-transparent"
        iconGlow="shadow-[0_0_20px_rgba(56,189,248,0.38)]"
        moduleTag="VITALS"
        emoji="🩺"
      />

      <LinkCard
        href="/ai-synopsis"
        title="AI Synopsis"
        description="CCA 2.0 provider view · risk score, multimodal metrics, biomarkers"
        accent="from-violet-400/80 via-indigo-500/55 to-transparent"
        iconGlow="shadow-[0_0_20px_rgba(129,140,248,0.38)]"
        moduleTag="ANALYTICS"
        emoji="✨"
      />
      </div>
    </div>
  );
}

function CardShell({
  accent,
  iconGlow,
  moduleTag,
  emoji,
  children,
}: {
  accent: string;
  iconGlow?: string;
  moduleTag?: string;
  emoji?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="cca-saas-module group relative block h-full">
      <div className="cca-saas-module-halo" aria-hidden />
      <div className="cca-saas-card light-ui-frame relative flex h-full flex-col overflow-hidden rounded-xl px-5 py-6">
        <div className="cca-saas-card-shine" aria-hidden />
        <div className={`cca-saas-card-accent bg-gradient-to-r ${accent}`} aria-hidden />
        <div className={`cca-saas-card-tint bg-gradient-to-br ${accent}`} aria-hidden />
        <div className="cca-saas-card-gleam" aria-hidden />
        {moduleTag && emoji ? (
          <div className="cca-saas-card-header relative flex items-center gap-3">
            <EmojiIcon symbol={emoji} glowClassName={iconGlow ?? ""} />
            <p className="cca-saas-module-label truncate">{moduleTag}</p>
          </div>
        ) : null}
        <div className="relative flex flex-1 flex-col gap-3 text-slate-100">{children}</div>
      </div>
    </div>
  );
}

function EmojiIcon({ symbol, glowClassName = "" }: { symbol: string; glowClassName?: string }) {
  return (
    <span
      aria-hidden
      className={`cca-dashboard-emoji cca-saas-emoji inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-base ${glowClassName}`}
    >
      {symbol}
    </span>
  );
}

function ModuleChevron({ className = "" }: { className?: string }) {
  return (
    <span
      className={`cca-dashboard-chevron text-base text-sky-300/50 ${className}`}
      aria-hidden
    >
      →
    </span>
  );
}

function LinkCard({
  href,
  title,
  description,
  accent,
  iconGlow,
  moduleTag,
  emoji,
  targetBlank,
}: LinkCardProps) {
  return (
    <Link
      href={href}
      className="contents"
      target={targetBlank ? "_blank" : undefined}
      rel={targetBlank ? "noopener noreferrer" : undefined}
    >
      <CardShell accent={accent} iconGlow={iconGlow} moduleTag={moduleTag} emoji={emoji}>
        <div className="flex min-h-[7rem] flex-1 flex-col justify-between gap-4">
          <div className="flex items-start justify-between gap-2">
            <h2 className="cca-saas-card-title text-lg sm:text-xl">{title}</h2>
            <ModuleChevron />
          </div>
          <p className="cca-saas-card-desc text-sm">{description}</p>
        </div>
      </CardShell>
    </Link>
  );
}

type Question = { id: string; text: string; choices?: string[] };
type StoredAnswer = string | { v: string; t: string };

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

function DailyQuestionCard() {
	const today = useMemo(() => getTodayKey(), []);
	const todayKey = useMemo(() => `dailyQuestions:${today}`, [today]);
	const windowKey = useMemo(() => `dailyQuestionsWindow:${today}`, [today]);
	const [answers, setAnswers] = useState<Record<string, string>>({});
	const [saved, setSaved] = useState(false);
	const [windowStart, setWindowStart] = useState<number>(0);

	// Initialize/restore the 3-question window start
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
			// Default deterministic rotation by date
			const base = Math.floor(Date.now() / 86400000);
			const start = base % ALL_QUESTIONS.length;
			setWindowStart(start);
			localStorage.setItem(windowKey, String(start));
		} catch {}
	}, [windowKey]);

	// Compute the 3 questions to display from the current windowStart
	const todaysQuestions = useMemo(() => {
		return [0, 1, 2].map((i) => ALL_QUESTIONS[(windowStart + i) % ALL_QUESTIONS.length]);
	}, [windowStart]);

	useEffect(() => {
		try {
			const raw = localStorage.getItem(todayKey);
			if (raw) {
				const parsed = JSON.parse(raw) as Record<string, StoredAnswer>;
				const initial: Record<string, string> = {};
				for (const [id, val] of Object.entries(parsed)) {
					if (val && typeof val === "object" && "v" in val) {
						initial[id] = (val as { v: string }).v;
					} else if (typeof val === "string") {
						initial[id] = val;
					}
				}
				setAnswers(initial);
			}
		} catch {}
	}, [todayKey]);

	function saveOne(id: string, value: string) {
		try {
			const raw = localStorage.getItem(todayKey);
			const current: Record<string, StoredAnswer> = raw ? JSON.parse(raw) : {};
			current[id] = { v: value, t: new Date().toISOString() };
			localStorage.setItem(todayKey, JSON.stringify(current));
			setSaved(true);
			window.setTimeout(() => setSaved(false), 800);
		} catch {}
	}

	function setAnswer(id: string, value: string) {
		setAnswers((prev) => ({ ...prev, [id]: value }));
		saveOne(id, value);
	}


	const answeredCount = todaysQuestions.reduce((n, q) => (answers[q.id]?.trim() ? n + 1 : n), 0);

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
		<CardShell accent="from-emerald-500 to-teal-500">
			<div className="flex items-center justify-between gap-2">
				<h2 className="text-lg sm:text-xl font-medium">Daily Questions</h2>
				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={prevThree}
						className="rounded-md border border-slate-200/90 bg-white/90 px-2.5 py-1 text-xs hover:bg-white dark:border-white/15 dark:bg-white/10 dark:hover:bg-white/15"
						aria-label="Show previous three questions"
					>
						Prev 3
					</button>
					<button
						type="button"
						onClick={nextThree}
						className="rounded-md border border-slate-200/90 bg-white/90 px-2.5 py-1 text-xs hover:bg-white dark:border-white/15 dark:bg-white/10 dark:hover:bg-white/15"
						aria-label="Show next three questions"
					>
						Next 3
					</button>
					{saved ? (
						<span className="text-xs text-emerald-300">Saved</span>
					) : (
						<span className="text-xs opacity-60">{answeredCount}/3 answered</span>
					)}
				</div>
			</div>
			<div className="flex flex-col gap-3">
				{todaysQuestions.map((q) => (
					<div key={q.id} className="light-ui-frame rounded-lg border border-slate-200/80 bg-slate-50/90 p-3 dark:border-white/10 dark:bg-white/5">
						<p className="text-sm mb-2">{q.text}</p>
						{q.choices ? (
							<div className="flex gap-2 flex-wrap">
								{q.choices.map((choice) => (
									<button
										key={choice}
										onClick={() => setAnswer(q.id, choice)}
										className={`px-3 py-1 rounded-full text-xs transition-colors ${
											answers[q.id] === choice ? "bg-emerald-500 text-black" : "bg-slate-200/80 hover:bg-slate-300/80 dark:bg-white/10 dark:hover:bg-white/15"
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
								className="w-full rounded-md border border-slate-200/80 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-white/40 dark:outline-none"
							/>
						)}
					</div>
				))}
				<div className="flex items-center justify-end">
					<Link
						href="/questions/history"
						className="mt-1 inline-flex items-center rounded-md border border-slate-200/90 bg-white/90 px-3 py-1 text-xs hover:bg-white dark:border-white/15 dark:bg-white/10 dark:hover:bg-white/15"
					>
						View saved answers
					</Link>
				</div>
			</div>
		</CardShell>
	);
}

function RemindersCard() {
  const storageKey = "reminders:v1";
  const [state, setState] = useState<RemindersState>({ drinkWater: false, takeMedicine: false, eatFood: false, medicineDosage: "", medicineTimes: [] });
  const [saved, setSaved] = useState(false);
  const [timeInput, setTimeInput] = useState<string>("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setState((prev) => ({ ...prev, ...JSON.parse(raw) }));
    } catch {}
  }, []);

  function update(key: ReminderKey, value: boolean) {
    setState((prev) => {
      const next = { ...prev, [key]: value };
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
        setSaved(true);
        window.setTimeout(() => setSaved(false), 800);
      } catch {}
      return next;
    });
  }

  function updateDosage(value: string) {
    setState((prev) => {
      const next = { ...prev, medicineDosage: value };
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
        setSaved(true);
        window.setTimeout(() => setSaved(false), 800);
      } catch {}
      return next;
    });
  }

  function addTime() {
    if (!timeInput) return;
    setState((prev) => {
      if (prev.medicineTimes.includes(timeInput)) return prev;
      const next = { ...prev, medicineTimes: [...prev.medicineTimes, timeInput].sort() };
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
        setSaved(true);
        window.setTimeout(() => setSaved(false), 800);
      } catch {}
      return next;
    });
    setTimeInput("");
  }

  function removeTime(t: string) {
    setState((prev) => {
      const next = { ...prev, medicineTimes: prev.medicineTimes.filter((x) => x !== t) };
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
        setSaved(true);
        window.setTimeout(() => setSaved(false), 800);
      } catch {}
      return next;
    });
  }

  return (
    <CardShell accent="from-amber-500 to-orange-500">
      <div className="flex items-center justify-between">
        <h2 className="text-lg sm:text-xl font-medium">Reminders</h2>
        {saved ? <span className="text-xs text-amber-300">Saved</span> : <span className="text-xs opacity-60">Toggle on/off</span>}
      </div>
      <div className="flex flex-col gap-3">
        <ToggleRow label="Drink water" checked={state.drinkWater} onChange={(v) => update("drinkWater", v)} />
        <ToggleRow label="Take medicine" checked={state.takeMedicine} onChange={(v) => update("takeMedicine", v)} />
        {state.takeMedicine && (
          <div className="light-ui-frame rounded-lg border border-slate-200/80 bg-slate-50/90 p-3 dark:border-white/10 dark:bg-white/5">
            <div className="mb-3">
              <label className="block text-xs opacity-80 mb-1">Dosage</label>
              <input
                type="text"
                value={state.medicineDosage}
                onChange={(e) => updateDosage(e.target.value)}
                placeholder="e.g., 1 pill, 5 mL, 2 tablets"
                className="w-full rounded-md border border-slate-200/80 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-white/40 dark:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs opacity-80 mb-1">Times to take</label>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="time"
                  value={timeInput}
                  onChange={(e) => setTimeInput(e.target.value)}
                  className="rounded-md border border-slate-200/80 bg-white px-3 py-2 text-sm text-slate-900 dark:border-white/10 dark:bg-white/10 dark:text-white dark:outline-none"
                />
                <button
                  type="button"
                  onClick={addTime}
                  className="rounded-md border border-slate-200/90 bg-white/90 px-3 py-2 text-sm hover:bg-white dark:border-white/15 dark:bg-white/10 dark:hover:bg-white/15"
                >
                  Add
                </button>
              </div>
              {state.medicineTimes.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {state.medicineTimes.map((t) => (
                    <span key={t} className="light-ui-frame inline-flex items-center gap-1 rounded-full border border-slate-200/80 bg-white px-2.5 py-1 text-xs dark:border-white/10 dark:bg-white/10">
                      {t}
                      <button
                        type="button"
                        onClick={() => removeTime(t)}
                        className="ml-1 rounded-full bg-slate-200 px-1.5 py-0.5 hover:bg-slate-300 dark:bg-white/20 dark:hover:bg-white/30"
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
        <ToggleRow label="Eat food" checked={state.eatFood} onChange={(v) => update("eatFood", v)} />
      </div>
    </CardShell>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <div className="light-ui-frame flex items-center justify-between rounded-lg border border-slate-200/80 bg-slate-50/90 px-3 py-2 dark:border-white/10 dark:bg-white/5">
      <span className="text-sm">{label}</span>
      <button
        type="button"
        aria-pressed={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition-colors ${checked ? "bg-amber-400" : "bg-slate-300 dark:bg-white/15"}`}
      >
        <span className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-white transition-all ${checked ? "right-1" : "left-1"}`} />
        <span className="sr-only">Toggle {label}</span>
      </button>
    </div>
  );
}


