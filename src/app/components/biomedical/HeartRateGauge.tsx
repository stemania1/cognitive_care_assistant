"use client";

type HrState = "stable" | "elevated" | "low";

function hrState(bpm: number): HrState {
  if (bpm < 58) return "low";
  if (bpm > 102) return "elevated";
  return "stable";
}

export function HeartRateGauge({
  bpm,
  hrv,
}: {
  bpm: number;
  hrv: number;
}) {
  const t = Math.min(1, Math.max(0, (bpm - 48) / (140 - 48)));
  const angle = -125 + t * 250;
  const warn = bpm > 102;
  const crit = bpm > 118;
  const state = hrState(bpm);
  const stateLabel =
    state === "stable" ? "Within nominal band" : state === "elevated" ? "Above resting band" : "Below typical resting";

  return (
    <div className="relative flex h-[160px] flex-col items-center justify-between py-1">
      <svg viewBox="0 0 128 92" className="h-[102px] w-[148px]" aria-hidden>
        <defs>
          <linearGradient id="hrArcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="45%" stopColor="#4ade80" />
            <stop offset="78%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#f87171" />
          </linearGradient>
          <filter id="hrGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path
          d="M 20 76 A 52 52 0 1 1 108 76"
          fill="none"
          stroke="rgba(15,23,42,0.95)"
          strokeWidth="11"
          strokeLinecap="round"
        />
        <path
          d="M 20 76 A 52 52 0 1 1 108 76"
          fill="none"
          stroke="url(#hrArcGrad)"
          strokeWidth="5.5"
          strokeLinecap="round"
          opacity={0.88}
          filter="url(#hrGlow)"
        />
        <text x="22" y="88" fill="#64748b" fontSize="7" fontFamily="ui-monospace,monospace">
          48
        </text>
        <text x="100" y="88" fill="#64748b" fontSize="7" fontFamily="ui-monospace,monospace" textAnchor="end">
          140
        </text>
        <g transform={`rotate(${angle} 64 76)`}>
          <line
            x1="64"
            y1="76"
            x2="64"
            y2="38"
            stroke={crit ? "#fca5a5" : warn ? "#fde047" : "#7dd3fc"}
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <circle cx="64" cy="76" r="3.5" fill="#e2e8f0" />
        </g>
      </svg>
      <div className="flex w-full flex-col items-center gap-0.5 text-center">
        <p
          className={`text-2xl font-bold tabular-nums tracking-tight ${
            crit ? "text-red-300" : warn ? "text-amber-200" : "text-cyan-200"
          }`}
        >
          {bpm}
          <span className="ml-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">BPM</span>
        </p>
        <p className="text-[9px] text-slate-500">
          HRV (sim) <span className="font-mono text-slate-400">{(hrv * 100).toFixed(0)}%</span>
        </p>
        <p className="text-[9px] leading-tight text-slate-500">{stateLabel}</p>
      </div>
    </div>
  );
}
