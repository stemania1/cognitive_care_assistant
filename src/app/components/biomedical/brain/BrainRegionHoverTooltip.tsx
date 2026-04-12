"use client";

import type { BrainTooltipModel } from "./brainHoverTooltipModel";

/**
 * Single compact hover annotation (pointer-events none). Position is pre-clamped to the brain panel.
 */
export function BrainRegionHoverTooltip({
  model,
  position,
}: {
  model: BrainTooltipModel;
  position: { left: number; top: number };
}) {
  return (
    <div
      className="pointer-events-none absolute z-[24] max-w-[196px] rounded border border-white/[0.12] bg-[#070c12]/96 px-1.5 py-1 shadow-[0_2px_12px_rgba(0,0,0,0.5)] backdrop-blur-[2px]"
      style={{ left: position.left, top: position.top }}
      role="tooltip"
    >
      <p className="text-[10px] font-semibold leading-tight tracking-tight text-slate-100">{model.regionName}</p>
      <p className="mt-0.5 text-[9px] leading-snug text-slate-400">{model.severityLine}</p>
      <p className="mt-0.5 text-[9px] leading-snug text-slate-300/90">{model.roleLine}</p>
      <p className="mt-0.5 text-[9px] font-medium leading-snug text-cyan-200/85">{model.supportLine}</p>
    </div>
  );
}
