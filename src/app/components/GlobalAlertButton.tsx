"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { useAlertCenter } from "./AlertCenter";

export function GlobalAlertButton() {
  const pathname = usePathname();
  const { alerts, alertsPanelOpen, setAlertsPanelOpen } = useAlertCenter();

  const unreadCount = useMemo(
    () => alerts.filter((alert) => !alert.acknowledged).length,
    [alerts]
  );

  if (pathname.startsWith("/signin") || pathname.startsWith("/signup")) {
    return null;
  }

  if (pathname === "/dashboard") {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-[60] sm:bottom-8 sm:right-8">
      <button
        type="button"
        onClick={() => setAlertsPanelOpen((o) => !o)}
        className="relative rounded-full border border-cyan-400/30 bg-cyan-500/10 p-4 shadow-lg transition-all hover:bg-cyan-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60"
        aria-label="View alerts"
        aria-expanded={alertsPanelOpen}
      >
        <span className="text-2xl text-cyan-300">✉️</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>
    </div>
  );
}
