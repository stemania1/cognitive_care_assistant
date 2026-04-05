"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to sign-in page immediately
    router.replace("/signin");
  }, [router]);

  // Show a minimal loading state while redirecting
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50 to-sky-100 text-slate-900 dark:from-black dark:via-[#0b0520] dark:to-[#0b1a3a] dark:text-white flex items-center justify-center">
      <div className="text-center">
        <p className="text-slate-600 dark:text-gray-300">Redirecting to sign in...</p>
      </div>
    </div>
  );
}
