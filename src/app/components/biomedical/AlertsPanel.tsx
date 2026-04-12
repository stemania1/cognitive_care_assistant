"use client";

import { useMemo } from "react";
import { collapseAlertsForDisplay } from "./collapseAlerts";
import type { AlertItem } from "./useBiomedicalTelemetry";

export function AlertsPanel({
  alerts,
  onDismiss,
}: {
  alerts: AlertItem[];
  onDismiss: (id: string) => void;
}) {
  const rows = useMemo(() => collapseAlertsForDisplay(alerts), [alerts]);

  return (
    <div className="flex flex-col gap-2">
      {rows.length === 0 ? (
        <p className="rounded-lg border border-emerald-500/25 bg-emerald-500/[0.06] px-3 py-2.5 text-[11px] leading-snug text-emerald-100/90">
          No acute anomalies. Channels within nominal bands.
        </p>
      ) : (
        rows.map((row) => (
          <div
            key={row.key}
            className={`flex items-start justify-between gap-2 rounded-lg border px-3 py-2 text-[11px] leading-snug ${
              row.severity === "crit"
                ? "border-red-500/35 bg-red-500/[0.08] text-red-100"
                : row.severity === "warn"
                  ? "border-amber-500/30 bg-amber-500/[0.07] text-amber-50"
                  : "border-sky-500/25 bg-sky-500/[0.07] text-sky-100"
            }`}
          >
            <span className="min-w-0 flex-1">{row.message}</span>
            <button
              type="button"
              onClick={() => {
                row.dismissIds.forEach((id) => onDismiss(id));
              }}
              className="shrink-0 rounded-md border border-white/10 px-2 py-0.5 text-[10px] text-slate-400 transition hover:bg-white/5 hover:text-white"
            >
              Clear
            </button>
          </div>
        ))
      )}
    </div>
  );
}
