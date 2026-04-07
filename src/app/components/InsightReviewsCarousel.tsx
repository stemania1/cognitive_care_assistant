"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { BorderKey, InsightReview } from "./insight-reviews-data";
import { BORDER } from "./insight-reviews-data";

const GAP_PX = 16;
const IDLE_MS = 5000;
const AUTO_PX_PER_SEC = 14;
const ARROW_MS = 480;
const CLONES = 2;

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

function normalizeScroll(scroll: number, cycle: number): number {
  if (cycle <= 0.5) return scroll;
  let s = scroll;
  while (s >= cycle) s -= cycle;
  while (s < 0) s += cycle;
  return s;
}

/** Width of one row of `count` cards with flex `gap` between them. */
function setWidthPx(cardW: number, count: number, gap: number) {
  if (count <= 0) return 0;
  return count * cardW + (count - 1) * gap;
}

/** Seamless loop stride: one full set plus the gap before the duplicate set. */
function stridePx(cardW: number, count: number, gap: number) {
  return setWidthPx(cardW, count, gap) + gap;
}

function InsightCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <article
      className={`group rounded-xl border border-blue-800/35 bg-[#eef2fa] p-4 shadow-md backdrop-blur-sm transition-all duration-200 ease-out motion-safe:hover:-translate-y-0.5 hover:border-blue-600/50 hover:shadow-lg dark:border-blue-600/40 dark:bg-[#1a2d47]/95 dark:shadow-none dark:hover:border-sky-500/40 dark:hover:bg-[#1e3554]/95 sm:p-5 ${className}`}
    >
      <p
        className="mb-2 font-serif text-[2.75rem] leading-[0.85] text-blue-600/20 dark:text-sky-300/25 sm:mb-2.5 sm:text-[3.25rem]"
        aria-hidden="true"
      >
        &ldquo;
      </p>
      {children}
    </article>
  );
}

function ReviewSlide({ review }: { review: InsightReview }) {
  const b = BORDER[review.border];

  return (
    <InsightCard className="flex h-full min-h-[18rem] w-full min-w-0 flex-col md:min-h-[20rem] lg:min-h-[22rem]">
      <blockquote
        className={`border-l-2 pl-3 text-sm leading-[1.75] text-slate-700 sm:text-base sm:leading-[1.8] dark:text-sky-100 ${b}`}
      >
        <p>{review.quote}</p>
      </blockquote>
      <footer className="mt-4 border-t border-blue-200/60 pt-3.5 dark:border-blue-600/40">
        <p className="text-sm font-bold text-slate-800 sm:text-base dark:text-sky-50">{review.name}</p>
        <ul className="mt-2.5 list-none space-y-1.5 text-xs leading-relaxed text-slate-600 sm:text-sm dark:text-sky-200/85">
          {review.lines.map((line, i) => (
            <li
              key={`${review.id}-${i}`}
              className={i === 0 ? "font-semibold text-slate-800 dark:text-sky-100" : undefined}
            >
              {line}
            </li>
          ))}
        </ul>
      </footer>
    </InsightCard>
  );
}

const arrowBtnClass =
  "pointer-events-auto absolute top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-slate-950/45 text-xl text-white shadow-lg backdrop-blur-md transition-all duration-200 motion-safe:hover:scale-105 motion-safe:hover:border-sky-300/40 motion-safe:hover:bg-slate-900/75 motion-safe:hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/80 sm:h-12 sm:w-12 opacity-[0.42] hover:opacity-100";

type Props = {
  reviews: InsightReview[];
  className?: string;
};

