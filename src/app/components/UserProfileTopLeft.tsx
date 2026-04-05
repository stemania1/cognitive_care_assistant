'use client';

import { useUser } from '@clerk/nextjs';
import Image from 'next/image';

export function UserProfileTopLeft() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return null;
  }

  if (!user) {
    return null;
  }

  const userEmail = user.emailAddresses[0]?.emailAddress || user.primaryEmailAddress?.emailAddress || 'User';
  const profileImageUrl = user.imageUrl || null;

  return (
    <div className="fixed top-4 left-4 z-50">
      <div className="relative">
        <div className="absolute inset-0 rounded-lg bg-gradient-to-tr from-fuchsia-500/20 via-purple-500/15 to-cyan-500/20 blur-lg" />
        <button className="light-ui-frame relative flex cursor-pointer items-center gap-3 rounded-lg border-2 border-slate-200/90 bg-white/90 px-4 py-2.5 text-base text-slate-800 shadow-md backdrop-blur-sm transition-colors hover:bg-white dark:border-white/30 dark:bg-white/15 dark:text-white dark:shadow-lg dark:hover:bg-white/20">
          {/* Profile Image */}
          {profileImageUrl ? (
            <div className="relative w-10 h-10 flex-shrink-0 overflow-hidden rounded-full border-2 border-slate-300/80 shadow-md dark:border-white/40">
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
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 border-slate-300/80 bg-gradient-to-br from-purple-500 to-cyan-500 shadow-md dark:border-white/40">
              <span className="text-sm font-bold text-white">
                {userEmail.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          
          {/* User Email */}
          <span className="font-semibold text-slate-800 dark:text-white">
            {userEmail}
          </span>
        </button>
      </div>
    </div>
  );
}
