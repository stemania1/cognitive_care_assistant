import type { ReactNode } from "react";

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
      <h2
        id="signin-insights-heading"
        className="mb-3 text-center text-base font-semibold tracking-tight text-sky-50 sm:mb-4 sm:text-lg"
      >
        <span className="bg-gradient-to-r from-sky-100 via-white to-sky-100 bg-clip-text text-transparent">
          User insights
        </span>
      </h2>
      <p className="mx-auto mb-4 max-w-2xl text-center text-xs text-sky-200/90 sm:mb-5 sm:text-sm">
        As you explore the page, here is what caregivers and professionals have shared about thoughtful,
        structured support for people living with dementia.
      </p>

      <div className="grid w-full grid-cols-1 items-stretch gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 lg:gap-4">
        <InsightCard className="flex h-full min-w-0 flex-col">
          <blockquote className="border-l-2 border-blue-500/80 pl-3 text-sm leading-[1.75] text-slate-700 sm:text-base sm:leading-[1.8] dark:border-sky-400/90 dark:text-sky-100">
            <p>
              Families I work with do better when everyday rhythms—hydration, rest, movement, and
              emotional safety—are supported with clarity and patience. Technology that makes those
              patterns easier to see, without replacing human connection, can meaningfully protect
              dignity at home.
            </p>
          </blockquote>
          <footer className="mt-4 border-t border-blue-200/60 pt-3.5 dark:border-blue-600/40">
            <p className="text-sm font-bold text-slate-800 sm:text-base dark:text-sky-50">Dr. Gaby Lodeiro</p>
            <ul className="mt-2.5 list-none space-y-1.5 text-xs leading-relaxed text-slate-600 sm:text-sm dark:text-sky-200/85">
              <li className="font-semibold text-slate-800 dark:text-sky-100">SRQ PSYCHOLOGY Founder</li>
              <li>Licensed Clinical Psychologist</li>
              <li>Certified Dementia Practitioner</li>
              <li>Certified Montessori Dementia Care Professional</li>
            </ul>
          </footer>
        </InsightCard>

        <InsightCard className="flex h-full min-w-0 flex-col">
          <blockquote className="border-l-2 border-sky-500/80 pl-3 text-sm leading-[1.75] text-slate-700 sm:text-base sm:leading-[1.8] dark:border-sky-400/90 dark:text-sky-100">
            <p>
              Having reminders and simple daily check-ins in one place cut down the constant
              second-guessing. I feel more like I am on Mom&apos;s team instead of trying to read her
              mind when she is having an off day.
            </p>
          </blockquote>
          <footer className="mt-4 text-xs font-bold leading-relaxed text-slate-700 sm:text-sm dark:text-sky-100">
            — Family caregiver, Florida
          </footer>
        </InsightCard>

        <InsightCard className="flex h-full min-w-0 flex-col sm:col-span-2 lg:col-span-1">
          <blockquote className="border-l-2 border-blue-400/80 pl-3 text-sm leading-[1.75] text-slate-700 sm:text-base sm:leading-[1.8] dark:border-blue-400/90 dark:text-sky-100">
            <p>
              When we can review sleep and activity patterns before clinic visits, conversations with
              the neurologist are sharper and less rushed. Families leave with a clearer plan instead
              of a stack of maybes.
            </p>
          </blockquote>
          <footer className="mt-4 text-xs font-bold leading-relaxed text-slate-700 sm:text-sm dark:text-sky-100">
            — Memory care nurse coordinator
          </footer>
        </InsightCard>
      </div>
    </section>
  );
}
