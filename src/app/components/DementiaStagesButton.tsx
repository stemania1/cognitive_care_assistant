"use client";

import { useState, Fragment } from "react";
import { DEMENTIA_STAGES } from "@/constants/dementia-education";

export default function DementiaStagesButton() {
  const [open, setOpen] = useState(false);

  return (
    <Fragment>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="light-ui-frame inline-flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white/90 px-4 py-2 text-sm font-medium text-cyan-800 shadow-md backdrop-blur transition-all hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 dark:border-white/15 dark:bg-white/10 dark:text-cyan-100 dark:shadow-lg dark:hover:bg-white/15 dark:focus-visible:ring-cyan-300/70"
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
              {DEMENTIA_STAGES.map((stage) => (
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

