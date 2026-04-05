"use client";

import { useCallback, useLayoutEffect, useState } from "react";
import { readThemeIsDark, setThemeIsDark } from "@/lib/themePreference";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [isDark, setIsDark] = useState(true);

  useLayoutEffect(() => {
    setIsDark(readThemeIsDark());
  }, []);

  const toggle = useCallback(() => {
    const nextDark = !readThemeIsDark();
    setThemeIsDark(nextDark);
    setIsDark(nextDark);
  }, []);

  return (
    <button
      type="button"
      onClick={toggle}
      className={`group relative inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-300/80 bg-white/90 text-slate-800 shadow-lg backdrop-blur transition-transform duration-200 hover:scale-105 dark:border-white/[.12] dark:bg-white/10 dark:text-white ${className}`}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
    >
      <span className="absolute -inset-1 rounded-full bg-gradient-to-r from-amber-400/30 via-sky-400/25 to-violet-400/30 opacity-0 blur-md transition-opacity group-hover:opacity-100 dark:from-amber-400/20 dark:via-sky-400/15 dark:to-violet-400/20" />
      {isDark ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="relative h-5 w-5"
          aria-hidden
        >
          <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.591zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.591zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="relative h-5 w-5"
          aria-hidden
        >
          <path
            fillRule="evenodd"
            d="M9.528 2.523a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z"
            clipRule="evenodd"
          />
        </svg>
      )}
    </button>
  );
}
