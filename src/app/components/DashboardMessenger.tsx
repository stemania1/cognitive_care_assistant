'use client';

import Link from 'next/link';

export function DashboardMessenger() {
  return (
    <Link href="/messenger" className="group relative">
      <div className="absolute inset-0 rounded-lg bg-gradient-to-tr from-sky-500/20 via-indigo-500/15 to-violet-500/20 blur-lg transition-all duration-300 group-hover:blur-xl" />
      <div className="light-ui-frame relative flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200/90 bg-white/90 px-4 py-2.5 text-base text-slate-800 shadow-sm backdrop-blur-sm transition-all hover:bg-white group-hover:border-sky-300/70 group-hover:shadow-md dark:border-white/20 dark:bg-white/10 dark:text-white/90 dark:shadow-none dark:hover:bg-white/20 dark:group-hover:border-white/40 dark:group-hover:shadow-lg">
        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500/20 to-indigo-500/25 text-lg">
          💬
        </span>
        <span className="whitespace-nowrap font-medium text-slate-800 dark:text-white">Messenger</span>
      </div>
    </Link>
  );
}
