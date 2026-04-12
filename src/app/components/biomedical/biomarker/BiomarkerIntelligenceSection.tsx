"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { motion } from "framer-motion";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { BiomarkerHoverTooltip } from "./BiomarkerHoverTooltip";
import { BrainRegionGlyph } from "./BrainRegionGlyph";
import { siteById, type PhosphoSiteId } from "./phosphoSiteData";
import type { BiomarkerMode } from "./PTauProteinCanvas";

const PANEL_H = "min(320px, 36vh)";

const PTauCanvas = dynamic(
  () => import("./PTauProteinCanvas").then((m) => ({ default: m.PTauProteinCanvas })),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex w-full items-center justify-center border border-indigo-500/15 bg-[#05080f] font-mono text-[10px] text-slate-500"
        style={{ height: PANEL_H }}
      >
        Loading structure…
      </div>
    ),
  }
);

type RiskLabel = "Low" | "Moderate" | "High";

function riskFromState(mode: BiomarkerMode, progression: number): RiskLabel {
  if (mode === "healthy") {
    return progression < 0.58 ? "Low" : "Moderate";
  }
  if (progression < 0.38) return "Moderate";
  if (progression < 0.72) return "Moderate";
  return "High";
}

function riskBadgeClass(tier: RiskLabel): string {
  if (tier === "High") return "border-rose-500/35 bg-rose-500/10 text-rose-200";
  if (tier === "Moderate") return "border-amber-500/35 bg-amber-500/10 text-amber-100";
  return "border-indigo-400/35 bg-indigo-500/10 text-indigo-100";
}

function computeMetrics(mode: BiomarkerMode, progression: number) {
  const p = progression;
  const ptau217 =
    mode === "healthy" ? 0.06 + p * 0.05 + Math.sin(p * 4.1) * 0.01 : 0.28 + p * 0.52 + Math.sin(p * 3) * 0.04;
  const ptau181 =
    mode === "healthy" ? 0.05 + p * 0.04 + Math.cos(p * 3.8) * 0.008 : 0.19 + p * 0.41 + Math.cos(p * 2.7) * 0.03;
  const confidence =
    mode === "healthy" ? Math.round(84 + p * 8) : Math.round(72 + (1 - p * 0.15) * 18);
  return {
    ptau217: Math.max(0.02, ptau217),
    ptau181: Math.max(0.02, ptau181),
    confidence: Math.min(96, Math.max(68, confidence)),
  };
}

function interpretationForRisk(risk: RiskLabel): string {
  switch (risk) {
    case "Low":
      return "Phosphorylated tau remains within low-risk range. No strong correlation with near-term neurodegenerative progression.";
    case "Moderate":
      return "Elevated phosphorylated tau suggests early neurodegenerative activity. Pattern may correlate with memory-related decline.";
    case "High":
      return "Phosphorylated tau elevation indicates increased neurodegenerative risk in this modeled context. Pattern may correlate with regional burden; supports further clinical evaluation.";
  }
}

