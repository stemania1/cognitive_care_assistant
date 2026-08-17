"use client";

import { SENSOR_MODELS, type SensorModelId } from "./catalog";

export function ModelSelector({
  modelId,
  onChange,
}: {
  modelId: SensorModelId;
  onChange: (id: SensorModelId) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Sensor models">
      {SENSOR_MODELS.map((m) => (
        <button
          key={m.id}
          type="button"
          role="tab"
          aria-selected={modelId === m.id}
          onClick={() => onChange(m.id)}
          className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-colors duration-200 sm:px-3 sm:text-xs ${
            modelId === m.id
              ? "border-cyan-400/55 bg-cyan-500/15 text-cyan-50 shadow-[0_0_20px_rgba(34,211,238,0.18)]"
              : "border-white/10 bg-slate-950/80 text-slate-400 hover:border-white/20 hover:text-white"
          }`}
        >
          <span className="sm:hidden">{m.shortLabel}</span>
          <span className="hidden sm:inline">{m.label}</span>
        </button>
      ))}
    </div>
  );
}
