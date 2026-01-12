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
        <button className="relative bg-white/15 backdrop-blur-sm rounded-lg px-4 py-2.5 text-base text-white border-2 border-white/30 shadow-lg flex items-center gap-3 hover:bg-white/20 transition-colors cursor-pointer">
          {/* Profile Image */}
          {profileImageUrl ? (
            <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-white/40 flex-shrink-0 shadow-md">
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
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 border-2 border-white/40 flex items-center justify-center flex-shrink-0 shadow-md">
              <span className="text-white text-sm font-bold">
                {userEmail.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          
          {/* User Email */}
          <span className="font-semibold text-white">
            {userEmail}
          </span>
        </button>
      </div>
    </div>
  );
}
