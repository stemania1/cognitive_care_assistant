"use client";

import { InsightReviewsCarousel } from "./InsightReviewsCarousel";
import { INSIGHT_REVIEWS } from "./insight-reviews-data";

/** Five respondent groups with the strongest credibility mix for this section (family trust + clinical depth). */
const RATING_RESPONDENT_ROLES = [
  "Family members & caregivers",
  "Neurologists & neurocognitive specialists",
  "Neuropsychologists & psychologists",
  "Memory care facility staff",
  "Physicians caring for dementia patients",
] as const;

export function SignInUserInsights({
  className = "",
  sectionId,
}: {
  className?: string;
  /** Anchor id for in-page navigation (e.g. top bar links). */
  sectionId?: string;
}) {
  return (
    <section
      id={sectionId}
      className={`scroll-mt-14 sm:scroll-mt-16 ${className}`}
      aria-labelledby="signin-insights-heading"
    >
      <div className="mb-4 w-full space-y-4 sm:mb-5">
        <h2
          id="signin-insights-heading"
          className="text-center text-base font-semibold tracking-tight text-sky-50 sm:text-lg"
        >
          <span className="bg-gradient-to-r from-sky-100 via-white to-sky-100 bg-clip-text text-transparent">
            User insights
          </span>
        </h2>

        <aside
          className="w-full rounded-xl border border-sky-400/25 bg-sky-950/35 px-3 py-4 shadow-inner backdrop-blur-sm sm:px-5 sm:py-5"
          aria-label="Feedback rating and respondent roles"
        >
          <div className="flex flex-wrap items-baseline justify-center gap-x-2 gap-y-1 border-b border-sky-400/20 pb-4">
            <span className="text-3xl font-bold tabular-nums text-white sm:text-4xl">9.2</span>
            <span className="text-xl font-semibold text-sky-200/90 sm:text-2xl">/10</span>
            <span className="w-full text-center text-[11px] font-semibold uppercase tracking-wider text-sky-300/85 sm:w-auto sm:pl-2">
              average rating
            </span>
          </div>
          <p className="mt-4 text-center text-xs font-medium text-sky-100 sm:text-sm">
            Rated by respondents in these roles
          </p>
          <ul className="mt-3 grid w-full grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-5 lg:gap-2 xl:gap-4">
            {RATING_RESPONDENT_ROLES.map((role) => (
              <li
                key={role}
                className="flex min-h-[3.25rem] items-center justify-center rounded-lg border border-sky-400/20 bg-sky-950/50 px-2 py-2.5 text-center text-[11px] font-semibold leading-snug tracking-tight text-sky-100 sm:min-h-[3.5rem] sm:px-3 sm:text-xs lg:min-h-[4rem] lg:text-[13px]"
              >
                {role}
              </li>
            ))}
          </ul>
        </aside>
      </div>

      <p className="mx-auto mb-4 max-w-2xl text-center text-xs text-sky-200/90 sm:mb-5 sm:text-sm">
        As you explore the page, here is what caregivers and professionals have shared about thoughtful,
        structured support for people living with dementia.
      </p>

      <InsightReviewsCarousel reviews={INSIGHT_REVIEWS} />
    </section>
  );
}
