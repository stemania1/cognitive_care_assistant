"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import {
  SENSOR_MODELS,
  maxLayerFor,
  type SensorModelId,
} from "./catalog";
import { ComponentInformationPanel } from "./ComponentInformationPanel";
import { ModelControls } from "./ModelControls";
import { ModelSelector } from "./ModelSelector";

const SensorModelViewer = dynamic(
  () => import("./SensorModelViewer").then((m) => ({ default: m.SensorModelViewer })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-[#020810] text-[11px] text-cyan-200/80">
        Loading 3D viewer…
      </div>
    ),
  }
);

export type SensorModelsWorkspaceProps = {
  compact?: boolean;
  onRequestClose?: () => void;
};

export function SensorModelsWorkspace({ compact, onRequestClose }: SensorModelsWorkspaceProps) {
  const [modelId, setModelId] = useState<SensorModelId>("myoware");
  const [exploded, setExploded] = useState(false);
  const [maxLayer, setMaxLayer] = useState(() => maxLayerFor("myoware"));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isolatedId, setIsolatedId] = useState<string | null>(null);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(() => new Set());
  const [transparentEnclosure, setTransparentEnclosure] = useState(false);
  const [resetToken, setResetToken] = useState(0);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "fallback" | "error">("loading");
  const [loadMessage, setLoadMessage] = useState<string | undefined>();

  const active = SENSOR_MODELS.find((m) => m.id === modelId);

  const onSelect = useCallback((id: string | null) => {
    setSelectedId(id);
    if (id === null) setIsolatedId(null);
  }, []);

  const onLoadState = useCallback(
    (state: "loading" | "ready" | "fallback" | "error", message?: string) => {
      setLoadState(state);
      setLoadMessage(message);
    },
    []
  );

  const switchModel = (id: SensorModelId) => {
    setModelId(id);
    setSelectedId(null);
    setIsolatedId(null);
    setHiddenIds(new Set());
    setMaxLayer(maxLayerFor(id));
    setExploded(false);
    setTransparentEnclosure(false);
    setResetToken((t) => t + 1);
    setLoadState("loading");
  };

  const resetView = () => {
    setExploded(false);
    setMaxLayer(maxLayerFor(modelId));
    setSelectedId(null);
    setIsolatedId(null);
    setHiddenIds(new Set());
    setTransparentEnclosure(false);
    setResetToken((t) => t + 1);
  };

  const toggleHidden = (id: string) => {
    setHiddenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    if (isolatedId === id) setIsolatedId(null);
    if (selectedId === id) setSelectedId(null);
  };

  const isolate = (id: string) => {
    setIsolatedId((prev) => (prev === id ? null : id));
    setSelectedId(id);
    setHiddenIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const viewportH = compact ? "min(52vh, 420px)" : "min(640px, 62vh)";

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 sm:gap-4">
      <div className="flex flex-col gap-2 border-b border-white/[0.08] pb-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            Hardware model
          </p>
          <p className="text-xs text-slate-300 sm:text-sm">{active?.blurb}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ModelSelector modelId={modelId} onChange={switchModel} />
          {onRequestClose ? (
            <button
              type="button"
              onClick={onRequestClose}
              className="rounded-lg border border-white/12 px-3 py-1.5 text-[11px] font-medium text-slate-300 hover:border-cyan-500/30 hover:text-white"
              aria-label="Close sensor model viewer"
            >
              Close
            </button>
          ) : null}
        </div>
      </div>

      {(loadState === "loading" || loadState === "fallback" || loadState === "error") && (
        <div
          className={`rounded-lg border px-3 py-2 text-[11px] ${
            loadState === "error"
              ? "border-rose-500/40 bg-rose-500/10 text-rose-100"
              : loadState === "fallback"
                ? "border-amber-500/35 bg-amber-500/10 text-amber-100"
                : "border-cyan-500/25 bg-cyan-500/10 text-cyan-100"
          }`}
          role="status"
        >
          {loadState === "loading" && "Preparing sensor model…"}
          {loadState === "fallback" &&
            (loadMessage ??
              "CAD file not available yet — showing detailed placeholder geometry. Drop .glb files into /public/models when ready.")}
          {loadState === "error" &&
            (loadMessage ?? "The 3D model failed to load. Try Reset view or switch models.")}
        </div>
      )}
      {loadState === "ready" && loadMessage ? (
        <div
          className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-[11px] text-emerald-100"
          role="status"
        >
          {loadMessage}
        </div>
      ) : null}

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 xl:grid-cols-12 xl:gap-4">
        <div className="flex min-w-0 flex-col gap-3 xl:col-span-8">
          <div
            className="relative isolate w-full overflow-hidden rounded-2xl border border-cyan-500/15 shadow-[0_16px_64px_rgba(0,0,0,0.55)] ring-1 ring-inset ring-white/[0.05]"
            style={{ height: viewportH, backgroundColor: "#020810" }}
          >
            <div className="absolute inset-0 z-0">
              <SensorModelViewer
                modelId={modelId}
                exploded={exploded}
                maxLayer={maxLayer}
                selectedId={selectedId}
                isolatedId={isolatedId}
                hiddenIds={hiddenIds}
                transparentEnclosure={transparentEnclosure}
                resetToken={resetToken}
                onSelect={onSelect}
                onLoadState={onLoadState}
              />
            </div>
            <p className="pointer-events-none absolute bottom-2 left-2 z-10 max-w-[90%] rounded-md border border-white/10 bg-slate-950/75 px-2 py-1 text-[9px] text-slate-400 backdrop-blur-sm sm:bottom-3 sm:left-3 sm:text-[10px]">
              Drag to rotate · pinch/scroll to zoom · two-finger / right-drag to pan
            </p>
          </div>

          <ModelControls
            modelId={modelId}
            exploded={exploded}
            maxLayer={maxLayer}
            transparentEnclosure={transparentEnclosure}
            isolatedId={isolatedId}
            onToggleExploded={() => setExploded((v) => !v)}
            onReset={resetView}
            onMaxLayer={setMaxLayer}
            onToggleTransparent={() => setTransparentEnclosure((v) => !v)}
            onClearIsolate={() => setIsolatedId(null)}
          />
        </div>

        <aside className="min-w-0 xl:col-span-4">
          <ComponentInformationPanel
            modelId={modelId}
            selectedId={selectedId}
            isolatedId={isolatedId}
            hiddenIds={hiddenIds}
            onSelect={onSelect}
            onIsolate={isolate}
            onToggleHidden={toggleHidden}
          />
        </aside>
      </div>
    </div>
  );
}
