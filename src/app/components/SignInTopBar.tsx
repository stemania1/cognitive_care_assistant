"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { readThemeIsDark, setThemeIsDark } from "@/lib/themePreference";

const PROFESSIONALS_LABEL =
  "What dementia professionals say about Cognitive Care Assistant";

const CONGRESSIONAL_CAC_URL =
  "https://www.congressionalappchallenge.us/25-FL17/";

const navButtonClass =
  "inline-flex min-h-9 max-w-[11rem] shrink-0 items-center justify-center rounded-md border border-white/25 bg-white/10 px-2 py-1.5 text-center text-[10px] font-medium leading-tight text-white transition-colors hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 sm:min-h-10 sm:max-w-[13rem] sm:px-2.5 sm:text-xs md:max-w-[16rem] lg:max-w-[20rem] lg:text-sm xl:max-w-[24rem]";

/** Wider nav control: CAC wordmark + label (white logo on blue bar). */
const congressionalNavButtonClass =
  "inline-flex min-h-9 max-w-[min(92vw,21rem)] shrink-0 items-center justify-start gap-2 rounded-md border border-white/25 bg-white/10 px-2 py-1.5 text-left text-[10px] font-medium leading-tight text-white transition-colors hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 sm:min-h-10 sm:max-w-[min(92vw,26rem)] sm:gap-2.5 sm:px-2.5 sm:text-xs md:max-w-[min(92vw,30rem)] lg:max-w-[34rem] lg:gap-3 lg:text-sm xl:max-w-[38rem]";

function scrollToSection(id: string, e: React.MouseEvent<HTMLAnchorElement>) {
  const el = document.getElementById(id);
  if (el) {
    e.preventDefault();
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    window.history.replaceState(null, "", `#${id}`);
  }
}

export function SignInTopBar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const rootRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
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

  return (
    <header
      className="fixed top-0 right-0 left-0 z-[80] border-b border-blue-700/40 bg-gradient-to-r from-[#1d4ed8] via-[#2563EB] to-[#3b82f6] shadow-md dark:border-blue-900/50 dark:from-[#1e3a8a] dark:via-[#1d4ed8] dark:to-[#2563EB]"
    >
      <div className="mx-auto flex h-14 w-full max-w-none items-center gap-2 px-3 sm:h-16 sm:gap-3 sm:px-4 lg:px-6 xl:px-8 2xl:px-10">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3 md:gap-4">
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-white/10 sm:h-10 sm:w-10">
              <Image
                src="/digital_brain.png"
                alt=""
                width={40}
                height={40}
                className="object-contain p-1"
                priority
                aria-hidden
              />
            </div>
            <span className="hidden min-w-0 max-w-[8rem] truncate text-xs font-semibold tracking-tight text-white sm:block sm:max-w-[11rem] sm:text-sm md:max-w-[14rem] lg:max-w-none lg:text-base">
              Cognitive Care Assistant
            </span>
          </div>

          <nav
            className="flex min-w-0 flex-1 items-center justify-start gap-1.5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-2 [&::-webkit-scrollbar]:hidden"
            aria-label="Sign-in page navigation"
          >
            <Link
              href="/signin#what-professionals-say"
              title={PROFESSIONALS_LABEL}
              onClick={(e) => scrollToSection("what-professionals-say", e)}
              className={navButtonClass}
            >
              <span className="line-clamp-3 xl:line-clamp-2">{PROFESSIONALS_LABEL}</span>
            </Link>
            <a
              href={CONGRESSIONAL_CAC_URL}
              target="_blank"
              rel="noopener noreferrer"
              title="Opens the Congressional App Challenge announcement in a new tab"
              className={congressionalNavButtonClass}
            >
              <Image
                src="/images/CAClogo-white-letters-only.png"
                alt=""
                width={112}
                height={40}
                className="h-7 w-auto shrink-0 object-contain object-left opacity-95 sm:h-8"
                aria-hidden
              />
              <span className="min-w-0 leading-snug">
                <span className="line-clamp-3 sm:line-clamp-2">
                  Cognitive Care Assistant in Congress
                </span>
              </span>
            </a>
          </nav>
        </div>

        <div ref={rootRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-blue-400/30 bg-blue-900/40 text-blue-100 transition-colors hover:bg-blue-800/50 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 sm:h-11 sm:w-11"
            aria-expanded={menuOpen}
            aria-haspopup="true"
            aria-label="Settings"
            title="Settings"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-5 w-5 sm:h-6 sm:w-6"
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
            <div className="absolute top-full right-0 z-[90] mt-2 w-[min(calc(100vw-2rem),16rem)] rounded-xl border border-blue-200/90 bg-white p-3 shadow-xl dark:border-blue-700/50 dark:bg-slate-900">
              <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Settings
              </p>
              <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200/90 bg-slate-50 px-3 py-2.5 dark:border-white/10 dark:bg-white/5">
                <span className="text-sm font-medium text-slate-800 dark:text-slate-100">Dark mode</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isDark}
                  onClick={toggleDarkMode}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 ${
                    isDark ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-600"
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
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
