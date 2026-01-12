'use client';

import { useUser } from '@clerk/nextjs';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export function UserStatusIndicator() {
  const { user, isLoaded } = useUser();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  if (!isLoaded) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 text-sm text-white/70">
          Loading...
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Don't show anything if not signed in
  }

  const userEmail = user.emailAddresses[0]?.emailAddress || user.primaryEmailAddress?.emailAddress || 'User';
  const profileImageUrl = user.imageUrl || null;

  return (
    <div className="fixed top-4 right-4 z-50" ref={dropdownRef}>
      <div className="relative">
        {/* Clickable status indicator */}
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 text-sm text-white/90 border border-white/20 hover:bg-white/20 transition-colors cursor-pointer flex items-center gap-3"
        >
          {/* Profile Image */}
          {profileImageUrl ? (
            <div className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-white/30">
              <Image
                src={profileImageUrl}
                alt={userEmail}
                width={32}
                height={32}
                className="object-cover"
                unoptimized
              />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 border-2 border-white/30 flex items-center justify-center">
              <span className="text-white text-xs font-semibold">
                {userEmail.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          
          {/* User Email/Name */}
          <span className="font-medium text-cyan-400">
            {userEmail}
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
          <div className="absolute top-full right-0 mt-2 w-56 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 shadow-lg">
            <div className="py-2">
              {/* User info */}
              <div className="px-3 py-3 border-b border-white/10">
                <div className="flex items-center gap-3">
                  {/* Profile Image in dropdown */}
                  {profileImageUrl ? (
                    <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-white/30 flex-shrink-0">
                      <Image
                        src={profileImageUrl}
                        alt={userEmail}
                        width={40}
                        height={40}
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 border-2 border-white/30 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm font-semibold">
                        {userEmail.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-white/70">Account</div>
                    <div className="text-sm font-medium text-cyan-400 truncate">
                      {userEmail}
                    </div>
                  </div>
                </div>
              </div>

              {/* Menu items */}
              <div className="py-1">
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
