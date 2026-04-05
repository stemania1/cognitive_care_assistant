"use client";

import type { MouseEvent } from "react";
import Image from "next/image";
import Link from "next/link";

const PROFESSIONALS_LABEL =
  "What dementia professionals say about Cognitive Care Assistant";

const CONGRESSIONAL_CAC_URL =
  "https://www.congressionalappchallenge.us/25-FL17/";

const INSTAGRAM_URL = "https://www.instagram.com/cognitivecareassistant/";

const YOUTUBE_URL = "https://www.youtube.com/@CognitiveCareAssistant";

const navButtonClass =
  "inline-flex min-h-9 max-w-[11rem] shrink-0 items-center justify-center rounded-md border border-white/25 bg-white/10 px-2 py-1.5 text-center text-[10px] font-medium leading-tight text-white transition-colors hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 sm:min-h-10 sm:max-w-[13rem] sm:px-2.5 sm:text-xs md:max-w-[16rem] lg:max-w-[20rem] lg:text-sm xl:max-w-[24rem]";

/** Wider nav control: CAC wordmark + label (white logo on blue bar). */
const congressionalNavButtonClass =
  "inline-flex min-h-9 max-w-[min(92vw,21rem)] shrink-0 items-center justify-start gap-2 rounded-md border border-white/25 bg-white/10 px-2 py-1.5 text-left text-[10px] font-medium leading-tight text-white transition-colors hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 sm:min-h-10 sm:max-w-[min(92vw,26rem)] sm:gap-2.5 sm:px-2.5 sm:text-xs md:max-w-[min(92vw,30rem)] lg:max-w-[34rem] lg:gap-3 lg:text-sm xl:max-w-[38rem]";

const socialIconClass =
  "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/30 bg-blue-900/35 text-white transition-colors hover:border-white/50 hover:bg-blue-900/55 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/80 sm:h-11 sm:w-11";

function scrollToSection(id: string, e: MouseEvent<HTMLAnchorElement>) {
  const el = document.getElementById(id);
  if (el) {
    e.preventDefault();
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    window.history.replaceState(null, "", `#${id}`);
  }
}

function InstagramIcon({ className = "h-5 w-5 sm:h-[1.35rem] sm:w-[1.35rem]" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 11-2.881.001 1.44 1.44 0 012.881-.001z" />
    </svg>
  );
}

function YouTubeIcon({ className = "h-5 w-5 sm:h-[1.35rem] sm:w-[1.35rem]" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

export function SignInTopBar() {
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

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={socialIconClass}
            aria-label="Cognitive Care Assistant on Instagram (opens in new tab)"
            title="Instagram — @cognitivecareassistant"
          >
            <InstagramIcon />
          </a>
          <a
            href={YOUTUBE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={socialIconClass}
            aria-label="Cognitive Care Assistant on YouTube (opens in new tab)"
            title="YouTube — @CognitiveCareAssistant"
          >
            <YouTubeIcon />
          </a>
        </div>
      </div>
    </header>
  );
}
