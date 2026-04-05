"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { useAlertCenter } from "./AlertCenter";

export function AlertsPanelLayer() {
  const pathname = usePathname();
  const {
    alerts,
    alertsPanelOpen,
    setAlertsPanelOpen,
    acknowledgeAlert,
    clearAlert,
    clearAllAlerts,
  } = useAlertCenter();

  const sortedAlerts = useMemo(
    () => [...alerts].sort((a, b) => b.timestamp - a.timestamp),
    [alerts]
  );

  if (pathname.startsWith("/signin") || pathname.startsWith("/signup")) {
    return null;
  }

  if (!alertsPanelOpen) {
    return null;
  }

  return (
    <>
      <div
        className="fixed inset-0 z-[54]"
        onClick={() => setAlertsPanelOpen(false)}
        aria-hidden="true"
      />
      <div className="light-ui-frame fixed bottom-24 right-6 z-[55] w-[min(100vw-2rem,20rem)] rounded-xl border border-cyan-400/30 bg-gradient-to-br from-cyan-950/95 to-blue-950/95 p-4 shadow-2xl backdrop-blur sm:bottom-28 sm:right-8 dark:shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-cyan-300">Alerts</h3>
          <button
            type="button"
            onClick={() => setAlertsPanelOpen(false)}
            className="rounded-full p-1 text-xl hover:bg-white/10"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {sortedAlerts.length === 0 ? (
          <p className="py-8 text-center text-sm opacity-60">No alerts yet</p>
        ) : (
          <>
            <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
              {sortedAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`rounded-lg border border-white/10 p-3 shadow-sm ${
                    alert.severity === "critical"
                      ? "border-red-400/30 bg-red-500/10"
                      : alert.severity === "warning"
                        ? "border-yellow-400/30 bg-yellow-500/10"
                        : "border-cyan-400/30 bg-cyan-500/10"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-100">{alert.message}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] uppercase tracking-wide text-gray-300/70">
                        <span>
                          {new Date(alert.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {alert.source && (
                          <span className="rounded-full bg-white/10 px-2 py-0.5">{alert.source}</span>
                        )}
                        {!alert.acknowledged && (
                          <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] text-white">
                            NEW
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => clearAlert(alert.id)}
                      className="rounded-full p-1 text-lg hover:bg-white/10"
                      aria-label="Dismiss alert"
                    >
                      ×
                    </button>
                  </div>
                  {!alert.acknowledged && (
                    <button
                      type="button"
                      onClick={() => acknowledgeAlert(alert.id)}
                      className="mt-3 w-full rounded-lg border border-white/10 bg-white/10 py-1.5 text-xs text-white hover:bg-white/15"
                    >
                      Mark as read
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between">
              <button
                type="button"
                onClick={clearAllAlerts}
                className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs text-red-200 hover:bg-red-500/20"
              >
                Clear All
              </button>
              <button
                type="button"
                onClick={() => sortedAlerts.forEach((alert) => acknowledgeAlert(alert.id))}
                className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-200 hover:bg-cyan-500/20"
              >
                Mark All Read
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
