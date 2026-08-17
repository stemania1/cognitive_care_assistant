"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { SensorModelsWorkspace } from "./SensorModelsWorkspace";
import { useBodyScrollLock } from "./useBodyScrollLock";

export function SensorModelModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-stretch justify-center sm:items-center sm:p-4" role="presentation">
      <button
        type="button"
        aria-label="Dismiss sensor models overlay"
        className="absolute inset-0 bg-[#030712]/80 backdrop-blur-md"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="sensor-models-title"
        className="relative z-[201] flex h-[100dvh] w-full max-w-[1400px] flex-col overflow-hidden border border-cyan-500/20 bg-[#030712] shadow-[0_24px_80px_rgba(0,0,0,0.65)] sm:h-[min(92dvh,900px)] sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-cyan-500/20 px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-400/90">
              Cognitive Care Assistant
            </p>
            <h2 id="sensor-models-title" className="text-base font-bold tracking-tight text-white sm:text-lg">
              View Sensor Models
            </h2>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Interactive 3D hardware · MyoWare 2.0 · Raspberry Pi &amp; AMG8833
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/12 bg-white/[0.04] px-3 py-2 text-[11px] font-medium text-slate-200 transition hover:border-cyan-500/30 hover:bg-white/[0.07]"
          >
            Close
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 sm:px-5 sm:py-4">
          {/* Unmount viewer when closed is handled by parent not rendering this modal */}
          <SensorModelsWorkspace compact onRequestClose={onClose} />
        </div>

        <p className="shrink-0 border-t border-white/[0.06] px-4 py-2 text-center text-[9px] text-slate-600 sm:text-[10px]">
          Detailed CAD-style placeholders · replace with .glb under /public/models when available · not a
          medical device
        </p>
      </div>
    </div>,
    document.body
  );
}
