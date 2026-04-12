"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { readCognitiveSignalsFromApp, type CognitiveSignals } from "@/lib/cognitiveSignals";
import {
  activeMappingLabel,
  buildClinicalPanelSections,
  type SeverityTier,
} from "./cognitiveInterpretation";
import { AlertsPanel } from "./AlertsPanel";
import { CognitiveStateBadge } from "./CognitiveStateBadge";
import { EmgWaveformPanel } from "./EmgWaveformPanel";
import { HeartRateGauge } from "./HeartRateGauge";
import { ThermalHeatmapPanel } from "./ThermalHeatmapPanel";
import { useBiomedicalTelemetry } from "./useBiomedicalTelemetry";
import { BrainRegionHoverTooltip } from "./brain/BrainRegionHoverTooltip";
import { buildBrainTooltipModel } from "./brain/brainHoverTooltipModel";
import type { BrainRegionId, CognitiveDomain } from "./brain/regionConfig";

/** Single brain viewport: fixed height band so the WebGL canvas never drives layout overflow or full-viewport assumptions. */
const BRAIN_PANEL_HEIGHT = "min(600px, 65vh)";

const BRAIN_HERO_TITLE = "Active Brain Mapping";
const BRAIN_HERO_SUB = "Multimodal Cognitive Analysis";

const BrainCanvas = dynamic(
  () => import("./brain/BrainScene"),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex w-full max-w-full items-center justify-center rounded-2xl border border-cyan-500/15 bg-[#020810] text-[10px] text-cyan-200/80"
        style={{ height: BRAIN_PANEL_HEIGHT, backgroundColor: "#020810" }}
      >
        Loading 3D brain…
      </div>
    ),
  }
);

const DOMAIN_TABS: { id: CognitiveDomain; label: string; href?: string }[] = [
  { id: "idle", label: "Monitor" },
  { id: "memory", label: "Memory", href: "/memory-games" },
  { id: "speech", label: "Speech & language", href: "/daily-questions" },
  { id: "cognitive", label: "Cognitive tests", href: "/assessments" },
];

function riskBadgeClass(tier: "Low" | "Moderate" | "Elevated"): string {
  if (tier === "Elevated") return "border-rose-500/40 bg-rose-500/15 text-rose-200";
  if (tier === "Moderate") return "border-amber-500/40 bg-amber-500/12 text-amber-100";
  return "border-emerald-500/35 bg-emerald-500/10 text-emerald-200";
}

function trendBadgeClass(t: "Improving" | "Stable" | "Declining"): string {
  if (t === "Improving") return "border-emerald-500/35 text-emerald-200";
  if (t === "Declining") return "border-orange-500/35 text-orange-200";
  return "border-slate-500/35 text-slate-300";
}

function severityTierClass(sev: SeverityTier): string {
  if (sev === "Elevated") return "border-rose-500/45 bg-rose-500/12 text-rose-200";
  if (sev === "Moderate") return "border-amber-500/45 bg-amber-500/12 text-amber-100";
  return "border-sky-500/40 bg-sky-500/10 text-sky-200";
}