export function InsightReviewsCarousel({ reviews, className = "" }: Props) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const [cardWidth, setCardWidth] = useState(300);
  const [reducedMotion, setReducedMotion] = useState(false);

  const scrollRef = useRef(0);
  const cycleWidthRef = useRef(0);
  const cardWRef = useRef(300);
  const gapRef = useRef(GAP_PX);

  const autoActiveRef = useRef(false);
  const hoverRef = useRef(false);
  const dragRef = useRef(false);
  const reducedMotionRef = useRef(false);
  const lastDragXRef = useRef(0);

  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);

  const arrowTweenRef = useRef<{
    from: number;
    to: number;
    t0: number;
  } | null>(null);

  const clearIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  }, []);

  const scheduleIdle = useCallback(() => {
    clearIdleTimer();
    idleTimerRef.current = setTimeout(() => {
      if (!hoverRef.current && !dragRef.current && !reducedMotionRef.current) {
        autoActiveRef.current = true;
      }
    }, IDLE_MS);
  }, [clearIdleTimer]);

  const applyTransform = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    el.style.transform = `translate3d(-${scrollRef.current}px,0,0)`;
  }, []);

  const syncCycleFromLayout = useCallback(() => {
    const cw = cardWRef.current;
    const g = gapRef.current;
    const n = reviews.length;
    const cycle = stridePx(cw, n, g);
    cycleWidthRef.current = cycle;
    if (cycle > 0.5) {
      scrollRef.current = normalizeScroll(scrollRef.current, cycle);
      applyTransform();
    }
  }, [reviews.length, applyTransform]);

  useLayoutEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const update = () => {
      const W = el.clientWidth;
      const cw = Math.max(200, (W - 2 * GAP_PX) / 3);
      cardWRef.current = cw;
      gapRef.current = GAP_PX;
      setCardWidth(cw);
    };

    update();
    const ro = new ResizeObserver(() => update());
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useLayoutEffect(() => {
    syncCycleFromLayout();
  }, [cardWidth, reviews.length, syncCycleFromLayout]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      reducedMotionRef.current = mq.matches;
      setReducedMotion(mq.matches);
      if (mq.matches) {
        autoActiveRef.current = false;
        arrowTweenRef.current = null;
      }
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    scheduleIdle();
    return () => clearIdleTimer();
  }, [scheduleIdle, clearIdleTimer]);

  const onArrow = useCallback(
    (dir: -1 | 1) => {
      autoActiveRef.current = false;
      arrowTweenRef.current = null;
      clearIdleTimer();
      scheduleIdle();

      const c = cycleWidthRef.current;
      const cw = cardWRef.current;
      const g = gapRef.current;
      if (c <= 0.5 || cw <= 0) return;

      const step = 3 * cw + 2 * g;
      const from = scrollRef.current;
      const to = from + dir * step;
      arrowTweenRef.current = { from, to, t0: performance.now() };
    },
    [clearIdleTimer, scheduleIdle],
  );

  useEffect(() => {
    const tick = (now: number) => {
      const last = lastTsRef.current ?? now;
      const dt = Math.min(0.064, (now - last) / 1000);
      lastTsRef.current = now;

      const c = cycleWidthRef.current;
      const tw = arrowTweenRef.current;

      if (tw) {
        const u = Math.min(1, (now - tw.t0) / ARROW_MS);
        const e = easeOutCubic(u);
        scrollRef.current = tw.from + (tw.to - tw.from) * e;
        if (u >= 1) {
          arrowTweenRef.current = null;
        }
      } else if (
        autoActiveRef.current &&
        !hoverRef.current &&
        !dragRef.current &&
        !reducedMotionRef.current &&
        c > 0.5
      ) {
        scrollRef.current += AUTO_PX_PER_SEC * dt;
      }

      if (c > 0.5) {
        scrollRef.current = normalizeScroll(scrollRef.current, c);
      }
      applyTransform();

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [applyTransform]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    dragRef.current = true;
    lastDragXRef.current = e.clientX;
    autoActiveRef.current = false;
    arrowTweenRef.current = null;
    clearIdleTimer();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const x = e.clientX;
    const dx = x - lastDragXRef.current;
    lastDragXRef.current = x;
    scrollRef.current -= dx;
    const c = cycleWidthRef.current;
    if (c > 0.5) scrollRef.current = normalizeScroll(scrollRef.current, c);
    applyTransform();
  };

  const endDrag = () => {
    if (!dragRef.current) return;
    dragRef.current = false;
    scheduleIdle();
  };

  return (
    <div
      className={`relative w-full ${className}`}
      role="region"
      aria-roledescription="carousel"
      aria-label="User insight reviews"
      onPointerEnter={() => {
        hoverRef.current = true;
        autoActiveRef.current = false;
      }}
      onPointerLeave={() => {
        hoverRef.current = false;
        scheduleIdle();
      }}
    >
      <div className="relative px-11 sm:px-14 md:px-16">
        <button
          type="button"
          className={`${arrowBtnClass} left-1 sm:left-2`}
          aria-label="Previous reviews"
          onClick={() => onArrow(-1)}
        >
          <span aria-hidden className="relative top-px">
            ‹
          </span>
        </button>

        <button
          type="button"
          className={`${arrowBtnClass} right-1 sm:right-2`}
          aria-label="Next reviews"
          onClick={() => onArrow(1)}
        >
          <span aria-hidden className="relative top-px">
            ›
          </span>
        </button>

        <div
          ref={viewportRef}
          className="relative z-0 min-h-0 w-full cursor-grab overflow-hidden active:cursor-grabbing"
          style={{ touchAction: "none" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onLostPointerCapture={endDrag}
        >
          <div
            ref={trackRef}
            className="flex flex-row"
            style={{ gap: GAP_PX, willChange: "transform" }}
          >
            {Array.from({ length: CLONES }, (_, cloneIdx) => (
              <div
                key={cloneIdx}
                className="flex shrink-0 flex-row"
                style={{ gap: GAP_PX }}
              >
                {reviews.map((review) => (
                  <div
                    key={`${review.id}-${cloneIdx}`}
                    className="shrink-0"
                    style={{
                      width: cardWidth,
                      minWidth: cardWidth,
                      maxWidth: cardWidth,
                    }}
                  >
                    <ReviewSlide review={review} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-2 text-center text-[11px] text-sky-300/80 sm:text-xs">
        {reducedMotion
          ? "Use arrows or drag to browse reviews."
          : "Reviews drift slowly after a few seconds idle; hover, drag, or use arrows to pause."}
      </p>
    </div>
  );
}
