"use client";

import { useEffect, useState } from "react";

const ANIM_MS = 3200;
const FADE_MS = 850;
const ANIM_MS_REDUCED = 450;
const FADE_MS_REDUCED = 320;

/**
 * Full-screen intro: “Let’s Care Together” with calm word + progress animation, then fades away.
 */
export function CareTogetherLoadScreen() {
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);
  const [fadeOutMs, setFadeOutMs] = useState(FADE_MS);

  useEffect(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hold = reduced ? ANIM_MS_REDUCED : ANIM_MS;
    const fade = reduced ? FADE_MS_REDUCED : FADE_MS;
    setFadeOutMs(fade);

    document.body.style.overflow = "hidden";

    const startFade = window.setTimeout(() => setExiting(true), hold);
    const remove = window.setTimeout(() => {
      setVisible(false);
      document.body.style.overflow = "";
    }, hold + fade);

    return () => {
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

      <div className="relative z-[1] flex max-w-6xl flex-col items-center">
        <h1 className="text-center text-slate-200/95 uppercase tracking-[0.06em]">
          <span className="cca-care-prefix inline-block text-[clamp(1.85rem,5.8vw,4.5rem)] font-semibold leading-[1.08] mr-2.5 sm:mr-3">
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
    </div>
  );
}
