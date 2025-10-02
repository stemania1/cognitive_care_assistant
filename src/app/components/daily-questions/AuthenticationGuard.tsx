import Link from 'next/link';

interface AuthenticationGuardProps {
  children: React.ReactNode;
  userId: string | null;
}

export function AuthenticationGuard({ children, userId }: AuthenticationGuardProps) {
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

  return <>{children}</>;
}
