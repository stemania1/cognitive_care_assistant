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

  if (isLoading) {
    return (
      <div className="fixed top-4 left-4 z-50">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 text-sm text-white/70">
          Loading guest status...
        </div>
      </div>
    );
  }

  // Show debug info temporarily
  if (debugInfo) {
    console.log('GuestIndicator debug info:', debugInfo);
  }

  if (!isGuest || isDismissed) {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 z-50">
      <div className="relative rounded-lg border border-yellow-500/20 bg-yellow-500/10 backdrop-blur p-3 max-w-xs">
        {/* Close button */}
        <button
          onClick={() => setIsDismissed(true)}
          className="absolute top-2 right-2 p-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          aria-label="Close guest account notice"
        >
          <svg
            className="w-3 h-3 text-white/70 hover:text-white"
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
        <p className="text-white/70 text-xs mb-2">
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
