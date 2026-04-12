"use client";

import type { CognitiveState } from "./useBiomedicalTelemetry";

const styles: Record<
  CognitiveState,
  { bar: string; dot: string; label: string }
> = {
  Normal: {
    bar: "from-emerald-500/80 to-cyan-400/60",
    dot: "bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]",
    label: "text-emerald-200",
  },
  Fatigued: {
    bar: "from-amber-500/80 to-yellow-400/50",
    dot: "bg-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.75)]",
    label: "text-amber-100",
  },
  "At Risk": {
    bar: "from-red-600/90 to-rose-500/70",
    dot: "bg-red-400 shadow-[0_0_14px_rgba(248,113,113,0.85)]",
    label: "text-red-200",
  },
};

export function CognitiveStateBadge({ state }: { state: CognitiveState }) {
  const s = styles[state];
  return (
    <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-slate-950/80 px-3 py-2">
      <div
        className={`h-9 w-1.5 rounded-full bg-gradient-to-b ${s.bar}`}
        aria-hidden
      />
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          Cognitive state
        </p>
        <p className={`text-sm font-bold ${s.label}`}>{state}</p>
      </div>
      <span
        className={`ml-1 h-2.5 w-2.5 rounded-full ${s.dot}`}
        aria-hidden
      />
    </div>
  );
}