function TrendSparkline({ mode, progression }: { mode: BiomarkerMode; progression: number }) {
  const pts = useMemo(() => {
    const n = 7;
    const out: { x: number; y: number }[] = [];
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const base = mode === "healthy" ? 0.22 + t * 0.12 : 0.35 + t * 0.45 + progression * 0.2;
      const wobble = Math.sin(t * Math.PI * 2.5 + progression * 3) * 0.06;
      const v = Math.min(1, Math.max(0, base + wobble));
      out.push({ x: (i / (n - 1)) * 100, y: 100 - v * 100 });
    }
    return out;
  }, [mode, progression]);

  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const stroke = mode === "healthy" ? "rgba(129, 140, 248, 0.75)" : "rgba(234, 179, 8, 0.75)";

  return (
    <svg viewBox="0 0 100 100" className="h-11 w-full" aria-hidden>
      <line x1="0" y1="78" x2="100" y2="78" stroke="rgba(148,163,184,0.08)" strokeWidth="0.35" />
      <path d={d} fill="none" stroke={stroke} strokeWidth="0.85" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function BiomarkerIntelligenceSection() {
  const [mode, setMode] = useState<BiomarkerMode>("healthy");
  const [progression, setProgression] = useState(0.35);
  const [selectedSiteId, setSelectedSiteId] = useState<PhosphoSiteId | null>(null);
  const [hover, setHover] = useState<null | { id: PhosphoSiteId; clientX: number; clientY: number }>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [tipPos, setTipPos] = useState<{ left: number; top: number } | null>(null);

  const metrics = useMemo(() => computeMetrics(mode, progression), [mode, progression]);
  const risk = useMemo(() => riskFromState(mode, progression), [mode, progression]);
  const aiText = useMemo(() => interpretationForRisk(risk), [risk]);

  useLayoutEffect(() => {
    if (!hover || !viewportRef.current) {
      setTipPos(null);
      return;
    }
    const el = viewportRef.current;
    const rect = el.getBoundingClientRect();
    const tipW = 212;
    const tipH = 92;
    const off = 10;
    const pad = 6;
    let left = hover.clientX - rect.left + off;
    let top = hover.clientY - rect.top + off;
    if (left + tipW > rect.width - pad) left = rect.width - tipW - pad;
    if (top + tipH > rect.height - pad) top = rect.height - tipH - pad;
    if (left < pad) left = pad;
    if (top < pad) top = pad;
    setTipPos({ left, top });
  }, [hover]);

  const selectedDetail = selectedSiteId ? siteById(selectedSiteId) : null;

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="grid grid-cols-1 gap-4 border-b border-white/[0.06] pb-6 lg:grid-cols-12 lg:gap-6"
      aria-labelledby="biomarker-intelligence-heading"
      id="biomarker-intelligence"
    >
      <div className="lg:col-span-12">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2
              id="biomarker-intelligence-heading"
              className="text-[10px] font-semibold uppercase tracking-[0.2em] text-indigo-300/90"
            >
              Biomarker Intelligence
            </h2>
            <p className="mt-1 text-[11px] leading-snug text-slate-500">
              Phosphorylated tau epitope mapping · demonstration visualization
            </p>
          </div>
          <p className="max-w-md text-right text-[10px] leading-relaxed text-slate-600">
            Biomarker patterns can be reviewed alongside cognitive, physiologic, and behavioral signals.
          </p>
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-3 lg:col-span-7">
        <div
          ref={viewportRef}
          className="relative overflow-hidden rounded-xl border border-indigo-500/15 bg-[#05080f] shadow-[0_12px_40px_rgba(0,0,0,0.45)] ring-1 ring-inset ring-white/[0.04]"
          style={{ height: PANEL_H }}
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_45%,rgba(79,70,229,0.12),transparent_60%)]" />
          <PTauCanvas
            mode={mode}
            progression={progression}
            selectedSiteId={selectedSiteId}
            onSelectSite={setSelectedSiteId}
            onHoverSite={setHover}
          />
          {hover && tipPos ? <BiomarkerHoverTooltip siteId={hover.id} position={tipPos} /> : null}
        </div>

        <div className="rounded-lg border border-white/[0.08] bg-[#070b12]/95 px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-sm">
          {selectedDetail ? (
            <div className="flex gap-3">
              <BrainRegionGlyph nx={selectedDetail.brainGlyph.nx} ny={selectedDetail.brainGlyph.ny} />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  <div>
                    <p className="text-[9px] font-medium uppercase tracking-[0.14em] text-slate-500">Biomarker site</p>
                    <p className="text-[11px] font-semibold text-slate-100">{selectedDetail.biomarkerLabel}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-medium uppercase tracking-[0.14em] text-slate-500">Brain region</p>
                    <p className="text-[11px] text-slate-200">{selectedDetail.brainRegion}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-[9px] font-medium uppercase tracking-[0.14em] text-slate-500">Function</p>
                    <p className="text-[11px] leading-snug text-slate-300">{selectedDetail.coreFunction}</p>
                  </div>
                  <div className="sm:col-span-2 border-t border-white/[0.06] pt-2">
                    <p className="text-[9px] font-medium uppercase tracking-[0.14em] text-slate-500">Clinical meaning</p>
                    <p className="text-[11px] leading-relaxed text-slate-400">{selectedDetail.clinicalMeaning}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-[10px] leading-relaxed text-slate-600">
              Select a phosphorylation site to view molecular and clinical context.
            </p>
          )}
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-3 lg:col-span-5">
        <div className="rounded-xl border border-indigo-500/15 bg-[#060a12] p-3 shadow-[0_8px_32px_rgba(0,0,0,0.35)] ring-1 ring-inset ring-white/[0.04]">
          <div className="border-b border-white/[0.06] pb-3">
            <p className="text-[9px] font-medium uppercase tracking-[0.18em] text-slate-500">p-tau217</p>
            <p className="mt-1 font-mono text-[22px] font-semibold leading-none tabular-nums tracking-tight text-slate-50">
              {metrics.ptau217.toFixed(2)}
              <span className="ml-1.5 text-[11px] font-normal text-slate-500">pg/mL</span>
            </p>
          </div>

          <div className="mt-3 border-b border-white/[0.06] pb-3">
            <p className="text-[9px] font-medium uppercase tracking-[0.18em] text-slate-500">p-tau181</p>
            <p className="mt-1 font-mono text-[14px] font-medium tabular-nums text-slate-300">
              {metrics.ptau181.toFixed(2)}
              <span className="ml-1.5 text-[10px] font-normal text-slate-500">pg/mL</span>
            </p>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className={`rounded border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${riskBadgeClass(risk)}`}>
              Risk {risk}
            </span>
            <span className="rounded border border-white/[0.08] bg-[#05080f] px-2 py-0.5 font-mono text-[10px] text-slate-300">
              Confidence {metrics.confidence}%
            </span>
          </div>

          <div className="mt-4">
            <p className="text-[9px] font-medium uppercase tracking-[0.16em] text-slate-500">12-week trend</p>
            <TrendSparkline mode={mode} progression={progression} />
          </div>

          <div className="mt-3 border-t border-white/[0.06] pt-3">
            <p className="text-[9px] font-medium uppercase tracking-[0.16em] text-slate-500">AI interpretation</p>
            <p className="mt-1.5 text-[10px] leading-relaxed text-slate-500">{aiText}</p>
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-[#05080f] p-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[9px] font-medium uppercase tracking-[0.16em] text-slate-500">Presentation</p>
            <div className="flex rounded-md border border-white/[0.1] p-0.5">
              <button
                type="button"
                onClick={() => {
                  setMode("healthy");
                  setSelectedSiteId(null);
                }}
                className={`rounded px-2.5 py-1 text-[10px] font-medium transition-colors duration-150 ${
                  mode === "healthy"
                    ? "bg-indigo-500/20 text-indigo-100"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                Healthy
              </button>
              <button
                type="button"
                onClick={() => setMode("elevated")}
                className={`rounded px-2.5 py-1 text-[10px] font-medium transition-colors duration-150 ${
                  mode === "elevated"
                    ? "bg-amber-500/15 text-amber-100"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                Elevated
              </button>
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="bio-progression" className="text-[9px] font-medium uppercase tracking-[0.16em] text-slate-500">
                Progression
              </label>
              <span className="font-mono text-[10px] text-slate-500">{(progression * 100).toFixed(0)}%</span>
            </div>
            <input
              id="bio-progression"
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={progression}
              onChange={(e) => setProgression(parseFloat(e.target.value))}
              className="mt-1.5 h-1 w-full cursor-pointer appearance-none rounded-full bg-slate-800 accent-indigo-400"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-white/[0.06] pt-2 text-[10px] text-slate-500">
          <Link href="#brain-region-mapping" className="text-indigo-300/90 underline-offset-2 hover:text-indigo-200 hover:underline">
            Brain region mapping
          </Link>
          <Link href="/ai-synopsis" className="text-indigo-300/90 underline-offset-2 hover:text-indigo-200 hover:underline">
            AI synopsis
          </Link>
          <Link href="#multimodal-telemetry" className="text-indigo-300/90 underline-offset-2 hover:text-indigo-200 hover:underline">
            Multimodal biomarker interpretation
          </Link>
        </div>
      </div>
    </motion.section>
  );
}
