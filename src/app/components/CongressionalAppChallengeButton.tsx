'use client';

import Image from 'next/image';

export function CongressionalAppChallengeButton() {
  return (
    <a
      href="https://www.congressionalappchallenge.us/25-FL17/"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed top-4 right-4 z-50 group"
    >
      <div className="relative">
        <div className="absolute inset-0 rounded-lg bg-gradient-to-tr from-fuchsia-500/20 via-purple-500/15 to-cyan-500/20 blur-lg group-hover:blur-xl transition-all duration-300" />
        <div className="light-ui-frame relative flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200/90 bg-white/90 px-4 py-2.5 text-base text-slate-800 shadow-sm backdrop-blur-sm transition-all hover:bg-white group-hover:border-violet-300/70 group-hover:shadow-md dark:border-white/20 dark:bg-white/10 dark:text-white/90 dark:shadow-none dark:hover:bg-white/20 dark:group-hover:border-white/40 dark:group-hover:shadow-lg">
          {/* Dome Logo */}
          <div className="relative w-8 h-8 flex-shrink-0">
            <Image
              src="/images/CAClogo-dome-only-color.png"
              alt="Congressional App Challenge"
              width={32}
              height={32}
              className="object-contain"
            />
          </div>
          
          {/* Text */}
          <span className="font-medium text-slate-800 whitespace-nowrap dark:text-white">
            Winners of Congressional App Challenge
          </span>
        </div>
      </div>
    </a>
  );
}
