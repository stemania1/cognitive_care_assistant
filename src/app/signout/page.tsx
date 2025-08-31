"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function SignOut() {
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const router = useRouter();

  const handleSignOut = async () => {
    setIsLoading(true);
    
    try {
      // TODO: Implement actual sign out logic here
      // Clear authentication tokens, user session, etc.
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Set confirmed state to show success message
      setIsConfirmed(true);
      
      // Redirect to home page after a brief delay
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (err) {
      console.error("Error signing out:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (isConfirmed) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-black via-[#0b0520] to-[#0b1a3a] text-white">
        {/* Background gradients */}
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(1200px_600px_at_50%_-200px,rgba(168,85,247,0.25),transparent),radial-gradient(900px_500px_at_80%_120%,rgba(34,211,238,0.18),transparent),radial-gradient(800px_400px_at_10%_120%,rgba(59,130,246,0.12),transparent)]" />
        <div className="pointer-events-none absolute -top-24 right-1/2 h-[420px] w-[420px] translate-x-1/2 rounded-full bg-gradient-to-r from-fuchsia-500/25 via-purple-500/20 to-cyan-500/25 blur-3xl -z-10" />

        <main className="relative mx-auto max-w-md px-6 sm:px-8 py-12 sm:py-20">
          {/* Logo and Title */}
          <div className="flex flex-col items-center text-center gap-6 mb-10">
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-fuchsia-500/30 via-purple-500/20 to-cyan-500/30 blur-xl" />
              <div className="relative rounded-2xl border border-black/[.08] dark:border-white/[.12] bg-white/5 dark:bg-white/5 backdrop-blur p-4">
                <Image
                  src="/digital_brain.png"
                  alt="Cognitive Care Assistant logo"
                  width={96}
                  height={96}
                  priority
                  className="h-16 w-16 sm:h-20 sm:w-20 object-contain drop-shadow"
                />
              </div>
            </div>

            <div className="text-center">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
                Signed Out Successfully
              </h1>
              <p className="text-gray-300 text-sm">
                You have been signed out of your account
              </p>
            </div>
          </div>

          {/* Success Message */}
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-green-500/10 via-emerald-500/5 to-teal-500/10 blur-xl" />
            <div className="relative rounded-2xl border border-black/[.08] dark:border-white/[.12] bg-white/5 dark:bg-white/5 backdrop-blur p-6 sm:p-8 text-center">
              <div className="mb-6">
                <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-8 h-8 text-green-400"
                  >
                    <path
                      fillRule="evenodd"
                      d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <p className="text-gray-300">
                  Redirecting you to the home page...
                </p>
              </div>

              <div className="space-y-3">
                <Link
                  href="/signin"
                  className="block w-full py-3 px-4 rounded-lg bg-gradient-to-r from-purple-500 via-fuchsia-500 to-cyan-500 text-white font-medium hover:from-purple-600 hover:via-fuchsia-600 hover:to-cyan-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:ring-offset-2 focus:ring-offset-black transition-all duration-200"
                >
                  Sign In Again
                </Link>
                
                <Link
                  href="/"
                  className="block w-full py-3 px-4 rounded-lg border border-white/20 bg-white/5 text-white font-medium hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-black transition-all duration-200"
                >
                  Go to Home
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-black via-[#0b0520] to-[#0b1a3a] text-white">
      {/* Background gradients */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(1200px_600px_at_50%_-200px,rgba(168,85,247,0.25),transparent),radial-gradient(900px_500px_at_80%_120%,rgba(34,211,238,0.18),transparent),radial-gradient(800px_400px_at_10%_120%,rgba(59,130,246,0.12),transparent)]" />
      <div className="pointer-events-none absolute -top-24 right-1/2 h-[420px] w-[420px] translate-x-1/2 rounded-full bg-gradient-to-r from-fuchsia-500/25 via-purple-500/20 to-cyan-500/25 blur-3xl -z-10" />

      <main className="relative mx-auto max-w-md px-6 sm:px-8 py-12 sm:py-20">
        {/* Logo and Title */}
        <div className="flex flex-col items-center text-center gap-6 mb-10">
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-fuchsia-500/30 via-purple-500/20 to-cyan-500/30 blur-xl" />
            <div className="relative rounded-2xl border border-black/[.08] dark:border-white/[.12] bg-white/5 dark:bg-white/5 backdrop-blur p-4">
              <Image
                src="/digital_brain.png"
                alt="Cognitive Care Assistant logo"
                width={96}
                height={96}
                priority
                className="h-16 w-16 sm:h-20 sm:w-20 object-contain drop-shadow"
              />
            </div>
          </div>

          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
              Sign Out
            </h1>
            <p className="text-gray-300 text-sm">
              Are you sure you want to sign out?
            </p>
          </div>
        </div>

        {/* Confirmation Dialog */}
        <div className="relative">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-fuchsia-500/10 via-purple-500/5 to-cyan-500/10 blur-xl" />
          <div className="relative rounded-2xl border border-black/[.08] dark:border-white/[.12] bg-white/5 dark:bg-white/5 backdrop-blur p-6 sm:p-8">
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-8 h-8 text-orange-400"
                >
                  <path
                    fillRule="evenodd"
                    d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <p className="text-gray-300 text-sm">
                You will lose access to your dashboard and all features until you sign in again.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleSignOut}
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-red-500 via-pink-500 to-rose-500 text-white font-medium hover:from-red-600 hover:via-pink-600 hover:to-rose-600 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:ring-offset-2 focus:ring-offset-black transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Signing out...</span>
                  </div>
                ) : (
                  "Yes, Sign Me Out"
                )}
              </button>

              <button
                onClick={handleCancel}
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-lg border border-white/20 bg-white/5 text-white font-medium hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-black transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>

        {/* Back to Dashboard Link */}
        <div className="mt-8 text-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center space-x-2 text-gray-400 hover:text-white transition-colors duration-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-4 w-4"
            >
              <path d="M7.828 11H20v2H7.828l5.364 5.364-1.414 1.414L4 12l7.778-7.778 1.414 1.414L7.828 11z" />
            </svg>
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
