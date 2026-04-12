"use client";

/**
 * BrainNet: Distributed Cognitive Monitoring Network — infrastructure diagram.
 * Apple-style cards, blue/white clinical palette, animated data-flow arrows.
 */
export function BrainNetDiagram() {
  return (
    <div className="relative w-full overflow-x-auto pb-4">
      <style>{`
        @keyframes brainnet-flow {
          0% { stroke-dashoffset: 24; }
          100% { stroke-dashoffset: 0; }
        }
        .brainnet-arrow {
          stroke-dasharray: 8 6;
          animation: brainnet-flow 1.2s linear infinite;
        }
        .brainnet-glow {
          filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.35));
        }
      `}</style>

      <svg
        viewBox="0 0 960 420"
        className="mx-auto h-auto min-w-[720px] max-w-5xl text-slate-800"
        role="img"
        aria-label="BrainNet system diagram: wearables through signal processing and cloud AI to clinical dashboard"
      >
        <defs>
          <linearGradient id="bnCard" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f1f5f9" />
          </linearGradient>
          <linearGradient id="bnCloud" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#eff6ff" />
            <stop offset="100%" stopColor="#dbeafe" />
          </linearGradient>
        </defs>

        {/* Row labels — layer names */}
        <text x="120" y="28" className="fill-slate-400 text-[11px] font-semibold tracking-wide" textAnchor="middle">
          Sensor Layer
        </text>
        <text x="320" y="28" className="fill-slate-400 text-[11px] font-semibold tracking-wide" textAnchor="middle">
          Signal Processing Layer
        </text>
        <text x="560" y="28" className="fill-slate-400 text-[11px] font-semibold tracking-wide" textAnchor="middle">
          Machine Learning Analysis
        </text>
        <text x="820" y="28" className="fill-slate-400 text-[11px] font-semibold tracking-wide" textAnchor="middle">
          Clinical Decision Interface
        </text>

        {/* Patients + wearables */}
        <g transform="translate(40, 52)">
          {[0, 1, 2, 3].map((i) => (
            <g key={i} transform={`translate(${i * 52}, 0)`}>
              <rect
                x="0"
                y="0"
                width="44"
                height="72"
                rx="14"
                fill="url(#bnCard)"
                stroke="#e2e8f0"
                strokeWidth="1.2"
              />
              <circle cx="22" cy="22" r="9" fill="#cbd5e1" />
              <rect x="12" y="36" width="20" height="14" rx="4" fill="#3b82f6" opacity="0.18" />
              <rect x="12" y="52" width="20" height="10" rx="3" fill="#0ea5e9" opacity="0.25" />
              <text x="22" y="88" className="fill-slate-400 text-[9px]" textAnchor="middle">
                Patient {i + 1}
              </text>
            </g>
          ))}
        </g>

        {/* Arrows to signal processing */}
        <g className="brainnet-glow">
          <path
            d="M 268 108 L 298 108"
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2.2"
            className="brainnet-arrow"
          />
        </g>

        {/* Edge / DSP */}
        <g transform="translate(300, 58)">
          <rect
            x="0"
            y="0"
            width="120"
            height="96"
            rx="16"
            fill="url(#bnCard)"
            stroke="#e2e8f0"
            strokeWidth="1.2"
          />
          <text x="60" y="28" className="fill-slate-700 text-[11px] font-semibold" textAnchor="middle">
            Edge gateway
          </text>
          <text x="60" y="46" className="fill-slate-500 text-[9px]" textAnchor="middle">
            Filter · resample · QC
          </text>
          <rect x="16" y="58" width="88" height="8" rx="4" fill="#3b82f6" opacity="0.2" />
          <rect x="16" y="70" width="64" height="8" rx="4" fill="#38bdf8" opacity="0.25" />
        </g>

        <g className="brainnet-glow">
          <path
            d="M 428 108 L 458 108"
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2.2"
            className="brainnet-arrow"
          />
        </g>

        {/* Cloud + ML */}
        <g transform="translate(460, 44)">
          <path
            d="M 40 20 C 10 20 10 50 35 50 L 165 50 C 195 50 195 22 170 22 C 165 5 135 5 120 18 C 110 5 80 5 70 20 C 55 0 25 0 40 20 Z"
            fill="url(#bnCloud)"
            stroke="#bfdbfe"
            strokeWidth="1.2"
          />
          <text x="100" y="38" className="fill-slate-600 text-[10px] font-semibold" textAnchor="middle">
            Secure cloud
          </text>
          <g transform="translate(24, 78)">
            <rect
              x="0"
              y="0"
              width="152"
              height="88"
              rx="14"
              fill="#ffffff"
              stroke="#e2e8f0"
              strokeWidth="1"
            />
            <text x="76" y="22" className="fill-slate-700 text-[11px] font-semibold" textAnchor="middle">
              ML inference
            </text>
            <text x="76" y="40" className="fill-slate-500 text-[9px]" textAnchor="middle">
              Risk models · temporal fusion
            </text>
            <circle cx="40" cy="62" r="10" fill="#3b82f6" opacity="0.15" />
            <circle cx="76" cy="62" r="10" fill="#0ea5e9" opacity="0.18" />
            <circle cx="112" cy="62" r="10" fill="#22c55e" opacity="0.14" />
          </g>
        </g>

        <g className="brainnet-glow">
          <path
            d="M 688 130 L 718 130"
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2.2"
            className="brainnet-arrow"
          />
        </g>

        {/* Doctor dashboard */}
        <g transform="translate(720, 58)">
          <rect
            x="0"
            y="0"
            width="200"
            height="140"
            rx="18"
            fill="url(#bnCard)"
            stroke="#e2e8f0"
            strokeWidth="1.2"
          />
          <text x="100" y="28" className="fill-slate-700 text-[12px] font-semibold" textAnchor="middle">
            Clinician dashboard
          </text>
          <rect x="16" y="42" width="168" height="36" rx="8" fill="#f8fafc" stroke="#e2e8f0" />
          <rect x="24" y="52" width="56" height="6" rx="2" fill="#cbd5e1" />
          <rect x="24" y="62" width="120" height="6" rx="2" fill="#e2e8f0" />
          <rect x="16" y="88" width="80" height="40" rx="8" fill="#eff6ff" stroke="#bfdbfe" />
          <rect x="104" y="88" width="80" height="40" rx="8" fill="#ecfdf5" stroke="#a7f3d0" />
          <text x="100" y="148" className="fill-slate-400 text-[9px]" textAnchor="middle">
            Alerts · trends · cohort view
          </text>
        </g>

        {/* Bottom flow */}
        <text x="480" y="268" className="fill-slate-400 text-[10px]" textAnchor="middle">
          End-to-end encrypted telemetry · audit logging · HIPAA-aligned architecture
        </text>

        {/* Secondary pipeline: patients to cloud direct (dashed) */}
        <path
          d="M 200 210 Q 480 280 760 210"
          fill="none"
          stroke="#94a3b8"
          strokeWidth="1.2"
          strokeDasharray="4 6"
          opacity="0.6"
        />
        <text x="480" y="302" className="fill-slate-400 text-[9px]" textAnchor="middle">
          Redundant uplink for resilience &amp; latency-aware routing
        </text>
      </svg>
    </div>
  );
}
