"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 900));
      setSent(true);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-black via-[#0b0520] to-[#0b1a3a] text-white">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(1200px_600px_at_50%_-200px,rgba(168,85,247,0.25),transparent),radial-gradient(900px_500px_at_80%_120%,rgba(34,211,238,0.18),transparent),radial-gradient(800px_400px_at_10%_120%,rgba(59,130,246,0.12),transparent)]" />
      <div className="pointer-events-none absolute -top-24 right-1/2 h-[420px] w-[420px] translate-x-1/2 rounded-full bg-gradient-to-r from-fuchsia-500/25 via-purple-500/20 to-cyan-500/25 blur-3xl -z-10" />

      <main className="relative mx-auto max-w-md px-6 sm:px-8 py-12 sm:py-20">
        <div className="flex flex-col items-center text-center gap-6 mb-10">
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-fuchsia-500/30 via-purple-500/20 to-cyan-500/30 blur-xl" />
            <div className="relative rounded-2xl border border-black/[.08] dark:border-white/[.12] bg-white/5 dark:bg-white/5 backdrop-blur p-4">
              <Image src="/digital_brain.png" alt="Cognitive Care Assistant logo" width={96} height={96} className="h-16 w-16 sm:h-20 sm:w-20 object-contain drop-shadow" />
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Forgot your password?</h1>
          <p className="text-gray-300 text-sm">Enter your email to receive a reset link.</p>
        </div>

        <div className="relative">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-fuchsia-500/10 via-purple-500/5 to-cyan-500/10 blur-xl" />
          <div className="relative rounded-2xl border border-black/[.08] dark:border-white/[.12] bg-white/5 dark:bg-white/5 backdrop-blur p-6 sm:p-8">
            {sent ? (
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4">✅</div>
                <p className="text-gray-200">If an account exists for {email}, a reset link has been sent.</p>
                <Link href="/signin" className="mt-6 inline-block py-2 px-4 rounded-lg border border-white/20 bg-white/5 text-white text-sm hover:bg-white/10">Back to Sign In</Link>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-200">Email Address</label>
                  <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-3 rounded-lg border border-black/[.08] dark:border-white/[.12] bg-white/10 backdrop-blur text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent" placeholder="Enter your email" />
                </div>
                <button type="submit" disabled={isLoading} className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-purple-500 via-fuchsia-500 to-cyan-500 text-white font-medium hover:from-purple-600 hover:via-fuchsia-600 hover:to-cyan-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50">
                  {isLoading ? "Sending..." : "Send reset link"}
                </button>
                <div className="text-center">
                  <Link href="/signin" className="inline-block mt-3 text-purple-400 hover:text-purple-300 text-sm">Back to Sign In</Link>
                </div>
              </form>
            )}
          </div>
        </div>

        
      </main>
    </div>
  );
}


