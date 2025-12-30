'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase, handleRefreshTokenError, safeGetUser } from '@/lib/supabaseClient';
import { isGuestUser } from '@/lib/guestDataManager';
import Link from 'next/link';

export function UserStatusIndicator() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function checkUserStatus() {
      try {
        // Check if user is guest first
        const guestStatus = await isGuestUser();
        if (guestStatus) {
          setIsGuest(true);
          setUserEmail(null);
          setLoading(false);
          return;
        }

        // Check for regular user
        const { user, error } = await safeGetUser();
        if (error) {
          console.error('Error checking user status:', error);
          setUserEmail(null);
          setIsGuest(false);
          return;
        }
        if (user) {
          setUserEmail(user.email || null);
          setIsGuest(false);
        } else {
          setUserEmail(null);
          setIsGuest(false);
        }
      } catch (error) {
        console.error('Error checking user status:', error);
        setUserEmail(null);
        setIsGuest(false);
      } finally {
        setLoading(false);
      }
    }

    checkUserStatus();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if (session?.user) {
          setUserEmail(session.user.email || null);
          setIsGuest(false);
        } else {
          setUserEmail(null);
          setIsGuest(false);
        }
      } catch (error) {
        console.error('Error in auth state change:', error);
        
        // Check if it's a refresh token error
        if (error instanceof Error && error.message.includes('Refresh Token')) {
          console.log('Refresh token error in auth state change, handling...');
          await handleRefreshTokenError();
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Handle clicking outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (loading) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 text-sm text-white/70">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-4 right-4 z-50" ref={dropdownRef}>
      <div className="relative">
        {/* Clickable status indicator */}
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 text-sm text-white/90 border border-white/20 hover:bg-white/20 transition-colors cursor-pointer flex items-center gap-2"
        >
          <span className="text-white/70">Logged in as:</span>
          <span className={`font-medium ${isGuest ? 'text-yellow-400' : 'text-cyan-400'}`}>
            {isGuest ? 'Guest' : userEmail || 'Not logged in'}
          </span>
          {/* Dropdown arrow */}
          <svg
            className={`w-4 h-4 text-white/70 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown menu */}
        {isDropdownOpen && (
          <div className="absolute top-full right-0 mt-2 w-48 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 shadow-lg">
            <div className="py-2">
              {/* User info */}
              <div className="px-3 py-2 border-b border-white/10">
                <div className="text-xs text-white/70">Account</div>
                <div className={`text-sm font-medium ${isGuest ? 'text-yellow-400' : 'text-cyan-400'}`}>
                  {isGuest ? 'Guest Account' : userEmail || 'Not logged in'}
                </div>
              </div>

              {/* Menu items */}
              <div className="py-1">
                {isGuest && (
                  <Link
                    href="/signup"
                    className="block px-3 py-2 text-sm text-white/90 hover:bg-white/10 transition-colors"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Create Account
                    </div>
                  </Link>
                )}
                
                {/* Sign out button */}
                <Link
                  href="/signout"
                  className="block px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign Out
                  </div>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
