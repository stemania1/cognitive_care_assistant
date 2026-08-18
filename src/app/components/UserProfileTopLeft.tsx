'use client';

import { useUser } from '@clerk/nextjs';
import Image from 'next/image';
import SpecularButton from './SpecularButton';

type UserProfileTopLeftProps = {
  /** Extra horizontal offset (px) so the chip clears a left sidebar. */
  sidebarInsetPx?: number;
};

export function UserProfileTopLeft({ sidebarInsetPx = 0 }: UserProfileTopLeftProps) {
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
    <div
      className="fixed top-4 z-50 transition-[left] duration-200 ease-out"
      style={{ left: `calc(1rem + ${sidebarInsetPx}px)` }}
    >
      <SpecularButton
        size="md"
        radius={12}
        tint="#ffffff"
        tintOpacity={0.1}
        blur={12}
        textColor="#f1f5f9"
        lineColor="#e879f9"
        baseColor="#334155"
        intensity={1.1}
        shineSize={12}
        shineFade={36}
        thickness={1.25}
        followMouse
        proximity={280}
        className="cca-dashboard-specular-btn"
        type="button"
      >
        <span className="inline-flex items-center gap-3">
          {profileImageUrl ? (
            <span className="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-white/30 shadow-md">
              <Image
                src={profileImageUrl}
                alt=""
                width={40}
                height={40}
                className="object-cover"
                unoptimized
                aria-hidden
              />
            </span>
          ) : (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-white/30 bg-gradient-to-br from-purple-500 to-cyan-500 shadow-md">
              <span className="text-sm font-bold text-white" aria-hidden>
                {userEmail.charAt(0).toUpperCase()}
              </span>
            </span>
          )}
          <span className="font-semibold">{userEmail}</span>
        </span>
      </SpecularButton>
    </div>
  );
}
