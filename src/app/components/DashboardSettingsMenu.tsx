"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useAlertCenter } from "./AlertCenter";
import { readThemeIsDark, setThemeIsDark } from "@/lib/themePreference";

export function DashboardSettingsMenu() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const { alerts, setAlertsPanelOpen } = useAlertCenter();
  const rootRef = useRef<HTMLDivElement>(null);

  const unreadCount = useMemo(
    () => alerts.filter((a) => !a.acknowledged).length,
    [alerts]
  );

  useEffect(() => {
    setIsDark(readThemeIsDark());
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [menuOpen]);

  const toggleDarkMode = useCallback(() => {
    const next = !readThemeIsDark();
    setThemeIsDark(next);
    setIsDark(next);
  }, []);

  const openAlerts = useCallback(() => {
    setMenuOpen(false);
    setAlertsPanelOpen(true);
  }, [setAlertsPanelOpen]);

  return (
    <div ref={rootRef} className="fixed bottom-6 left-6 z-[65] sm:bottom-8 sm:left-8">
      <button
        type="button"
        onClick={() => setMenuOpen((o) => !o)}
        className="group relative inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-300/80 bg-white/90 text-slate-800 shadow-lg backdrop-blur transition-transform duration-200 hover:scale-105 dark:border-white/[.12] dark:bg-white/10 dark:text-white"
        aria-expanded={menuOpen}
        aria-haspopup="true"
        aria-label="Open settings"
        title="Settings"
      >
        <span className="absolute -inset-1 rounded-full bg-gradient-to-r from-fuchsia-500/20 via-purple-500/15 to-cyan-500/20 opacity-0 blur-md transition-opacity group-hover:opacity-100" />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="relative h-6 w-6"
          aria-hidden
        >
          <path
            fillRule="evenodd"
            d="M11.078 2.25c-.917 0-1.699.663-1.85 1.557l-.091.549c-.2.12-.398.245-.587.375l-.554-.16a1.875 1.875 0 00-2.185 2.185l.16.554c-.13.189-.255.387-.375.586l-.548.091A1.875 1.875 0 005.25 12l.091.548c.12.2.245.398.375.586l-.16.554a1.875 1.875 0 002.185 2.185l.554-.16c.189.13.387.255.586.375l.091.548A1.875 1.875 0 0012 18.75l.548-.091c.2-.12.398-.245.586-.375l.554.16a1.875 1.875 0 002.185-2.185l-.16-.554c.13-.189.255-.387.375-.586l.548-.091A1.875 1.875 0 0018.75 12l-.091-.548c-.12-.2-.245-.398-.375-.586l.16-.554a1.875 1.875 0 00-2.185-2.185l-.554.16c-.189-.13-.387-.255-.586-.375l-.091-.548A1.875 1.875 0 0012 5.25l-.548.091c-.2.12-.398.245-.586.375l-.554-.16a1.875 1.875 0 00-2.185 2.185l.16.554c-.13.189-.255.387-.375.586zM12 15a3 3 0 100-6 3 3 0 000 6z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {menuOpen && (
        <>
          <div className="light-ui-frame absolute bottom-14 left-0 w-[min(calc(100vw-3rem),18rem)] rounded-2xl border border-slate-200/90 bg-white/95 p-3 shadow-xl backdrop-blur dark:border-white/15 dark:bg-slate-900/95 dark:shadow-xl">
            <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Settings
            </p>

            <div className="light-ui-frame flex items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-slate-50/80 px-3 py-2.5 dark:border-white/10 dark:bg-white/5">
              <span className="text-sm font-medium text-slate-800 dark:text-slate-100">Dark mode</span>
              <button
                type="button"
                role="switch"
                aria-checked={isDark}
                onClick={toggleDarkMode}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/60 ${
                  isDark ? "bg-violet-600" : "bg-slate-300 dark:bg-slate-600"
                }`}
                aria-label={isDark ? "Dark mode on" : "Dark mode off"}
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    isDark ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <button
              type="button"
              onClick={openAlerts}
              className="light-ui-frame mt-2 flex w-full items-center justify-between gap-2 rounded-xl border border-slate-200/80 bg-slate-50/80 px-3 py-2.5 text-left text-sm font-medium text-slate-800 transition-colors hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
            >
              <span className="flex items-center gap-2">
                <span className="text-lg" aria-hidden>
                  ✉️
                </span>
                Alerts
              </span>
              {unreadCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            <Link
              href="/signout"
              onClick={() => setMenuOpen(false)}
              className="light-ui-frame mt-2 flex w-full items-center gap-2 rounded-xl border border-red-200/80 bg-red-50/80 px-3 py-2.5 text-sm font-medium text-red-800 transition-colors hover:bg-red-100/80 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200 dark:hover:bg-red-500/20"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-5 w-5 shrink-0 opacity-90"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
                />
              </svg>
              Sign out
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
