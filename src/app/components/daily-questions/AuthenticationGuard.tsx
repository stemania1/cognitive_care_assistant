import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { useState, useEffect } from 'react';

interface AuthenticationGuardProps {
  children: React.ReactNode;
  userId: string | null;
}

export function AuthenticationGuard({ children, userId }: AuthenticationGuardProps) {
  const [isGuest, setIsGuest] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUserType = async () => {
      if (userId) {
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
          const { data: { user } } = await supabase.auth.getUser();
          setIsGuest(user?.is_anonymous || false);
        } catch (error) {
          console.error('Error checking user type:', error);
          setIsGuest(false);
        }
      }
      setIsLoading(false);
    };

    checkUserType();
  }, [userId]);

  if (isLoading) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-black via-[#0b0520] to-[#0b1a3a] text-white">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(1200px_600px_at_50%_-200px,rgba(168,85,247,0.25),transparent),radial-gradient(900px_500px_at_80%_120%,rgba(34,211,238,0.18),transparent),radial-gradient(800px_400px_at_10%_120%,rgba(59,130,246,0.12),transparent)]" />
        <div className="pointer-events-none absolute -top-24 right-1/2 h-[420px] w-[420px] translate-x-1/2 rounded-full bg-gradient-to-r from-fuchsia-500/25 via-purple-500/20 to-cyan-500/25 blur-3xl -z-10" />

        <main className="relative p-8 sm:p-16">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-black via-[#0b0520] to-[#0b1a3a] text-white">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(1200px_600px_at_50%_-200px,rgba(168,85,247,0.25),transparent),radial-gradient(900px_500px_at_80%_120%,rgba(34,211,238,0.18),transparent),radial-gradient(800px_400px_at_10%_120%,rgba(59,130,246,0.12),transparent)]" />
        <div className="pointer-events-none absolute -top-24 right-1/2 h-[420px] w-[420px] translate-x-1/2 rounded-full bg-gradient-to-r from-fuchsia-500/25 via-purple-500/20 to-cyan-500/25 blur-3xl -z-10" />

        <main className="relative p-8 sm:p-16">
          <div className="mx-auto max-w-3xl">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex flex-col">
                <h1 className="text-2xl sm:text-3xl font-semibold">Daily Questions</h1>
              </div>
              <Link href="/dashboard" className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20">
                Back to Home
              </Link>
            </div>
            
            <div className="rounded-lg border border-white/10 bg-white/5 p-8 text-center">
              <h2 className="text-xl font-semibold mb-4">Please Sign In</h2>
              <p className="text-white/70 mb-6">You need to be signed in to access the daily questions feature.</p>
              <Link href="/signin" className="inline-flex items-center rounded-full bg-cyan-500 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-cyan-600">
                Sign In
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Show guest warning if user is anonymous
  if (isGuest) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-black via-[#0b0520] to-[#0b1a3a] text-white">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(1200px_600px_at_50%_-200px,rgba(168,85,247,0.25),transparent),radial-gradient(900px_500px_at_80%_120%,rgba(34,211,238,0.18),transparent),radial-gradient(800px_400px_at_10%_120%,rgba(59,130,246,0.12),transparent)]" />
        <div className="pointer-events-none absolute -top-24 right-1/2 h-[420px] w-[420px] translate-x-1/2 rounded-full bg-gradient-to-r from-fuchsia-500/25 via-purple-500/20 to-cyan-500/25 blur-3xl -z-10" />

        <main className="relative p-8 sm:p-16">
          <div className="mx-auto max-w-3xl">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex flex-col">
                <h1 className="text-2xl sm:text-3xl font-semibold">Daily Questions</h1>
              </div>
              <Link href="/dashboard" className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20">
                Back to Home
              </Link>
            </div>
            
            <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-8 text-center mb-6">
              <h2 className="text-xl font-semibold mb-4 text-yellow-400">Guest Account</h2>
              <p className="text-white/70 mb-6">
                You're using a guest account. Your data will be temporary and limited features are available.
                <br />
                <span className="text-yellow-400 font-medium">Create a free account to save your progress permanently.</span>
              </p>
              <div className="flex gap-4 justify-center">
                <Link href="/signup" className="inline-flex items-center rounded-full bg-cyan-500 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-cyan-600">
                  Create Account
                </Link>
                <button 
                  onClick={() => setIsGuest(false)}
                  className="inline-flex items-center rounded-full bg-white/10 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-white/20"
                >
                  Continue as Guest
                </button>
              </div>
            </div>

            {children}
          </div>
        </main>
      </div>
    );
  }

  return <>{children}</>;
}
