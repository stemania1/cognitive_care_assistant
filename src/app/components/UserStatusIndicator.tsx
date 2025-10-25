'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { isGuestUser } from '@/lib/guestDataManager';

export function UserStatusIndicator() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [loading, setLoading] = useState(true);

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
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserEmail(user.email);
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUserEmail(session.user.email);
        setIsGuest(false);
      } else {
        setUserEmail(null);
        setIsGuest(false);
      }
    });

    return () => subscription.unsubscribe();
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
    <div className="fixed top-4 right-4 z-50">
      <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 text-sm text-white/90 border border-white/20">
        <span className="text-white/70">Logged in as:</span>{' '}
        <span className={`font-medium ${isGuest ? 'text-yellow-400' : 'text-cyan-400'}`}>
          {isGuest ? 'Guest' : userEmail || 'Not logged in'}
        </span>
      </div>
    </div>
  );
}
