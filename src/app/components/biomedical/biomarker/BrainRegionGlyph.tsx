"use client";

/**
 * Minimal lateral brain outline with a single focal marker (not a full anatomical diagram).
 */
export function BrainRegionGlyph({ nx, ny }: { nx: number; ny: number }) {
  const px = 12 + nx * 24;
  const py = 8 + ny * 22;
  return (
    <svg
      viewBox="0 0 48 40"
      className="h-10 w-12 shrink-0 text-slate-500"
      aria-hidden
    >
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth={0.9}
        strokeLinejoin="round"
        d="M24 4c-6 0-11 4-12 10-.8 5 1 9 4 12-2 2-3 5-2 8 1 3 4 5 8 5h4c4 0 7-2 8-5 1-3 0-6-2-8 3-3 4.8-7 4-12-1-6-6-10-12-10z"
      />
      <circle cx={px} cy={py} r={2.2} fill="currentColor" className="text-indigo-400/90" opacity={0.85} />
      <circle cx={px} cy={py} r={4} fill="none" stroke="currentColor" className="text-indigo-400/50" strokeWidth={0.5} opacity={0.7} />
    </svg>
  );
}
