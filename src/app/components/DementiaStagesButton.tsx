"use client";

import { useState, Fragment } from "react";

type Stage = {
  id: number;
  title: string;
  summary: string;
  bulletins: string[];
};

const STAGES: Stage[] = [
  {
    id: 1,
    title: "Stage 1 – No Cognitive Decline",
    summary: "Healthy baseline; no noticeable memory issues.",
    bulletins: [
      "Set up profiles and gather baseline data from EMG workouts, sleep behaviors, and daily reminders.",
      "Invite caregivers to explore the dashboard tabs together to build routine familiarity early.",
    ],
  },
  {
    id: 2,
    title: "Stage 2 – Very Mild Cognitive Decline",
    summary: "Occasional forgetfulness that is within normal limits.",
    bulletins: [
      "Use the Reminders hub to schedule hydration, meals, and medicine prompts before lapses increase.",
      "Capture caregiver notes in the assessment modules so trends are easy to spot later.",
    ],
  },
  {
    id: 3,
    title: "Stage 3 – Mild Cognitive Decline",
    summary: "Memory lapses become more noticeable to close friends and family.",
    bulletins: [
      "Turn on smart reminders for repetitive tasks—switch to visual countdown mode for clarity.",
      "Pair EMG exercise videos with guided instructions to reinforce movement patterns through muscle memory.",
      "Log sleep behaviors nightly to ensure restlessness or wandering is flagged early.",
    ],
  },
  {
    id: 4,
    title: "Stage 4 – Moderate Cognitive Decline",
    summary: "Clear challenges with complex tasks and recent events.",
    bulletins: [
      "Use the Sleep Behaviors thermal alerts to notify caregivers when the participant leaves bed.",
      "Enable caregiver summaries so the app emails or exports alerts after each session.",
      "Simplify dashboards by starring the three most-used tiles (Sleep, Reminders, EMG).",
    ],
  },
  {
    id: 5,
    title: "Stage 5 – Moderately Severe Cognitive Decline",
    summary: "Assistance needed with daily activities; noticeable gaps in memory.",
    bulletins: [
      "Leverage routine-based reminder packs (hygiene, meals, meds) to maintain independence cues.",
      "Record personalized audio prompts in the Reminders module for comforting guidance.",
      "Share EMG session summaries with clinicians to adjust mobility plans.",
    ],
  },
  {
    id: 6,
    title: "Stage 6 – Severe Cognitive Decline",
    summary: "Personality changes, disrupted sleep, and increased caregiver load.",
    bulletins: [
      "Activate automated alert routing via the mail icon so every high-temp, restlessness, or motion warning reaches caregivers instantly.",
      "Use the Sleep Behaviors dashboard to document wandering patterns for safety planning.",
      "Export daily recap PDFs for care teams to synchronize interventions.",
    ],
  },
  {
    id: 7,
    title: "Stage 7 – Very Severe Cognitive Decline",
    summary: "Loss of verbal abilities and motor control; extensive care required.",
    bulletins: [
      "Track EMG activity for passive range-of-motion exercises to reduce muscle stiffness.",
      "Log every alert event to inform hospice or long-term care teams of comfort needs.",
      "Focus on sensory cues—use calm music and thermal monitoring to maintain comfort.",
    ],
  },
];

export default function DementiaStagesButton() {
  const [open, setOpen] = useState(false);

  return (
    <Fragment>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-cyan-100 shadow-lg backdrop-blur transition-all hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70"
      >
        <span className="text-base">🧠</span>
        <span>7 Stages of Dementia &amp; Care Tips</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center px-4 py-6">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          <section
            aria-modal="true"
            role="dialog"
            aria-labelledby="dementia-stages-title"
            className="relative max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-3xl border border-cyan-400/20 bg-gradient-to-b from-slate-950/95 via-[#0b0520]/95 to-[#0b1a3a]/95 shadow-2xl"
          >
            <header className="flex items-center justify-between gap-4 border-b border-white/10 px-6 py-4">
              <div>
                <h2 id="dementia-stages-title" className="text-lg font-semibold text-cyan-200">
                  Dementia Progression Roadmap
                </h2>
                <p className="text-xs text-gray-300">
                  Each stage includes practical ways the Cognitive Care Assistant supports patients and caregivers.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-lg text-gray-200 hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70"
                aria-label="Close panel"
              >
                ×
              </button>
            </header>

            <div className="max-h-[70vh] overflow-y-auto px-6 py-4 space-y-4">
              {STAGES.map((stage) => (
                <article
                  key={stage.id}
                  className="rounded-2xl border border-white/12 bg-white/6 p-5 backdrop-blur"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-white">{stage.title}</h3>
                      <p className="text-sm text-cyan-200 mt-1">{stage.summary}</p>
                    </div>
                    <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-xs font-medium uppercase tracking-wide text-cyan-200">
                      Stage {stage.id}
                    </span>
                  </div>
                  <ul className="mt-3 space-y-2 text-sm text-gray-200">
                    {stage.bulletins.map((tip, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="mt-1 text-cyan-300">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>

            <footer className="border-t border-white/10 px-6 py-4 text-xs text-gray-300">
              Need more personalized guidance? Share the alert history and session exports with clinicians to tailor interventions at each stage.
            </footer>
          </section>
        </div>
      )}
    </Fragment>
  );
}

