"use client";

import Image from "next/image";
import { useEffect, useLayoutEffect, useState } from "react";
import {
  markCareIntroCompleted,
  shouldSkipCareIntro,
} from "@/lib/careIntroSession";

const ANIM_MS = 3200;
const FADE_MS = 850;
const ANIM_MS_REDUCED = 450;
const FADE_MS_REDUCED = 320;
/** Time to show the welcome line after the intro animation finishes. */
const WELCOME_HOLD_MS = 2000;
const WELCOME_HOLD_MS_REDUCED = 650;

type LoadPhase = "intro" | "welcome";

/**
 * Full-screen intro: “Let’s Care Together” with calm word + progress animation, then a bold welcome line, then fades away.
 * Runs once per browser tab session (see careIntroSession); not again on client-side navigation (e.g. dashboard ↔ AI synopsis).
 * Flag is cleared on sign-out so the next sign-in can show the intro again.
 */
export function CareTogetherLoadScreen() {
  const [playIntro, setPlayIntro] = useState<boolean | null>(null);

  useLayoutEffect(() => {
    setPlayIntro(!shouldSkipCareIntro());
  }, []);

  if (playIntro === null) return null;
  if (!playIntro) return null;

  return <CareIntroSequence />;
}

function CareIntroSequence() {
  const [visible, setVisible] = useState(true);
  const [phase, setPhase] = useState<LoadPhase>("intro");
  const [exiting, setExiting] = useState(false);
  const [fadeOutMs, setFadeOutMs] = useState(FADE_MS);

  useEffect(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const holdIntro = reduced ? ANIM_MS_REDUCED : ANIM_MS;
    const holdWelcome = reduced ? WELCOME_HOLD_MS_REDUCED : WELCOME_HOLD_MS;
    const fade = reduced ? FADE_MS_REDUCED : FADE_MS;
    setFadeOutMs(fade);

    document.body.style.overflow = "hidden";

    const toWelcome = window.setTimeout(() => setPhase("welcome"), holdIntro);
    const startFade = window.setTimeout(() => setExiting(true), holdIntro + holdWelcome);
    const remove = window.setTimeout(() => {
      markCareIntroCompleted();
      setVisible(false);
      document.body.style.overflow = "";
    }, holdIntro + holdWelcome + fade);

    return () => {
      window.clearTimeout(toWelcome);
      window.clearTimeout(startFade);
      window.clearTimeout(remove);
      document.body.style.overflow = "";
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`cca-care-together-loader fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#050b16] px-6 transition-opacity ease-out ${
        exiting ? "pointer-events-none opacity-0" : "pointer-events-auto opacity-100"
      }`}
      style={{ transitionDuration: exiting ? `${fadeOutMs}ms` : "500ms" }}
      aria-hidden={exiting}
      aria-busy={!exiting}
    >
      {/* Soft vignette — subtle depth, not flashy */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_85%_70%_at_50%_45%,transparent_0%,rgb(5,11,22)_65%,rgb(2,6,12)_100%)] opacity-90"
        aria-hidden
      />

      <div className="relative z-[1] flex min-h-[min(42vh,16rem)] w-full max-w-6xl flex-col items-center justify-center sm:min-h-[min(38vh,18rem)]">
        <div
          className={`flex w-full flex-col items-center transition-opacity duration-500 ease-out ${
            phase === "intro"
              ? "relative opacity-100"
              : "pointer-events-none absolute inset-0 justify-center opacity-0"
          }`}
          aria-hidden={phase !== "intro"}
        >
          <h1 className="text-center text-slate-200/95 uppercase tracking-[0.06em]">
            <span className="cca-care-prefix mr-2.5 inline-block text-[clamp(1.85rem,5.8vw,4.5rem)] font-semibold leading-[1.08] sm:mr-3">
              Let&apos;s Care
            </span>
            <span className="cca-care-together inline-block text-[clamp(1.85rem,5.8vw,4.5rem)] font-bold leading-[1.08]">
              Together
            </span>
          </h1>

          <div
            className="relative mt-12 h-[3px] w-[min(22rem,88vw)] overflow-hidden rounded-full bg-white/[0.07]"
            aria-hidden
          >
            <div className="cca-care-loader-bar absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#2563EB] to-[#3B82F6]" />
          </div>
        </div>

        <div
          className={`flex w-full max-w-[min(100%,72rem)] flex-col items-center px-2 transition-opacity duration-500 ease-out ${
            phase === "welcome"
              ? "relative opacity-100"
              : "pointer-events-none absolute inset-0 justify-center opacity-0"
          }`}
          aria-hidden={phase !== "welcome"}
          {...(phase === "welcome"
            ? ({ role: "status", "aria-live": "polite" } as const)
            : {})}
        >
          <div className="flex w-full min-w-0 justify-center overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <p className="flex flex-nowrap items-center gap-2 font-bold whitespace-nowrap text-sky-50 sm:gap-3">
              <span className="text-[clamp(0.7rem,2.4vw+0.35rem,2.35rem)] leading-none tracking-tight">
                Welcome To your Cognitive Care Assistant
              </span>
              <span className="relative inline-flex h-[clamp(1.5rem,4vw+0.5rem,2.75rem)] w-[clamp(1.5rem,4vw+0.5rem,2.75rem)] shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/10">
                <Image
                  src="/digital_brain.png"
                  alt=""
                  width={44}
                  height={44}
                  className="object-contain p-0.5"
                  aria-hidden
                />
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
