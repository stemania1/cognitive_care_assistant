"use client";

import { motion } from "framer-motion";
import { siteById, type PhosphoSiteId } from "./phosphoSiteData";

export function BiomarkerHoverTooltip({
  siteId,
  position,
}: {
  siteId: PhosphoSiteId;
  position: { left: number; top: number };
}) {
  const site = siteById(siteId);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.12 }}
      className="pointer-events-none absolute z-[30] max-w-[210px] rounded border border-white/[0.09] bg-[#060a10]/96 px-2 py-1.5 shadow-[0_2px_10px_rgba(0,0,0,0.55)] backdrop-blur-[2px]"
      style={{ left: position.left, top: position.top }}
      role="tooltip"
    >
      <p className="text-[10px] font-semibold leading-tight text-slate-100">{site.biomarkerLabel}</p>
      <p className="mt-1 text-[9px] leading-snug text-slate-400">
        <span className="text-slate-500">Region: </span>
        {site.brainRegion}
      </p>
      <p className="mt-0.5 text-[9px] leading-snug text-slate-400">
        <span className="text-slate-500">Function: </span>
        {site.hoverFunction}
      </p>
      <p className="mt-0.5 text-[9px] leading-snug text-slate-400">
        <span className="text-slate-500">Clinical note: </span>
        {site.hoverClinicalNote}
      </p>
    </motion.div>
  );
}