export function BiomedicalDashboardClient() {
  const {
    emgSeries,
    heartRate,
    heartRateVariability,
    thermal,
    brainActivity,
    memoryPerformance,
    speechClarity,
    cognitiveState,
    alerts,
    dismissAlert,
  } = useBiomedicalTelemetry();

  const [domain, setDomain] = useState<CognitiveDomain>("idle");
  /** Locked by clicking a weakened region on the brain; drives Clinical intelligence detail ordering. */
  const [selectedRegionId, setSelectedRegionId] = useState<BrainRegionId | null>(null);
  /** Transient hover over a weakened region (brain canvas only; no persistent labels). */
  const [brainHover, setBrainHover] = useState<{
    id: BrainRegionId;
    clientX: number;
    clientY: number;
  } | null>(null);
  const brainViewportRef = useRef<HTMLDivElement | null>(null);
  const [brainTipPos, setBrainTipPos] = useState<{ left: number; top: number } | null>(null);
  const [cognitiveSignals, setCognitiveSignals] = useState<CognitiveSignals | null>(null);

  useEffect(() => {
    setCognitiveSignals(readCognitiveSignalsFromApp());
  }, []);

  const clinical = useMemo(
    () =>
      buildClinicalPanelSections(
        domain,
        selectedRegionId,
        cognitiveSignals,
        memoryPerformance,
        speechClarity,
        brainActivity
      ),
    [selectedRegionId, domain, cognitiveSignals, memoryPerformance, speechClarity, brainActivity]
  );

  const brainTooltipModel = useMemo(() => {
    if (!brainHover) return null;
    return buildBrainTooltipModel(
      brainHover.id,
      cognitiveSignals,
      memoryPerformance,
      speechClarity,
      brainActivity
    );
  }, [brainHover, cognitiveSignals, memoryPerformance, speechClarity, brainActivity]);

  useLayoutEffect(() => {
    if (!brainHover || !brainTooltipModel || !brainViewportRef.current) {
      setBrainTipPos(null);
      return;
    }
    const el = brainViewportRef.current;
    const rect = el.getBoundingClientRect();
    const px = brainHover.clientX - rect.left;
    const py = brainHover.clientY - rect.top;
    const tipW = 196;
    const tipH = 88;
    const off = 12;
    const pad = 6;
    let left = px + off;
    let top = py + off;
    if (left + tipW > rect.width - pad) left = rect.width - tipW - pad;
    if (top + tipH > rect.height - pad) top = rect.height - tipH - pad;
    if (left < pad) left = pad;
    if (top < pad) top = pad;
    setBrainTipPos({ left, top });
  }, [brainHover, brainTooltipModel]);

  useEffect(() => {
    if (selectedRegionId === null) return;
    const onDocMouseDown = (e: MouseEvent) => {
      const t = e.target as Node | null;
      if (t && brainViewportRef.current?.contains(t)) return;
      setSelectedRegionId(null);
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [selectedRegionId]);

  const mappingTitle = useMemo(() => activeMappingLabel(domain), [domain]);

  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-hidden bg-[#030712] text-slate-100">
      <div
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_100%_80%_at_50%_-15%,rgba(34,211,238,0.1),transparent),radial-gradient(ellipse_70%_50%_at_100%_40%,rgba(16,185,129,0.06),transparent)] bg-cover bg-center bg-no-repeat"
        aria-hidden
      />

      <header className="shrink-0 border-b border-cyan-500/20 bg-[#030712]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1920px] flex-col gap-2.5 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-400/90">
              Cognitive Care Assistant
            </p>
            <h1 className="text-lg font-bold tracking-tight text-white sm:text-xl">
              Neurocognitive Monitoring System
            </h1>
            <p className="mt-0.5 text-[11px] text-slate-500">Multimodal telemetry · simulated when sensors offline</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            <CognitiveStateBadge state={cognitiveState} />
            <Link
              href="/brainnet"
              className="rounded-lg border border-white/12 bg-white/[0.04] px-3 py-2 text-[11px] font-medium text-slate-200 shadow-sm transition hover:border-cyan-500/30 hover:bg-white/[0.07]"
            >
              BrainNet
            </Link>
            <Link
              href="/dashboard"
              className="rounded-lg border border-white/12 bg-white/[0.04] px-3 py-2 text-[11px] font-medium text-slate-200 shadow-sm transition hover:border-cyan-500/30 hover:bg-white/[0.07]"
            >
              Main dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto flex min-h-0 w-full max-w-[1920px] flex-1 flex-col gap-6 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
        <section className="grid min-h-0 grid-cols-1 gap-6 xl:grid-cols-12 xl:items-stretch xl:gap-8">
          <div className="flex min-h-0 min-w-0 max-w-full flex-col gap-4 border-cyan-500/10 xl:col-span-9 xl:border-r xl:border-white/[0.06] xl:pr-8">
            <div className="space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-400/90">{BRAIN_HERO_TITLE}</p>
              <p className="text-sm font-medium tracking-tight text-slate-100">{BRAIN_HERO_SUB}</p>
            </div>

            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-white/[0.08] pb-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Mapping mode</p>
              <div className="flex flex-wrap gap-1.5">
                {DOMAIN_TABS.map((tab) => (
                  <div key={tab.id} className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setDomain(tab.id)}
                      className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-colors duration-200 ${
                        domain === tab.id
                          ? "border-cyan-400/55 bg-cyan-500/15 text-cyan-50 shadow-[0_0_20px_rgba(34,211,238,0.18)]"
                          : "border-white/10 bg-slate-950/80 text-slate-400 hover:border-white/20 hover:text-white"
                      }`}
                    >
                      {tab.label}
                    </button>
                    {tab.href && (
                      <Link
                        href={tab.href}
                        className="text-[10px] text-slate-500 underline-offset-2 hover:text-cyan-300"
                      >
                        open
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-[12px] font-medium tracking-wide text-cyan-200/95">{mappingTitle}</p>
              <p className="line-clamp-2 text-[10px] leading-relaxed text-slate-500">{clinical.predictiveInsight}</p>
            </div>

            <div
              className="brain-viewport relative isolate z-0 w-full max-w-full overflow-hidden rounded-2xl border border-cyan-500/15 shadow-[0_16px_64px_rgba(0,0,0,0.55)] ring-1 ring-inset ring-white/[0.05]"
              style={{ height: BRAIN_PANEL_HEIGHT, backgroundColor: "#020810" }}
            >
              <div
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_75%_65%_at_50%_38%,rgba(30,58,95,0.28)_0%,transparent_58%)] bg-no-repeat [background-size:100%_100%]"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-[radial-gradient(ellipse_90%_85%_at_50%_100%,rgba(34,211,238,0.1),transparent_72%)] bg-no-repeat [background-size:100%_120%] [background-position:center_bottom]"
                aria-hidden
              />
              <div
                ref={brainViewportRef}
                className="absolute inset-0 min-h-0 min-w-0 overflow-hidden bg-[#020810]"
              >
                <BrainCanvas
                  domain={domain}
                  memoryPerformance={memoryPerformance}
                  speechClarity={speechClarity}
                  brainActivity={brainActivity}
                  cognitiveSignals={cognitiveSignals}
                  onSelectRegion={setSelectedRegionId}
                  onWeakRegionPointer={setBrainHover}
                />
                {brainTooltipModel && brainTipPos ? (
                  <BrainRegionHoverTooltip model={brainTooltipModel} position={brainTipPos} />
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-white/[0.06] pt-3 text-[10px] text-slate-500">
              <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-slate-400">
                <span>
                  Mem{" "}
                  {cognitiveSignals?.hasMemoryStats ? (
                    <span className="text-slate-300">{(cognitiveSignals.memoryStrength * 100).toFixed(0)}%</span>
                  ) : (
                    <span className="text-slate-300">
                      {(memoryPerformance * 100).toFixed(0)}% <span className="text-slate-600">sim</span>
                    </span>
                  )}
                </span>
                <span>
                  Lang{" "}
                  {cognitiveSignals?.hasDailyAnswers ? (
                    <span className="text-slate-300">{(cognitiveSignals.languageConcern * 100).toFixed(0)}%</span>
                  ) : (
                    <span className="text-slate-300">
                      {(speechClarity * 100).toFixed(0)}% <span className="text-slate-600">sim</span>
                    </span>
                  )}
                </span>
                <span>
                  Exec{" "}
                  {cognitiveSignals ? (
                    <span className="text-slate-300">{(cognitiveSignals.executiveConcern * 100).toFixed(0)}%</span>
                  ) : (
                    <span className="text-slate-300">
                      {(brainActivity * 100).toFixed(0)}% <span className="text-slate-600">sim</span>
                    </span>
                  )}
                </span>
              </div>
              <span className="text-[9px] text-slate-600">
                Key: <span className="text-sky-400">mild</span> · <span className="text-amber-300">moderate</span> ·{" "}
                <span className="text-rose-400">elevated</span>
              </span>
            </div>
          </div>

          <aside className="flex min-h-0 w-full min-w-0 flex-col gap-6 xl:col-span-3">
            <div className="rounded-2xl border border-cyan-500/20 bg-slate-950/95 p-4 shadow-[0_16px_48px_rgba(0,0,0,0.45)]">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.08] pb-3">
                <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-300">Clinical intelligence</h2>
                <span className="font-mono text-[11px] text-slate-400">
                  <span className="text-slate-500">Confidence</span>{" "}
                  <span className="text-cyan-200">{clinical.modelConfidence}%</span>
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <span
                  className={`rounded-lg border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${riskBadgeClass(clinical.riskLevel)}`}
                >
                  Risk {clinical.riskLevel}
                </span>
                <span
                  className={`rounded-lg border bg-slate-950/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${trendBadgeClass(clinical.trend)}`}
                >
                  {clinical.trend}
                </span>
              </div>

              <div className="mt-5 space-y-6">
                <section>
                  <h3 className="text-[12px] font-bold uppercase tracking-[0.1em] text-slate-300">Active regions</h3>
                  <p className="mt-1 text-[10px] text-slate-500">{clinical.activeRegionMappingTitle}</p>
                  <div className="mt-3 max-h-[min(36vh,280px)] space-y-2 overflow-y-auto pr-1">
                    {clinical.regionInsights.map((ins) => (
                      <div
                        key={ins.id}
                        className="rounded-lg border border-white/[0.06] bg-[#070d16] p-2.5"
                        style={{ borderLeftWidth: 3, borderLeftColor: ins.concernColorRgb }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-[11px] font-semibold leading-tight text-slate-100">{ins.regionName}</p>
                          <span
                            className={`shrink-0 rounded border px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide ${severityTierClass(ins.severity)}`}
                          >
                            {ins.severity}
                          </span>
                        </div>
                        <p className="mt-1 line-clamp-2 text-[10px] leading-snug text-slate-400">{ins.detectedWeakness}</p>
                        <p className="mt-1.5 truncate font-mono text-[8px] text-cyan-200/65" title={ins.triggerSource}>
                          {ins.triggerSource}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-xl border border-cyan-400/30 bg-gradient-to-b from-cyan-500/[0.14] to-cyan-500/[0.04] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.07)]">
                  <h3 className="text-[13px] font-bold uppercase tracking-[0.12em] text-cyan-100">What this means</h3>
                  <p className="mt-2.5 text-[13px] leading-relaxed text-slate-50">{clinical.whatThisMeans}</p>
                </section>

                <section className="rounded-xl border border-white/[0.08] bg-[#080c14] p-4">
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Interpretation</h3>
                  <p className="mt-2 line-clamp-4 text-[11px] leading-relaxed text-slate-300">{clinical.interpretationSummary}</p>
                  <p className="mt-3 text-[9px] leading-relaxed text-slate-500">{clinical.systemNotes}</p>
                </section>
              </div>
            </div>

            <div className="rounded-2xl border border-amber-500/20 bg-[#0a0d12] p-4 shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-amber-200/90">Alerts</h3>
              <div className="mt-3 max-h-[200px] overflow-y-auto">
                <AlertsPanel alerts={alerts} onDismiss={dismissAlert} />
              </div>
            </div>

            <p className="text-center text-[9px] text-slate-600 xl:text-left">Not a medical device · not for diagnosis.</p>
          </aside>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-3 md:items-stretch">
          <TelemetryPanel title="Surface EMG" subtitle="Envelope · sim" badge="Live sim">
            <EmgWaveformPanel series={emgSeries} />
          </TelemetryPanel>
          <TelemetryPanel title="Cardiac rhythm" subtitle="HR · variability (sim)" badge="Sim">
            <HeartRateGauge bpm={heartRate} hrv={heartRateVariability} />
          </TelemetryPanel>
          <TelemetryPanel title="Thermal field" subtitle="8×8 AMG8833-class" badge="Sim">
            <ThermalHeatmapPanel grid={thermal} />
          </TelemetryPanel>
        </section>
      </main>
    </div>
  );
}

function TelemetryPanel({
  title,
  subtitle,
  badge,
  children,
}: {
  title: string;
  subtitle: string;
  badge: string;
  children: ReactNode;
}) {
  return (
    <div className="flex h-full min-h-[228px] flex-col rounded-2xl border border-cyan-500/18 bg-[#050b14]/98 p-4 shadow-[inset_0_1px_0_rgba(34,211,238,0.08),0_10px_36px_rgba(0,0,0,0.38)]">
      <div className="mb-3 flex min-h-[44px] items-start justify-between gap-2">
        <div>
          <h2 className="text-[12px] font-bold uppercase tracking-[0.12em] text-cyan-200">{title}</h2>
          <p className="mt-0.5 text-[10px] text-slate-500">{subtitle}</p>
        </div>
        <span className="shrink-0 rounded-md border border-cyan-500/25 bg-cyan-500/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-cyan-300/90">
          {badge}
        </span>
      </div>
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}
