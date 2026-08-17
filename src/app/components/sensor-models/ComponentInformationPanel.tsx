"use client";

import { getPart, partsForModel, type SensorModelId } from "./catalog";

export function ComponentInformationPanel({
  modelId,
  selectedId,
  isolatedId,
  hiddenIds,
  onSelect,
  onIsolate,
  onToggleHidden,
}: {
  modelId: SensorModelId;
  selectedId: string | null;
  isolatedId: string | null;
  hiddenIds: Set<string>;
  onSelect: (id: string | null) => void;
  onIsolate: (id: string) => void;
  onToggleHidden: (id: string) => void;
}) {
  const parts = partsForModel(modelId);
  const selected = selectedId ? getPart(modelId, selectedId) : null;

  return (
    <div className="flex min-h-0 flex-col gap-3">
      <div className="rounded-2xl border border-cyan-500/15 bg-slate-950/60 p-3 sm:p-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-400/90">
          Component detail
        </p>
        {selected ? (
          <div className="mt-2.5 space-y-2.5">
            <h3 className="text-sm font-semibold text-white sm:text-base">{selected.name}</h3>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-400/80">
              {selected.category}
            </p>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Purpose
              </p>
              <p className="mt-1 text-xs leading-relaxed text-slate-300 sm:text-sm">
                {selected.purpose}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Use in Cognitive Care Assistant
              </p>
              <p className="mt-1 text-xs leading-relaxed text-slate-300 sm:text-sm">
                {selected.ccaUsage}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => onIsolate(selected.id)}
                className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1.5 text-[11px] font-medium text-cyan-100 hover:bg-cyan-500/20"
              >
                {isolatedId === selected.id ? "Show all" : "Isolate"}
              </button>
              <button
                type="button"
                onClick={() => onToggleHidden(selected.id)}
                className="rounded-lg border border-white/12 px-2.5 py-1.5 text-[11px] font-medium text-slate-300 hover:border-white/25"
              >
                {hiddenIds.has(selected.id) ? "Unhide" : "Hide"}
              </button>
            </div>
          </div>
        ) : (
          <p className="mt-2.5 text-xs leading-relaxed text-slate-500 sm:text-sm">
            Click a part in the 3D view — or pick one below — to see its name, purpose, and how CCA
            uses it.
          </p>
        )}
      </div>

      <div className="min-h-0 flex-1 rounded-2xl border border-white/[0.08] bg-slate-950/50 p-3 sm:p-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Layers & parts
        </p>
        <ul className="mt-2.5 max-h-[min(280px,32vh)] space-y-1 overflow-y-auto overscroll-contain pr-1 xl:max-h-[min(420px,48vh)]">
          {parts.map((p) => {
            const active = selectedId === p.id;
            const hidden = hiddenIds.has(p.id);
            const isolated = isolatedId === p.id;
            return (
              <li key={p.id}>
                <div
                  className={`flex w-full items-center gap-1 rounded-lg border px-2 py-1.5 transition ${
                    active
                      ? "border-cyan-400/45 bg-cyan-500/12 text-cyan-50"
                      : "border-transparent bg-white/[0.02] text-slate-300 hover:border-white/10"
                  } ${hidden ? "opacity-45" : ""}`}
                >
                  <button
                    type="button"
                    onClick={() => onSelect(p.id)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <span className="block truncate text-[11px] font-medium sm:text-[12px]">
                      {p.name}
                    </span>
                    <span className="text-[9px] text-slate-500 sm:text-[10px]">
                      {p.category} · Layer {p.layer}
                      {isolated ? " · isolated" : ""}
                      {hidden ? " · hidden" : ""}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onIsolate(p.id)}
                    className="shrink-0 rounded border border-white/10 px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-slate-400 hover:text-cyan-200"
                  >
                    Iso
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggleHidden(p.id)}
                    className="shrink-0 rounded border border-white/10 px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-slate-400 hover:text-cyan-200"
                  >
                    Hide
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
