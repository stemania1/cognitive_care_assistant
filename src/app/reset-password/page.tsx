"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState } from "react";

function ResetPasswordInner() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") || "";
  const email = params.get("email") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, newPassword: password }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError("Reset link is invalid or expired.");
        return;
      }
      // Demo-only: update localStorage user store on client to reflect new password
      try {
        const raw = localStorage.getItem("auth:users");
        const users = raw ? JSON.parse(raw) : {};
        const key = String(email).trim().toLowerCase();
        if (users[key]) {
          users[key].password = password;
          localStorage.setItem("auth:users", JSON.stringify(users));
        }
      } catch {}
      setOk(true);
      setTimeout(() => router.push("/signin"), 1200);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-black via-[#0b0520] to-[#0b1a3a] text-white">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(1200px_600px_at_50%_-200px,rgba(168,85,247,0.25),transparent),radial-gradient(900px_500px_at_80%_120%,rgba(34,211,238,0.18),transparent),radial-gradient(800px_400px_at_10%_120%,rgba(59,130,246,0.12),transparent)]" />
      <div className="pointer-events-none absolute -top-24 right-1/2 h-[420px] w-[420px] translate-x-1/2 rounded-full bg-gradient-to-r from-fuchsia-500/25 via-purple-500/20 to-cyan-500/25 blur-3xl -z-10" />

      <main className="relative mx-auto max-w-md px-6 sm:px-8 py-12 sm:py-20">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-semibold">Reset Password</h1>
          <p className="opacity-80 text-sm">Enter a new password for {email || "your account"}.</p>
        </div>

        <div className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-6">
          {ok ? (
            <p className="text-emerald-300 text-sm">Password updated! Redirecting to sign in…</p>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              {error && <div className="rounded-md border border-red-400/30 bg-red-500/10 text-red-300 p-2 text-sm">{error}</div>}
              <div>
                <label className="block text-sm mb-1">New Password</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} value={password} onChange={(e)=>setPassword(e.target.value)} required className="w-full pr-12 px-3 py-2 rounded-md border border-white/10 bg-white/10 outline-none" />
                  <button type="button" onClick={()=>setShowPassword(v=>!v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-white" aria-label={showPassword?"Hide password":"Show password"}>👁</button>
                </div>
              </div>
              <div>
                <label className="block text-sm mb-1">Confirm Password</label>
                <div className="relative">
                  <input type={showConfirm ? "text" : "password"} value={confirm} onChange={(e)=>setConfirm(e.target.value)} required className="w-full pr-12 px-3 py-2 rounded-md border border-white/10 bg-white/10 outline-none" />
                  <button type="button" onClick={()=>setShowConfirm(v=>!v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-white" aria-label={showConfirm?"Hide password":"Show password"}>👁</button>
                </div>
              </div>
              <button type="submit" disabled={isLoading} className="w-full py-2 rounded-md bg-gradient-to-r from-purple-500 via-fuchsia-500 to-cyan-500 hover:from-purple-600 hover:via-fuchsia-600 hover:to-cyan-600 disabled:opacity-50">
                {isLoading ? "Saving…" : "Update password"}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm">Loading…</div>}>
      <ResetPasswordInner />
    </Suspense>
  );
}



