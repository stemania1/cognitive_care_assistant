"use client";

import { SENSOR_MODELS, type SensorModelId } from "./catalog";

export function ModelControls({
  modelId,
  exploded,
  maxLayer,
  transparentEnclosure,
  isolatedId,
  onToggleExploded,
  onReset,
  onMaxLayer,
  onToggleTransparent,
  onClearIsolate,
}: {
  modelId: SensorModelId;
  exploded: boolean;
  maxLayer: number;
  transparentEnclosure: boolean;
  isolatedId: string | null;
  onToggleExploded: () => void;
  onReset: () => void;
  onMaxLayer: (n: number) => void;
  onToggleTransparent: () => void;
  onClearIsolate: () => void;
}) {
  const meta = SENSOR_MODELS.find((m) => m.id === modelId);
  const layerMax = (meta?.layers.length ?? 1) - 1;
  const layerLabel = meta?.layers[maxLayer] ?? "Layer";

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-white/[0.08] bg-slate-950/60 p-3 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onToggleExploded}
          className={`rounded-lg border px-3 py-1.5 text-[11px] font-medium transition ${
            exploded
              ? "border-cyan-400/50 bg-cyan-500/15 text-cyan-50"
              : "border-white/12 text-slate-300 hover:border-white/25"
          }`}
        >
          {exploded ? "Assembled" : "Exploded view"}
        </button>
        <button
          type="button"
          onClick={onToggleTransparent}
          className={`rounded-lg border px-3 py-1.5 text-[11px] font-medium transition ${
            transparentEnclosure
              ? "border-cyan-400/50 bg-cyan-500/15 text-cyan-50"
              : "border-white/12 text-slate-300 hover:border-white/25"
          }`}
        >
          Transparent {modelId === "myoware" ? "PCB" : "shell"}
        </button>
        <button
          type="button"
          onClick={onReset}
          className="rounded-lg border border-white/12 px-3 py-1.5 text-[11px] font-medium text-slate-300 transition hover:border-cyan-500/30 hover:text-white"
        >
          Reset view
        </button>
        {isolatedId ? (
          <button
            type="button"
            onClick={onClearIsolate}
            className="rounded-lg border border-amber-500/35 bg-amber-500/10 px-3 py-1.5 text-[11px] font-medium text-amber-100"
          >
            Exit isolate
          </button>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1 sm:max-w-sm sm:ml-auto">
        <div className="flex items-center justify-between gap-2">
          <label
            htmlFor="sensor-layer-slider"
            className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500"
          >
            Examine by layer
          </label>
          <span className="truncate text-[10px] text-cyan-300/90">{layerLabel}</span>
        </div>
        <input
          id="sensor-layer-slider"
          type="range"
          min={0}
          max={layerMax}
          step={1}
          value={Math.min(maxLayer, layerMax)}
          onChange={(e) => onMaxLayer(Number(e.target.value))}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-slate-800 accent-cyan-400"
        />
      </div>
    </div>
  );
}
