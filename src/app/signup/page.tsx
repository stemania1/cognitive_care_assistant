"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setIsLoading(true);
    try {
      // TODO: send to API to create account
      await new Promise((r) => setTimeout(r, 1000));
      router.push("/signin");
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

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Create your account</h1>
          <p className="text-gray-300 text-sm">Join Cognitive Care Assistant</p>
        </div>

        <div className="relative">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-fuchsia-500/10 via-purple-500/5 to-cyan-500/10 blur-xl" />
          <div className="relative rounded-2xl border border-black/[.08] dark:border-white/[.12] bg-white/5 dark:bg-white/5 backdrop-blur p-6 sm:p-8">
            <form onSubmit={onSubmit} className="space-y-5">
              {error && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-red-400 text-sm">{error}</div>
              )}
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-200">Full Name</label>
                <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-4 py-3 rounded-lg border border-black/[.08] dark:border-white/[.12] bg-white/10 backdrop-blur text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent" placeholder="Jane Doe" />
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-200">Email Address</label>
                <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-3 rounded-lg border border-black/[.08] dark:border-white/[.12] bg-white/10 backdrop-blur text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent" placeholder="you@example.com" />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-200">Password</label>
                <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-4 py-3 rounded-lg border border-black/[.08] dark:border-white/[.12] bg-white/10 backdrop-blur text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent" placeholder="Enter a password" />
              </div>
              <div className="space-y-2">
                <label htmlFor="confirm" className="block text-sm font-medium text-gray-200">Confirm Password</label>
                <input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required className="w-full px-4 py-3 rounded-lg border border-black/[.08] dark:border-white/[.12] bg-white/10 backdrop-blur text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent" placeholder="Re-enter your password" />
              </div>
              <button type="submit" disabled={isLoading} className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-purple-500 via-fuchsia-500 to-cyan-500 text-white font-medium hover:from-purple-600 hover:via-fuchsia-600 hover:to-cyan-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50">
                {isLoading ? "Creating account..." : "Create account"}
              </button>
            </form>

            <div className="mt-6 text-center text-gray-400 text-sm">
              Already have an account? <Link href="/signin" className="text-purple-400 hover:text-purple-300">Sign in</Link>
            </div>
            <div className="text-center">
              <Link href="/signin" className="inline-block mt-3 text-purple-400 hover:text-purple-300 text-sm">Back to Sign In</Link>
            </div>
          </div>
        </div>

        
      </main>
    </div>
  );
}


