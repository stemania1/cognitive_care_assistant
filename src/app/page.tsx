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
    <div className="min-h-screen bg-gradient-to-br from-black via-[#0b0520] to-[#0b1a3a] text-white flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-300">Redirecting to sign in...</p>
      </div>
    </div>
  );
}
