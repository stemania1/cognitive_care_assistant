"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  evidenceBadgeClass,
  evidenceLabel,
  hotspotsForKind,
  MAGNIFICATION_LEVELS,
  PATHOLOGY_COPY,
  type HotspotId,
  type MagnificationLevel,
  type PathologyKind,
} from "./pathologyContent";

const VIEWPORT_H = "min(640px, 72vh)";

const AmyloidMolecularCanvas = dynamic(
  () => import("./AmyloidMolecularCanvas").then((m) => ({ default: m.AmyloidMolecularCanvas })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-black text-[11px] text-slate-400">
        Loading molecular model…
      </div>
    ),
  }
);

const PathologyTissueCanvas = dynamic(
  () => import("./PathologyTissueCanvas").then((m) => ({ default: m.PathologyTissueCanvas })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-[#030712] text-[11px] text-slate-400">
        Loading tissue view…
      </div>
    ),
  }
);

type Props = {
  fromRegion?: string | null;
  fromSignal?: string | null;
};

export function PathologyExplorerClient({ fromRegion, fromSignal }: Props) {
  const [kind, setKind] = useState<PathologyKind>("amyloid");
  const [level, setLevel] = useState<MagnificationLevel>("molecular");
  const [activeHotspot, setActiveHotspot] = useState<HotspotId | null>(null);
  const [hoveredHotspot, setHoveredHotspot] = useState<HotspotId | null>(null);

  const hotspots = useMemo(() => hotspotsForKind(kind), [kind]);
  const previewId = hoveredHotspot ?? activeHotspot;
  const preview = hotspots.find((h) => h.id === previewId) ?? null;

  const contextLine = useMemo(() => {
    if (fromRegion || fromSignal) {
      const parts = [fromRegion, fromSignal].filter(Boolean).join(" · ");
      return `From CCA analysis: ${parts}`;
    }
    return PATHOLOGY_COPY.fromAnalysisDefault;
  }, [fromRegion, fromSignal]);

  const showMolecular = level === "molecular";

  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-hidden bg-[#030712] text-slate-100">
      <div
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_90%_70%_at_50%_-10%,rgba(232,25,168,0.12),transparent),radial-gradient(ellipse_60%_50%_at_100%_30%,rgba(245,208,0,0.06),transparent)]"
        aria-hidden
      />

      <header className="shrink-0 border-b border-white/10 bg-[#030712]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1920px] flex-col gap-3 px-4 py-3 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-fuchsia-300/90">
                Cognitive Care Assistant
              </p>
              <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">{PATHOLOGY_COPY.title}</h1>
              <p className="mt-1 max-w-2xl text-[12px] text-slate-400">{PATHOLOGY_COPY.subtitle}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/dashboard/biomedical#brain-region-mapping"
                className="rounded-lg border border-white/12 bg-white/[0.04] px-3 py-2 text-[11px] font-medium text-slate-200 transition hover:border-fuchsia-400/35 hover:bg-white/[0.07]"
              >
                ← Return to Patient Analysis
              </Link>
              <Link
                href="/dashboard"
                className="rounded-lg border border-white/12 bg-white/[0.04] px-3 py-2 text-[11px] font-medium text-slate-200 transition hover:border-cyan-500/30 hover:bg-white/[0.07]"
              >
                Main dashboard
              </Link>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Mode</span>
            <div className="flex rounded-lg border border-white/10 bg-slate-950/80 p-0.5">
              <Link
                href="/dashboard/biomedical#brain-region-mapping"
                className="rounded-md px-3 py-1.5 text-[11px] font-medium text-slate-400 transition hover:text-slate-200"
              >
                Brain Mapping
                <span className="ml-1.5 hidden text-[9px] text-slate-600 sm:inline">Monitor & analyze</span>
              </Link>
              <span className="rounded-md bg-fuchsia-500/20 px-3 py-1.5 text-[11px] font-medium text-fuchsia-50 shadow-[0_0_16px_rgba(232,25,168,0.2)]">
                Pathology Explorer
                <span className="ml-1.5 hidden text-[9px] text-fuchsia-200/70 sm:inline">Biology context</span>
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[1920px] flex-1 flex-col gap-4 px-4 py-4 sm:px-6 sm:py-5">
        <div className="rounded-xl border border-white/[0.08] bg-[#0a0f18]/90 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Context</p>
          <p className="mt-1 text-[12px] text-slate-300">{contextLine}</p>
          <p className="mt-2 text-[10px] leading-relaxed text-slate-500">{PATHOLOGY_COPY.educationalBadgeNote}</p>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <aside className="flex flex-col gap-4 xl:col-span-3">
            <div className="rounded-2xl border border-white/10 bg-[#080c14] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Pathology</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(
                  [
                    ["amyloid", "Amyloid-β"],
                    ["tau", "Tau"],
                    ["both", "Both"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setKind(id);
                      setActiveHotspot(null);
                      setHoveredHotspot(null);
                    }}
                    className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition ${
                      kind === id
                        ? "border-fuchsia-400/50 bg-fuchsia-500/20 text-fuchsia-50"
                        : "border-white/10 bg-slate-950 text-slate-400 hover:text-white"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#080c14] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Magnification
              </p>
              <ul className="mt-2 space-y-1">
                {MAGNIFICATION_LEVELS.map((item) => {
                  const active = level === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => setLevel(item.id)}
                        className={`flex w-full items-center justify-between rounded-lg border px-2.5 py-2 text-left transition ${
                          active
                            ? "border-fuchsia-400/45 bg-fuchsia-500/15 text-fuchsia-50"
                            : "border-transparent text-slate-400 hover:border-white/10 hover:bg-white/[0.03] hover:text-slate-200"
                        }`}
                      >
                        <span className="text-[11px] font-medium">{item.label}</span>
                        <span className="text-[9px] text-slate-500">{item.hint}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#080c14] p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Scientific hotspot
                </p>
                {preview ? (
                  <span className={`rounded border px-1.5 py-0.5 text-[8px] font-bold tracking-wide ${evidenceBadgeClass(preview.evidence)}`}>
                    {evidenceLabel(preview.evidence)}
                  </span>
                ) : null}
              </div>
              {preview ? (
                <div className="mt-3">
                  <p className="text-[13px] font-semibold text-white">
                    <span className="mr-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/40 text-[10px]">
                      {preview.id}
                    </span>
                    {preview.title}
                  </p>
                  <p className="mt-2 text-[11px] leading-relaxed text-slate-300">{preview.body}</p>
                  {preview.ccaLink ? (
                    <Link
                      href={preview.ccaLink.href}
                      className="mt-3 inline-flex items-center gap-1 rounded-lg border border-cyan-400/35 bg-cyan-500/10 px-3 py-2 text-[11px] font-medium text-cyan-100 transition hover:bg-cyan-500/15"
                    >
                      {preview.ccaLink.label} →
                    </Link>
                  ) : null}
                </div>
              ) : (
                <p className="mt-3 text-[11px] text-slate-500">Hover or click a numbered marker on the model.</p>
              )}
            </div>
          </aside>

          <section className="min-w-0 xl:col-span-9">
            <div
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-black shadow-[0_20px_60px_rgba(0,0,0,0.55)]"
              style={{ height: VIEWPORT_H }}
            >
              {showMolecular ? (
                <AmyloidMolecularCanvas
                  kind={kind}
                  hotspots={hotspots}
                  activeHotspot={activeHotspot}
                  hoveredHotspot={hoveredHotspot}
                  onHoverHotspot={setHoveredHotspot}
                  onSelectHotspot={setActiveHotspot}
                />
              ) : (
                <PathologyTissueCanvas level={level} kind={kind} />
              )}

              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent px-4 pb-3 pt-10">
                <p className="text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-fuchsia-200/80">
                  Drag to rotate · Scroll to zoom · Click numbered hotspots · Model stays still when idle
                </p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
              <div className="max-w-xl text-[10px] leading-relaxed text-slate-500">
                Original procedural reconstruction for CCA education. Not reverse-engineered from third-party
                assets. Not a medical device — not for diagnosis.
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/dashboard/biomedical"
                  className="rounded-lg border border-white/12 px-3 py-2 text-[11px] text-slate-300 transition hover:border-cyan-400/30 hover:text-cyan-100"
                >
                  View related CCA monitoring →
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setLevel("molecular");
                    setActiveHotspot(null);
                    setHoveredHotspot(null);
                  }}
                  className="rounded-lg border border-white/12 px-3 py-2 text-[11px] text-slate-300 transition hover:border-fuchsia-400/30 hover:text-fuchsia-100"
                >
                  Reset view
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-2 rounded-xl border border-white/[0.06] bg-[#080c14]/80 p-4 sm:grid-cols-5">
              {[
                "Continuous monitoring",
                "Change detection",
                "Brain mapping",
                "Risk estimation",
                "Pathology explorer",
              ].map((step, i) => (
                <div key={step} className="flex items-center gap-2 text-[10px] text-slate-400">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-fuchsia-400/30 text-[9px] text-fuchsia-200">
                    {i + 1}
                  </span>
                  <span className={i === 4 ? "font-medium text-fuchsia-100" : ""}>{step}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default PathologyExplorerClient;
