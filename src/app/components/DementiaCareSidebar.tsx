"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DEMENTIA_EDUCATION_DISCLAIMER,
  DEMENTIA_MEDICATION_EDUCATION,
  DEMENTIA_STAGES,
} from "@/constants/dementia-education";

function SidebarBody({
  onCloseMobile,
  onCloseDesktop,
}: {
  onCloseMobile?: () => void;
  onCloseDesktop?: () => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 px-3 py-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Care guide
          </p>
          <p className="text-sm font-medium text-white">Dementia education</p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {onCloseDesktop && (
            <button
              type="button"
              onClick={onCloseDesktop}
              className="hidden rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-white/10 md:inline-block"
            >
              Close
            </button>
          )}
          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-white/10 md:hidden"
            >
              Close
            </button>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        <details open className="group mb-3 rounded-xl border border-white/10 bg-white/[0.04]">
          <summary className="cursor-pointer list-none px-3 py-2.5 text-sm font-semibold text-white outline-none ring-sky-400/40 focus-visible:ring-2 [&::-webkit-details-marker]:hidden">
            <span className="flex items-center justify-between gap-2">
              Stages of dementia
              <span className="text-slate-400 transition group-open:rotate-180">▼</span>
            </span>
          </summary>
          <div className="space-y-2 border-t border-white/10 px-2 pb-3 pt-2">
            {DEMENTIA_STAGES.map((stage) => (
              <details
                key={stage.id}
                className="rounded-lg border border-white/5 bg-black/20"
              >
                <summary className="cursor-pointer list-none px-2.5 py-2 text-xs font-medium text-sky-100 outline-none ring-sky-400/40 focus-visible:ring-2 [&::-webkit-details-marker]:hidden">
                  <span className="flex items-start justify-between gap-2">
                    <span>{stage.title}</span>
                    <span className="shrink-0 text-slate-500">+</span>
                  </span>
                </summary>
                <div className="space-y-2 border-t border-white/5 px-2.5 py-2 text-xs text-slate-300">
                  <p>{stage.summary}</p>
                  <ul className="list-disc space-y-1 pl-4">
                    {stage.bulletins.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                </div>
              </details>
            ))}
          </div>
        </details>

        <details className="group mb-3 rounded-xl border border-white/10 bg-white/[0.04]">
          <summary className="cursor-pointer list-none px-3 py-2.5 text-sm font-semibold text-white outline-none ring-sky-400/40 focus-visible:ring-2 [&::-webkit-details-marker]:hidden">
            <span className="flex items-center justify-between gap-2">
              Medications (overview)
              <span className="text-slate-400 transition group-open:rotate-180">▼</span>
            </span>
          </summary>
          <div className="space-y-2 border-t border-white/10 px-2 pb-3 pt-2">
            {DEMENTIA_MEDICATION_EDUCATION.map((med) => (
              <div
                key={med.category}
                className="rounded-lg border border-white/5 bg-black/20 px-2.5 py-2 text-xs text-slate-300"
              >
                <p className="font-semibold text-sky-100">{med.category}</p>
                <p className="mt-1 text-slate-400">Examples: {med.examples}</p>
                <p className="mt-1.5">{med.role}</p>
                <ul className="mt-1.5 list-disc space-y-1 pl-4">
                  {med.notes.map((n, i) => (
                    <li key={i}>{n}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </details>

        <p className="text-[10px] leading-relaxed text-slate-500">
          {DEMENTIA_EDUCATION_DISCLAIMER}
        </p>
      </div>
    </div>
  );
}

const DESKTOP_RAIL_W = 288;

export function DementiaCareSidebar({
  onLayoutChange,
}: {
  /** Sidebar width in px for companion UI (e.g. profile offset). Does not shift page layout — the rail is fixed/overlaid. */
  onLayoutChange?: (sidebarWidthPx: number) => void;
}) {
  const [isMd, setIsMd] = useState(false);
  /** Desktop rail starts closed; opens only when the user taps “Open guide” / “Guide”. */
  const [desktopRailOpen, setDesktopRailOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const sync = () => {
      const md = mq.matches;
      setIsMd(md);
      if (md) setMobileOpen(false);
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const reportLayout = useCallback(() => {
    if (!onLayoutChange) return;
    if (!isMd) {
      onLayoutChange(0);
      return;
    }
    if (!desktopRailOpen) {
      onLayoutChange(0);
      return;
    }
    onLayoutChange(DESKTOP_RAIL_W);
  }, [isMd, desktopRailOpen, onLayoutChange]);

  useEffect(() => {
    reportLayout();
  }, [reportLayout]);

  return (
    <>
      {/* Mobile: open guide */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed bottom-24 left-3 z-40 flex h-14 items-center gap-2.5 rounded-full border border-white/15 bg-slate-900/90 px-5 text-base font-semibold text-white shadow-lg backdrop-blur-md md:hidden"
        aria-label="Open dementia care guide"
      >
        <span className="text-2xl leading-none" aria-hidden>
          🧠
        </span>
        Guide
      </button>

      {/* Desktop: open guide when rail fully closed (no overlap with profile) */}
      {!desktopRailOpen && (
        <button
          type="button"
          onClick={() => setDesktopRailOpen(true)}
          className="fixed left-3 top-28 z-40 hidden h-14 items-center gap-2.5 rounded-full border border-white/15 bg-slate-900/90 px-5 text-base font-semibold text-white shadow-lg backdrop-blur-md md:flex"
          aria-label="Open dementia care guide"
        >
          <span className="text-2xl leading-none" aria-hidden>
            🧠
          </span>
          Open guide
        </button>
      )}

      {mobileOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[45] bg-black/55 md:hidden"
            aria-label="Close guide overlay"
            onClick={() => setMobileOpen(false)}
          />
          <aside
            className="fixed left-0 top-0 z-50 flex h-screen w-[min(90vw,20rem)] flex-col border-r border-white/15 bg-slate-950/98 text-slate-100 shadow-2xl backdrop-blur-xl md:hidden"
            aria-label="Dementia care guide"
          >
            <SidebarBody onCloseMobile={() => setMobileOpen(false)} />
          </aside>
        </>
      )}

      {/* Desktop rail */}
      {desktopRailOpen && (
        <aside
          className="fixed left-0 top-0 z-40 hidden h-screen w-72 flex-col border-r border-white/15 bg-slate-950/95 text-slate-100 shadow-xl backdrop-blur-xl md:flex"
          aria-label="Dementia care guide sidebar"
        >
          <SidebarBody onCloseDesktop={() => setDesktopRailOpen(false)} />
        </aside>
      )}
    </>
  );
}
