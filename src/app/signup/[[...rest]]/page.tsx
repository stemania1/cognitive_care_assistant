"use client";

import { SignUp } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";

export default function SignUpPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-black via-[#0b0520] to-[#0b1a3a] text-white">
      {/* Background gradients */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(1200px_600px_at_50%_-200px,rgba(168,85,247,0.25),transparent),radial-gradient(900px_500px_at_80%_120%,rgba(34,211,238,0.18),transparent),radial-gradient(800px_400px_at_10%_120%,rgba(59,130,246,0.12),transparent)]" />
      <div className="pointer-events-none absolute -top-24 right-1/2 h-[420px] w-[420px] translate-x-1/2 rounded-full bg-gradient-to-r from-fuchsia-500/25 via-purple-500/20 to-cyan-500/25 blur-3xl -z-10" />

      <main className="relative mx-auto max-w-3xl px-6 sm:px-8 py-12 sm:py-20">
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

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Create Account
          </h1>
          <p className="text-gray-300 text-sm">
            Sign up to get started with Cognitive Care Assistant
          </p>
        </div>

        {/* Clerk Sign Up Component */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-fuchsia-500/10 via-purple-500/5 to-cyan-500/10 blur-xl" />
            <div className="relative rounded-2xl border border-black/[.08] dark:border-white/[.12] bg-white/5 dark:bg-white/5 backdrop-blur p-6 sm:p-8">
              <SignUp
                appearance={{
                  elements: {
                    rootBox: "mx-auto",
                    card: "bg-transparent shadow-none",
                    headerTitle: "text-white",
                    headerSubtitle: "text-gray-300",
                    socialButtonsBlockButton: "bg-white/10 hover:bg-white/20 border-white/20 text-white",
                    formButtonPrimary: "bg-gradient-to-r from-purple-500 via-fuchsia-500 to-cyan-500 hover:from-purple-600 hover:via-fuchsia-600 hover:to-cyan-600",
                    formFieldInput: "bg-white/10 border-white/20 text-white",
                    formFieldLabel: "text-gray-200",
                    footerActionLink: "text-purple-400 hover:text-purple-300",
                    identityPreviewText: "text-gray-300",
                    identityPreviewEditButton: "text-purple-400 hover:text-purple-300",
                    formResendCodeLink: "text-purple-400 hover:text-purple-300",
                    otpCodeFieldInput: "bg-white/10 border-white/20 text-white",
                    alertText: "text-red-400",
                    formFieldErrorText: "text-red-400",
                  },
                }}
                routing="path"
                path="/signup"
                signInUrl="/signin"
                afterSignUpUrl="/dashboard"
              />
            </div>
          </div>
        </div>

        {/* Sign In Link */}
        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm">
            Already have an account?{" "}
            <Link
              href="/signin"
              className="text-purple-400 hover:text-purple-300 font-medium transition-colors duration-200"
            >
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

