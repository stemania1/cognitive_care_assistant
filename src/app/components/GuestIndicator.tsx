"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { isGuestUser } from '@/lib/guestDataManager';

export function GuestIndicator() {
  const [isGuest, setIsGuest] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const checkGuestStatus = async () => {
      try {
        const guestStatus = await isGuestUser();
        setIsGuest(guestStatus);
      } catch (error) {
        console.error('Error checking guest status:', error);
        setIsGuest(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkGuestStatus();
  }, []);

  if (isLoading || !isGuest || isDismissed) {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 z-50">
      <div className="light-ui-frame relative max-w-xs rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-3 backdrop-blur">
        {/* Close button */}
        <button
          onClick={() => setIsDismissed(true)}
          className="absolute top-2 right-2 rounded-full bg-slate-200/80 p-1 transition-colors hover:bg-slate-300/80 dark:bg-white/10 dark:hover:bg-white/20"
          aria-label="Close guest account notice"
        >
          <svg
            className="h-3 w-3 text-slate-600 hover:text-slate-900 dark:text-white/70 dark:hover:text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
        
        <div className="flex items-center gap-2 mb-2 pr-6">
          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
          <span className="text-yellow-400 text-sm font-medium">Guest Account</span>
        </div>
        <p className="mb-2 text-xs text-slate-700 dark:text-white/70">
          Your data is temporary. Create an account to save your progress.
        </p>
        <Link 
          href="/signup" 
          className="inline-flex items-center rounded-full bg-cyan-500 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-cyan-600"
        >
          Create Account
        </Link>
      </div>
    </div>
  );
}
