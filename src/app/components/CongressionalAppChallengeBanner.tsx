'use client';

import { useState } from 'react';
import Image from 'next/image';

export function CongressionalAppChallengeBanner() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 overflow-hidden bg-gradient-to-r from-fuchsia-500/20 via-purple-500/15 to-cyan-500/20 border-b border-white/20 backdrop-blur-sm">
      <div className="flex items-center relative">
        {/* Close Button */}
        <button
          onClick={() => setIsVisible(false)}
          className="absolute right-2 sm:right-4 z-10 flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors flex-shrink-0"
          aria-label="Close banner"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 sm:h-5 sm:w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        {/* Scrolling Content */}
        <div className="flex items-center gap-3 py-2 sm:py-3 pr-10 sm:pr-14 overflow-hidden w-full">
          <div className="flex items-center gap-3 animate-scroll-banner whitespace-nowrap ml-auto">
            {/* Multiple instances for seamless loop */}
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-12 sm:px-16">
                {/* Dome Logo */}
                <div className="relative w-6 h-6 sm:w-7 sm:h-7 flex-shrink-0">
                  <Image
                    src="/images/CAClogo-dome-only-color.png"
                    alt="Congressional App Challenge"
                    width={28}
                    height={28}
                    className="object-contain"
                  />
                </div>
                
                {/* Text */}
                <span className="font-semibold text-white text-sm sm:text-base">
                  🏆 Winners of the 2025 Congressional App Challenge 🏆
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
