"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { isGuestUser } from '@/lib/guestDataManager';

export function GuestIndicator() {
  const [isGuest, setIsGuest] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkGuestStatus = async () => {
      try {
        // First check localStorage for guest session
        const guestSession = localStorage.getItem('cognitive_care_guest_session');
        if (guestSession) {
          const session = JSON.parse(guestSession);
          setIsGuest(session.isGuest === true);
          setIsLoading(false);
          return;
        }
        
        // If no localStorage session, check Supabase
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

  if (isLoading || !isGuest) {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 z-50">
      <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 backdrop-blur p-3 max-w-xs">
        <div className="flex items-center gap-2 mb-2">
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
