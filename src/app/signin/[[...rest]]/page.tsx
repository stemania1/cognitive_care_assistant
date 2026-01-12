"use client";

import { SignIn } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";

const YOUTUBE_WATCH_URL = "https://youtu.be/pIXN4iN-VQA";
const YOUTUBE_EMBED_URL = "https://www.youtube.com/embed/pIXN4iN-VQA";

export default function SignInPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-black via-[#0b0520] to-[#0b1a3a] text-white">
      {/* Background gradients */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(1200px_600px_at_50%_-200px,rgba(168,85,247,0.25),transparent),radial-gradient(900px_500px_at_80%_120%,rgba(34,211,238,0.18),transparent),radial-gradient(800px_400px_at_10%_120%,rgba(59,130,246,0.12),transparent)]" />
      <div className="pointer-events-none absolute -top-24 right-1/2 h-[420px] w-[420px] translate-x-1/2 rounded-full bg-gradient-to-r from-fuchsia-500/25 via-purple-500/20 to-cyan-500/25 blur-3xl -z-10" />

      <main className="relative mx-auto max-w-6xl px-4 sm:px-6 md:px-8 py-6 sm:py-12 md:py-20">
        {/* Logo and Title */}
        <div className="flex flex-col items-center text-center gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-fuchsia-500/30 via-purple-500/20 to-cyan-500/30 blur-xl" />
            <div className="relative rounded-2xl border border-black/[.08] dark:border-white/[.12] bg-white/5 dark:bg-white/5 backdrop-blur p-3 sm:p-4">
              <Image
                src="/digital_brain.png"
                alt="Cognitive Care Assistant logo"
                width={96}
                height={96}
                priority
                className="h-14 w-14 sm:h-16 sm:w-16 md:h-20 md:w-20 object-contain drop-shadow"
              />
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white">
            Welcome Back
          </h1>
          <p className="text-gray-300 text-sm sm:text-base px-2">
            Sign in to access your Cognitive Care Assistant
          </p>
        </div>

        {/* Overview Video (YouTube Embed) */}
        <div className="mb-6 sm:mb-8">
          <div className="relative rounded-xl sm:rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
            <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
              <iframe
                src={`${YOUTUBE_EMBED_URL}?rel=0`}
                title="Cognitive Care Assistant – Overview & Behind the Scenes"
                className="absolute inset-0 w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </div>
          <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-gray-300 text-center font-bold px-2">
            Cognitive Care Assistant: Technology that Restores Freedom From Dementia (User Overview)
          </p>
          <p className="mt-1 text-[10px] sm:text-[11px] text-gray-400 text-center px-2 break-all">
            Watch on YouTube: <a href={YOUTUBE_WATCH_URL} target="_blank" rel="noreferrer" className="underline break-all">{YOUTUBE_WATCH_URL}</a>
          </p>
        </div>

        {/* Clerk Sign In Component - Larger and clearer */}
        <div className="flex justify-center">
          <div className="relative w-full max-w-3xl">
            <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-fuchsia-500/20 via-purple-500/10 to-cyan-500/20 blur-xl" />
            <div className="relative rounded-xl sm:rounded-2xl border border-white/20 bg-black/40 backdrop-blur-xl p-4 sm:p-8 md:p-12 shadow-2xl">
              <div className="scale-100 sm:scale-110 md:scale-125">
              <SignIn
                appearance={{
                  elements: {
                      rootBox: "mx-auto w-full",
                      card: "bg-transparent shadow-none w-full",
                      headerTitle: "text-white text-2xl sm:text-3xl font-bold",
                      headerSubtitle: "text-gray-300 text-base sm:text-lg",
                      socialButtonsBlockButton: "bg-gradient-to-r from-purple-500/20 via-fuchsia-500/20 to-cyan-500/20 hover:from-purple-500/30 hover:via-fuchsia-500/30 hover:to-cyan-500/30 border-white/30 text-white font-medium text-base sm:text-lg py-3 sm:py-4 px-4 sm:px-6 transition-all duration-200 !text-white min-h-[44px]",
                      socialButtonsBlockButtonText: "!text-white text-base sm:text-lg font-medium",
                      socialButtonsBlockButtonArrow: "!text-white",
                      formButtonPrimary: "bg-gradient-to-r from-purple-500 via-fuchsia-500 to-cyan-500 hover:from-purple-600 hover:via-fuchsia-600 hover:to-cyan-600 text-white font-semibold text-base sm:text-lg py-3 sm:py-4 shadow-lg min-h-[44px]",
                      formFieldInput: "bg-black/40 border-white/30 text-white text-base sm:text-lg placeholder:text-gray-500 focus:border-purple-500 focus:ring-purple-500/50 py-2.5 sm:py-3 px-3 sm:px-4 min-h-[44px]",
                      formFieldLabel: "text-gray-200 font-medium text-base sm:text-lg",
                      formFieldSuccessText: "text-green-400 text-sm sm:text-base",
                      footerActionLink: "text-purple-400 hover:text-purple-300 font-medium transition-colors text-sm sm:text-base min-h-[44px] inline-flex items-center",
                      footerActionText: "text-gray-300 text-sm sm:text-base",
                      identityPreviewText: "text-gray-200 text-sm sm:text-base",
                      identityPreviewEditButton: "text-purple-400 hover:text-purple-300 min-h-[44px]",
                      formResendCodeLink: "text-purple-400 hover:text-purple-300 min-h-[44px]",
                      otpCodeFieldInput: "bg-black/40 border-white/30 text-white focus:border-purple-500 focus:ring-purple-500/50 text-base sm:text-lg min-h-[44px]",
                      alertText: "text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-2 sm:p-3 text-sm sm:text-base",
                      formFieldErrorText: "text-red-400 text-sm sm:text-base",
                      formFieldInputShowPasswordButton: "text-gray-400 hover:text-white min-h-[44px] min-w-[44px]",
                      dividerLine: "bg-white/20",
                      dividerText: "text-gray-400 text-sm sm:text-base",
                      formHeaderTitle: "text-white text-2xl sm:text-3xl font-bold",
                      formHeaderSubtitle: "text-gray-300 text-base sm:text-lg",
                      // Google button specific styling
                      "socialButtonsBlockButton[data-provider-id='google']": "!text-white",
                      "socialButtonsBlockButton[data-provider-id='google'] *": "!text-white",
                    },
                    variables: {
                      colorPrimary: "#a855f7",
                      colorBackground: "transparent",
                      colorInputBackground: "rgba(0, 0, 0, 0.4)",
                      colorInputText: "#ffffff",
                      colorText: "#ffffff",
                      colorTextSecondary: "#d1d5db",
                      borderRadius: "0.5rem",
                    },
                  }}
                  routing="path"
                  path="/signin"
                  signUpUrl="/signup"
                  afterSignInUrl="/dashboard"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sign Up Link */}
        <div className="mt-6 sm:mt-8 text-center px-4">
          <p className="text-gray-300 text-sm sm:text-base">
            Don't have an account?{" "}
            <Link
              href="/signup"
              className="text-purple-400 hover:text-purple-300 font-semibold transition-colors duration-200 underline min-h-[44px] inline-flex items-center"
            >
              Sign up
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
