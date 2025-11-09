"use client";

import { useMemo, useState } from "react";
import { useAlertCenter } from "./AlertCenter";

export function GlobalAlertButton() {
  const { alerts, acknowledgeAlert, clearAlert, clearAllAlerts } = useAlertCenter();
  const [open, setOpen] = useState(false);

  const unreadCount = useMemo(
    () => alerts.filter((alert) => !alert.acknowledged).length,
    [alerts]
  );

  const sortedAlerts = useMemo(
    () => [...alerts].sort((a, b) => b.timestamp - a.timestamp),
    [alerts]
  );

  const togglePanel = () => {
    setOpen((prev) => !prev);
  };

  const handleAcknowledge = (id: string) => {
    acknowledgeAlert(id);
  };

  const handleClear = (id: string) => {
    clearAlert(id);
  };

  const handleClearAll = () => {
    clearAllAlerts();
  };

  return (
    <div className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-[60]">
      <button
        onClick={togglePanel}
        className="relative rounded-full border border-cyan-400/30 bg-cyan-500/10 p-4 hover:bg-cyan-500/20 transition-all shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60"
        aria-label="View alerts"
      >
        <span className="text-2xl text-cyan-300">✉️</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute bottom-16 right-0 z-50 w-80 rounded-xl border border-cyan-400/30 bg-gradient-to-br from-cyan-950/95 to-blue-950/95 shadow-2xl p-4 backdrop-blur">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-cyan-300">Alerts</h3>
              <button
                onClick={() => setOpen(false)}
                className="rounded-full p-1 hover:bg-white/10 text-xl"
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
                          ? "bg-red-500/10 border-red-400/30"
                          : alert.severity === "warning"
                          ? "bg-yellow-500/10 border-yellow-400/30"
                          : "bg-cyan-500/10 border-cyan-400/30"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-100">
                            {alert.message}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] uppercase tracking-wide text-gray-300/70">
                            <span>
                              {new Date(alert.timestamp).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            {alert.source && (
                              <span className="rounded-full bg-white/10 px-2 py-0.5">
                                {alert.source}
                              </span>
                            )}
                            {!alert.acknowledged && (
                              <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] text-white">
                                NEW
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleClear(alert.id)}
                          className="rounded-full p-1 hover:bg-white/10 text-lg"
                          aria-label="Dismiss alert"
                        >
                          ×
                        </button>
                      </div>
                      {!alert.acknowledged && (
                        <button
                          onClick={() => handleAcknowledge(alert.id)}
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
                    onClick={handleClearAll}
                    className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs text-red-200 hover:bg-red-500/20"
                  >
                    Clear All
                  </button>
                  <button
                    onClick={() => sortedAlerts.forEach((alert) => handleAcknowledge(alert.id))}
                    className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-200 hover:bg-cyan-500/20"
                  >
                    Mark All Read
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

