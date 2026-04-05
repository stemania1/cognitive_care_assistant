"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Line } from "react-chartjs-2";
import { registerChartJS } from "@/utils/chart-registration";

registerChartJS();

function TrendArrow({ direction }: { direction: "up" | "down" | "flat" }) {
  if (direction === "up") {
    return (
      <span className="inline-flex items-center gap-0.5 text-amber-700 dark:text-amber-400" title="Increasing">
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }
  if (direction === "down") {
    return (
      <span className="inline-flex items-center gap-0.5 text-emerald-700 dark:text-emerald-400" title="Decreasing">
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M19 12l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }
  return (
    <span className="inline-flex text-slate-500" title="Stable">
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M5 12h14" strokeLinecap="round" />
      </svg>
    </span>
  );
}

function MiniBar({ value, label }: { value: number; label: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
        <span>{label}</span>
        <span className="font-mono font-medium text-slate-800 dark:text-slate-200">{value}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-200/90 dark:bg-slate-700/80">
        <div
          className="h-full rounded-full bg-gradient-to-r from-teal-500 to-sky-600 transition-all"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200/95 bg-white p-5 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/60">
      <div className="mb-4 border-b border-slate-100 pb-3 dark:border-slate-700/80">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-800 dark:text-slate-100">{title}</h2>
        {subtitle ? <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}

const riskTrendLabels = ["Wk 1", "Wk 4", "Wk 8", "Wk 12"];
const riskTrendData = [28, 31, 29, 32];

export function AiSynopsisDashboard() {
  const lineData = {
    labels: riskTrendLabels,
    datasets: [
      {
        label: "Cognitive risk index",
        data: riskTrendData,
        borderColor: "rgb(13, 148, 136)",
        backgroundColor: "rgba(13, 148, 136, 0.12)",
        borderWidth: 2,
        fill: true,
        tension: 0.35,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: "rgb(13, 148, 136)",
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: { parsed: { y: number } }) => `Risk index: ${ctx.parsed.y}`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: "rgba(148, 163, 184, 0.2)" },
        ticks: { color: "#64748b", font: { size: 11 } },
      },
      y: {
        min: 0,
        max: 45,
        grid: { color: "rgba(148, 163, 184, 0.2)" },
        ticks: { color: "#64748b", font: { size: 11 } },
      },
    },
  };

  return (
    <div className="min-h-screen bg-[#f4f7f9] text-slate-800 dark:bg-slate-950 dark:text-slate-100">
      <header className="border-b border-slate-200/90 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div>
            <Link
              href="/dashboard"
              className="mb-2 inline-flex text-xs font-medium text-teal-700 hover:text-teal-900 dark:text-teal-400 dark:hover:text-teal-300"
            >
              ← Return to patient app
            </Link>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-teal-700 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                CCA 2.0
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Provider dashboard
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              Cognitive Care Assistant
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Multimodal synopsis · rolling window{" "}
              <span className="font-semibold text-slate-800 dark:text-slate-200">last 90 days</span>
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-4 rounded-lg border border-slate-200 bg-slate-50/80 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/50">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Patient record</p>
              <p className="font-mono text-sm text-slate-800 dark:text-slate-200">CCA-DEMO-1042</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">As of</p>
              <p className="text-sm text-slate-800 dark:text-slate-200">Apr 4, 2026</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        {/* AI Synopsis — narrative */}
        <section className="rounded-xl border border-slate-200/95 bg-white p-6 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/60 sm:p-8">
          <h2 className="text-center text-lg font-bold uppercase tracking-[0.14em] text-slate-900 dark:text-white sm:text-xl">
            AI SYNOPSIS <span className="text-teal-700 dark:text-teal-400">(Last 90 Days)</span>
          </h2>
          <div className="mx-auto mt-6 max-w-4xl space-y-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            <p>
              Over the past 3 months, the patient demonstrates{" "}
              <strong className="text-slate-900 dark:text-white">stability</strong> in cognitive performance (
              <strong className="font-mono text-teal-800 dark:text-teal-300">±2%</strong> vs. baseline), accompanied by{" "}
              <strong className="text-slate-900 dark:text-white">speech changes</strong>: increased mid-sentence pauses (
              <strong className="font-mono">+8%</strong>), mild word-finding latency on naming tasks, and speech rate within
              normal variance; <strong className="text-slate-900 dark:text-white">movement changes</strong> include slightly
              reduced gait stability variability (<strong className="font-mono">−4%</strong> stride-time CV) with stable
              overall activity counts.
            </p>
            <p>
              Physiological data indicates <strong className="text-slate-900 dark:text-white">sleep patterns</strong> with
              modestly increased nocturnal awakenings (+0.4/night) but <strong>improved sleep efficiency</strong> (+3%) on
              weeks with consistent routines; <strong className="text-slate-900 dark:text-white">activity level</strong> shows
              stable average daily movement with preserved HR variability during daytime blocks.
            </p>
            <p>
              MRI-derived features show <strong className="text-slate-900 dark:text-white">hippocampal volume mildly reduced</strong>{" "}
              for age; cortical thickness maps are unremarkable in frontal regions. Blood biomarker analysis indicates{" "}
              <strong className="text-slate-900 dark:text-white">p-tau217 trending upward</strong> but still below the
              high-positive threshold on the last draw—repeat in 8–12 weeks is suggested.
            </p>
            <div className="rounded-lg border border-amber-200/80 bg-amber-50/90 p-4 dark:border-amber-900/50 dark:bg-amber-950/30">
              <p className="text-sm font-semibold text-amber-950 dark:text-amber-100">
                📊 Overall assessment
              </p>
              <p className="mt-2 text-sm text-amber-950/90 dark:text-amber-100/90">
                Patterns are consistent with{" "}
                <strong>early mild cognitive impairment (MCI) risk</strong> with multimodal stability on most day-to-day
                metrics. <strong>Recommendation:</strong> continue structured monitoring; consider formal neuropsychological
                follow-up if speech or sleep metrics worsen over the next quarter.
              </p>
            </div>
            <p className="border-l-4 border-teal-500 pl-4 text-sm text-slate-600 dark:text-slate-400">
              <span className="font-semibold text-slate-800 dark:text-slate-200">🧠 Risk trajectory:</span> longitudinal
              modeling shows a <strong>stable</strong> risk slope over the window, suggesting{" "}
              <strong>stability without clear progression</strong> on current data density—reassess after additional speech
              samples and one more sleep-thermal cycle.
            </p>
            <p className="rounded-md bg-slate-100/90 px-3 py-2 text-xs text-slate-600 dark:bg-slate-800/80 dark:text-slate-400">
              <span className="font-semibold text-slate-800 dark:text-slate-200">⚡ Ultra-short summary:</span> Cognitive trend{" "}
              <strong>stable</strong> with key drivers in <strong>speech pacing</strong> and <strong>sleep fragmentation</strong>.
              MRI: mild hippocampal signal; biomarkers: p-tau217 <strong>watch</strong>. Consistent with{" "}
              <strong>early MCI risk — monitor</strong>.
            </p>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <Panel title="Cognitive risk score" subtitle="Composite index · higher = more concern">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-4xl font-bold tabular-nums text-teal-800 dark:text-teal-300">32</p>
                  <p className="text-xs text-slate-500">of 100 (moderate watch)</p>
                </div>
                <div className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400">
                  <span>90-day trend</span>
                  <TrendArrow direction="flat" />
                </div>
              </div>
              <div className="mt-4 h-44">
                <Line data={lineData} options={lineOptions} />
              </div>
            </Panel>
          </div>

          <div className="space-y-6 lg:col-span-2">
            <Panel title="Multimodal analysis" subtitle="Labeled domains · demo values for provider review">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-3 rounded-lg border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-700/60 dark:bg-slate-800/40">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Movement & gait</h3>
                    <TrendArrow direction="flat" />
                  </div>
                  <MiniBar value={72} label="Stride consistency" />
                  <MiniBar value={64} label="Daily ambulation vs. goal" />
                  <p className="text-xs text-slate-500">EMG-derived activation balance stable week-over-week.</p>
                </div>
                <div className="space-y-3 rounded-lg border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-700/60 dark:bg-slate-800/40">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Speech & language</h3>
                    <TrendArrow direction="up" />
                  </div>
                  <MiniBar value={58} label="Fluency score" />
                  <MiniBar value={41} label="Pause rate (normed)" />
                  <p className="text-xs text-slate-500">AI speech analysis on daily check-ins; more samples improve confidence.</p>
                </div>
                <div className="space-y-3 rounded-lg border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-700/60 dark:bg-slate-800/40">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Physiological signals</h3>
                    <TrendArrow direction="flat" />
                  </div>
                  <MiniBar value={78} label="Sleep efficiency (rolling)" />
                  <MiniBar value={81} label="Resting HR variability" />
                  <MiniBar value={69} label="EMG activity index" />
                  <p className="text-xs text-slate-500">Thermal sleep staging correlated with self-reported routines.</p>
                </div>
                <div className="space-y-3 rounded-lg border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-700/60 dark:bg-slate-800/40">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Cognitive test performance</h3>
                    <TrendArrow direction="down" />
                  </div>
                  <MiniBar value={74} label="Memory games composite" />
                  <MiniBar value={66} label="Daily check consistency" />
                  <p className="text-xs text-slate-500">Games + questionnaire trajectory weighted into risk index.</p>
                </div>
              </div>
            </Panel>
          </div>
        </div>

        <Panel title="Biomarkers & imaging" subtitle="Laboratory and MRI-derived features (illustrative)">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-700/60 dark:bg-slate-800/40">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Blood · p-tau217</p>
              <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">0.42</p>
              <p className="text-xs text-amber-700 dark:text-amber-400">↑ Trending upward · repeat 8–12 wk</p>
            </div>
            <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-700/60 dark:bg-slate-800/40">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">MRI · Hippocampal volume</p>
              <p className="mt-2 text-lg font-bold text-slate-900 dark:text-white">Mildly reduced</p>
              <p className="text-xs text-slate-500">Z-score −0.9 vs. age norms</p>
            </div>
            <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-700/60 dark:bg-slate-800/40">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">MRI · Cortex & connectivity</p>
              <p className="mt-2 text-lg font-bold text-slate-900 dark:text-white">Within range</p>
              <p className="text-xs text-slate-500">Thickness stable · DMN connectivity preserved</p>
            </div>
          </div>
        </Panel>

        <Panel title="Clinical data modules" subtitle="Source systems in Cognitive Care Assistant">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <ModuleLink
              href="/daily-questions"
              title="Daily cognitive checks"
              detail="Questionnaires · AI speech analysis (when enabled)"
            />
            <ModuleLink href="/memory-games" title="Memory games" detail="Performance tracking & trends" />
            <ModuleLink href="/reminders" title="Nutrition & medication" detail="Compliance-style reminders & logs" />
            <ModuleLink href="/emg" title="EMG movement" detail="Muscle activation & exercise sessions" />
            <ModuleLink href="/sleepbehaviors" title="Thermal sleep" detail="Restlessness & sleep-behavior patterns" />
            <ModuleLink href="/photo-album" title="Life context" detail="Photos from daily questions" />
          </div>
        </Panel>

        <p className="text-center text-[11px] text-slate-500 dark:text-slate-500">
          Demonstration layout for provider review. Connect live models and FHIR interfaces to replace sample values.
        </p>
      </main>
    </div>
  );
}

function ModuleLink({ href, title, detail }: { href: string; title: string; detail: string }) {
  return (
    <Link
      href={href}
      className="group flex flex-col rounded-lg border border-slate-200 bg-white p-4 transition-shadow hover:border-teal-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-800/40 dark:hover:border-teal-700"
    >
      <span className="text-sm font-semibold text-slate-900 group-hover:text-teal-800 dark:text-white dark:group-hover:text-teal-300">
        {title}
      </span>
      <span className="mt-1 text-xs text-slate-500 dark:text-slate-400">{detail}</span>
      <span className="mt-2 text-xs font-medium text-teal-700 opacity-0 transition-opacity group-hover:opacity-100 dark:text-teal-400">
        Open module →
      </span>
    </Link>
  );
}
