"use client";

import type { MouseEvent } from "react";
import { useCallback, useEffect, useState } from "react";
import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { SignInTopBar } from "../../components/SignInTopBar";
import { SignInUserInsights } from "../../components/SignInUserInsights";

const YOUTUBE_WATCH_URL = "https://youtu.be/pIXN4iN-VQA";
const YOUTUBE_EMBED_URL = "https://www.youtube.com/embed/pIXN4iN-VQA";

/** Hero headline → sign-in; sign-in band in view → insights; otherwise nudge toward the next section down or back to sign-in. */
function resolveSigninPageFabTarget(): "signin" | "insights" {
  if (typeof window === "undefined") return "signin";
  const hero = document.getElementById("signin-hero");
  const signIn = document.getElementById("signin-form");
  const insights = document.getElementById("what-professionals-say");
  if (!hero || !signIn || !insights) return "signin";

  const vh = window.innerHeight;
  const heroRect = hero.getBoundingClientRect();
  const signInRect = signIn.getBoundingClientRect();
  const insightsRect = insights.getBoundingClientRect();

  const scrolledPastHeroHeadline = heroRect.bottom < vh * 0.4;
  const onSignIn =
    signInRect.top < vh * 0.88 &&
    signInRect.bottom > vh * 0.1 &&
    scrolledPastHeroHeadline;

  const onHero =
    heroRect.top < vh * 0.52 && heroRect.bottom > vh * 0.18 && !onSignIn;

  if (onSignIn) return "insights";
  if (onHero) return "signin";
  if (insightsRect.top > vh * 0.3) return "insights";
  return "signin";
}

export default function SignInPage() {
  const [fabTarget, setFabTarget] = useState<"signin" | "insights">("signin");

  useEffect(() => {
    const sync = () => setFabTarget(resolveSigninPageFabTarget());
    sync();
    window.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync, { passive: true });
    return () => {
      window.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, []);

  const handleFloatingScrollClick = useCallback((e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = resolveSigninPageFabTarget();
    setFabTarget(target);
    if (target === "signin") {
      document.getElementById("signin-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
      window.history.replaceState(null, "", "#signin-form");
    } else {
      document.getElementById("what-professionals-say")?.scrollIntoView({ behavior: "smooth", block: "start" });
      window.history.replaceState(null, "", "#what-professionals-say");
    }
  }, []);

  return (
    <div className="cca-signin-page-bg relative min-h-screen overflow-x-hidden text-sky-100 dark:text-sky-50">
      <SignInTopBar />

      <a
        href={fabTarget === "signin" ? "#signin-form" : "#what-professionals-say"}
        onClick={handleFloatingScrollClick}
        className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-1/2 z-[75] flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-full border border-sky-400/30 bg-[#0a1528]/75 text-sky-200 shadow-[0_0_18px_-2px_rgba(56,189,248,0.2)] backdrop-blur-md transition-all duration-300 ease-out hover:scale-110 hover:border-sky-300/70 hover:bg-[#0f1f3d]/90 hover:text-white hover:shadow-[0_0_0_1px_rgba(147,197,253,0.45),0_0_28px_rgba(59,130,246,0.55),0_0_56px_rgba(37,99,235,0.4),0_0_80px_rgba(59,130,246,0.2)] focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050b16] active:scale-100 sm:bottom-[max(1.5rem,env(safe-area-inset-bottom))] sm:h-14 sm:w-14"
        aria-label={
          fabTarget === "signin" ? "Scroll to sign in" : "Scroll to professional insights"
        }
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5 sm:h-6 sm:w-6"
          aria-hidden
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </a>

      <div className="relative pt-14 sm:pt-16">
        <main className="relative w-full max-w-none space-y-0 px-0 pb-6 pt-0 sm:pb-8 lg:pb-10">
        {/* First screen after load: headline only until scroll */}
        <section
          id="signin-hero"
          aria-labelledby="signin-hero-heading"
          className="flex min-h-[calc(100dvh-3.5rem)] w-full flex-col items-center justify-center border-b border-blue-900/45 px-4 py-10 sm:min-h-[calc(100dvh-4rem)] sm:px-6 sm:py-12 md:px-8"
        >
          <h1
            id="signin-hero-heading"
            className="max-w-4xl text-center font-bold uppercase tracking-[0.14em] text-sky-50"
          >
            <span className="block text-[clamp(1.65rem,5.2vw,3.25rem)] leading-[1.12]">
              Smarter Care.
            </span>
            <span className="mt-4 block text-[clamp(1.65rem,5.2vw,3.25rem)] leading-[1.12] sm:mt-5">
              Stronger Support.
            </span>
          </h1>
        </section>

        {/* Sign in */}
        <section
          id="signin-form"
          aria-label="Sign in form"
          className="w-full scroll-mt-14 border-x border-b border-blue-900/40 border-t-0 bg-gradient-to-b from-[#0c182f] via-[#102238] to-[#142a45] px-4 py-3 dark:border-blue-950/60 dark:from-[#060d18] dark:via-[#0a1424] dark:to-[#0e1c30] sm:scroll-mt-16 sm:px-6 sm:py-4 md:px-8 md:py-6 lg:py-7"
        >
          <div className="flex justify-center">
            <div className="relative w-full min-w-0 max-w-full sm:max-w-2xl md:max-w-3xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-7xl">
              <div
                className="cca-signin-login-card light-ui-frame cca-signin-clerk relative overflow-hidden rounded-3xl border border-white/25 bg-gradient-to-br from-[#3b82f6] via-[#2563eb] to-[#1d4ed8] p-6 shadow-[0_28px_72px_-14px_rgba(4,12,32,0.62),0_12px_28px_-8px_rgba(15,40,100,0.35)] ring-1 ring-white/15 backdrop-blur-sm before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:bg-gradient-to-br before:from-white/[0.12] before:via-transparent before:to-slate-950/25 before:content-[''] dark:border-blue-600/45 dark:from-[#2f6ee6] dark:via-[#1d4ed8] dark:to-[#153a75] dark:shadow-[0_32px_80px_-12px_rgba(0,0,0,0.55),0_14px_32px_-10px_rgba(0,0,0,0.35)] dark:ring-white/10 dark:before:from-white/[0.08] dark:before:to-slate-950/40 sm:rounded-[2rem] sm:p-9 md:rounded-[2.125rem] md:p-11 lg:rounded-[2.25rem] lg:p-12 xl:p-14"
              >
                <div className="relative z-10 w-full">
                  <SignIn
                    appearance={{
                      layout: {
                        logoPlacement: "none",
                      },
                      elements: {
                        rootBox: "mx-auto w-full",
                        card: "bg-transparent shadow-none w-full",
                        headerTitle:
                          "text-white text-[1.375rem] sm:text-3xl md:text-[2rem] font-semibold tracking-tight",
                        headerSubtitle:
                          "text-sky-100/95 text-[1.0625rem] sm:text-lg md:text-xl leading-relaxed",
                        socialButtonsBlockButton:
                          "bg-white/15 hover:bg-white/25 border-white/30 text-white font-medium text-[1.0625rem] sm:text-lg md:text-xl py-4 sm:py-[1.125rem] px-5 sm:px-8 transition-colors duration-200 !text-white min-h-[52px]",
                        socialButtonsBlockButtonText:
                          "!text-white text-[1.0625rem] sm:text-lg md:text-xl font-medium",
                        socialButtonsBlockButtonArrow: "!text-white",
                        formButtonPrimary:
                          "bg-white text-blue-700 font-semibold text-[1.0625rem] sm:text-lg md:text-xl py-4 sm:py-[1.125rem] min-h-[52px] shadow-[0_4px_14px_-2px_rgba(255,255,255,0.35),0_8px_22px_-6px_rgba(37,99,235,0.45)] transition-all duration-300 ease-out motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-[0_0_0_1px_rgba(255,255,255,0.5),0_10px_32px_-4px_rgba(255,255,255,0.55),0_22px_56px_-12px_rgba(59,130,246,0.6),0_0_48px_-8px_rgba(147,197,253,0.45)] hover:bg-sky-50 active:translate-y-0 active:shadow-[0_4px_14px_-2px_rgba(255,255,255,0.3),0_6px_18px_-6px_rgba(37,99,235,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/90 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
                        formFieldInput:
                          "bg-white/95 border-white/40 text-slate-900 text-[1.0625rem] sm:text-lg md:text-xl placeholder:text-slate-400 focus:border-white focus:ring-white/30 py-3 sm:py-3.5 px-4 sm:px-5 min-h-[52px]",
                        formFieldLabel:
                          "text-white font-semibold text-[1.0625rem] sm:text-lg md:text-xl drop-shadow-[0_1px_2px_rgba(0,0,0,0.12)]",
                        formFieldLabel__identifier: "text-white",
                        formFieldLabel__password: "text-white",
                        formFieldLabel__emailAddress: "text-white",
                        formFieldSuccessText:
                          "text-green-300 text-[1.0625rem] sm:text-lg",
                        footerActionLink:
                          "text-sky-200 hover:text-white font-medium transition-colors text-[1.0625rem] sm:text-lg min-h-[48px] inline-flex items-center",
                        footerActionText:
                          "text-sky-100/95 text-[1.0625rem] sm:text-lg leading-relaxed",
                        /** Hide Clerk’s in-card “Don’t have an account?” — we show one link below the form. */
                        footerAction__signUp: "hidden",
                        identityPreviewText: "text-white text-[1.0625rem] sm:text-lg",
                        identityPreviewEditButton:
                          "text-sky-200 hover:text-white min-h-[48px]",
                        formResendCodeLink:
                          "text-sky-200 hover:text-white min-h-[48px]",
                        otpCodeFieldInput:
                          "bg-white/95 border-white/40 text-slate-900 focus:border-white focus:ring-white/30 text-[1.0625rem] sm:text-lg md:text-xl min-h-[52px]",
                        alertText:
                          "text-red-100 bg-red-500/20 border border-red-400/30 rounded-xl p-3 sm:p-4 text-base sm:text-lg",
                        formFieldErrorText: "text-red-200 text-[1.0625rem] sm:text-lg",
                        formFieldInputShowPasswordButton:
                          "text-slate-600 hover:text-slate-900 min-h-[48px] min-w-[48px]",
                        dividerLine: "bg-white/25",
                        dividerText: "text-sky-200/90 text-[1.0625rem] sm:text-lg",
                        formHeaderTitle:
                          "text-white text-[1.375rem] sm:text-3xl md:text-[2rem] font-semibold tracking-tight",
                        formHeaderSubtitle:
                          "text-sky-100/95 text-[1.0625rem] sm:text-lg md:text-xl leading-relaxed",
                        "socialButtonsBlockButton[data-provider-id='google']":
                          "!text-white",
                        "socialButtonsBlockButton[data-provider-id='google'] *":
                          "!text-white",
                      },
                      variables: {
                        colorPrimary: "#2563eb",
                        colorBackground: "transparent",
                        colorInputBackground: "rgba(255, 255, 255, 0.95)",
                        colorInputText: "#0f172a",
                        colorText: "#ffffff",
                        colorTextSecondary: "#e0f2fe",
                        borderRadius: "1rem",
                        fontSize: "1.125rem",
                        spacing: "1.25rem",
                      },
                    }}
                    routing="path"
                    path="/signin"
                    signUpUrl="/signup"
                    fallbackRedirectUrl="/dashboard"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-center sm:mt-8">
            <p className="max-w-md text-center text-base leading-relaxed text-sky-200/95 sm:text-lg">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="inline-flex min-h-[44px] items-center font-semibold text-white underline decoration-sky-300/50 underline-offset-2 transition-colors hover:text-sky-100"
              >
                Sign up
              </Link>
            </p>
          </div>

          <div
            className="mx-auto mt-8 max-w-xl border-t border-sky-400/20 pt-6 sm:mt-10 sm:pt-7"
            role="region"
            aria-label="Trust and security"
          >
            <p className="text-center text-sm font-semibold tracking-tight text-sky-50 sm:text-base">
              Trusted by caregivers, clinicians, and dementia care professionals
            </p>
            <p className="mt-2 text-center text-xs font-medium leading-snug text-sky-100/95 sm:text-sm">
              Designed with real-world care environments in mind
            </p>
            <ul className="mx-auto mt-3 max-w-md space-y-1 text-center text-[11px] leading-tight text-sky-200/90 sm:mt-3.5 sm:text-xs">
              <li>HIPAA-conscious design</li>
              <li>Secure, encrypted access</li>
              <li>Built alongside clinicians and families</li>
            </ul>
          </div>
        </section>

        {/* Welcome — below sign-in */}
        <section
          aria-labelledby="signin-welcome-heading"
          className="w-full border border-blue-500/45 border-t-0 bg-gradient-to-r from-[#1d4ed8] via-[#2563EB] to-[#3b82f6] px-4 py-3 text-center sm:px-6 sm:py-4 md:px-8 md:py-5 dark:border-blue-800/60 dark:from-[#1e3a8a] dark:via-[#1d4ed8] dark:to-[#2563EB]"
        >
          <h2
            id="signin-welcome-heading"
            className="mx-auto max-w-2xl text-lg font-semibold leading-snug tracking-tight text-white sm:text-xl md:text-2xl"
          >
            Welcome Back — Let&apos;s Care Together
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-sky-100/95 sm:mt-3.5 sm:text-base">
            Supporting You in Every Moment of Care
          </p>
        </section>

        {/* Overview video — how it works */}
        <section
          id="how-it-works"
          aria-labelledby="how-it-works-heading"
          className="w-full scroll-mt-14 border border-blue-900/40 border-t-0 bg-gradient-to-b from-[#0d1a33] via-[#122544] to-[#162f52] px-4 py-3 dark:border-blue-950/60 dark:from-[#080f1c] dark:via-[#0c182c] dark:to-[#102038] sm:scroll-mt-16 sm:px-6 sm:py-4 md:px-8 md:py-5"
        >
          <h2
            id="how-it-works-heading"
            className="mx-auto mb-2 max-w-2xl text-center text-balance text-lg font-semibold tracking-tight text-white sm:mb-2.5 sm:text-xl md:text-2xl"
          >
            See Cognitive Care Assistant in Action
          </h2>
          <p className="mx-auto mb-4 max-w-2xl text-center text-balance text-sm font-medium leading-snug tracking-tight text-sky-100/95 sm:mb-5 sm:text-base md:text-lg">
            AI-powered support for safer, smarter dementia care.
          </p>
          <div className="mx-auto w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg">
            <div className="light-ui-frame relative overflow-hidden rounded-lg border border-blue-700/50 bg-[#f4f6fc] shadow-md dark:border-blue-600/40 dark:bg-[#1a2d4a]">
              <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
                <iframe
                  src={`${YOUTUBE_EMBED_URL}?rel=0`}
                  title="Cognitive Care Assistant – Overview & Behind the Scenes"
                  className="absolute inset-0 h-full w-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            </div>
            <p className="mx-auto mt-3 max-w-lg px-2 text-center text-xs font-medium leading-relaxed text-sky-100/95 sm:mt-3.5 sm:text-sm md:text-base">
              2-minute overview of how AI supports safer, more confident caregiving
            </p>
            <p className="mt-3 px-2 text-center text-[10px] font-bold leading-snug text-sky-100 sm:mt-3.5 sm:text-xs">
              Cognitive Care Assistant: Technology that Restores Freedom From Dementia (User Overview)
            </p>
            <p className="mt-1 px-2 text-center text-[9px] text-sky-200/90 break-all sm:text-[10px]">
              Watch on YouTube:{" "}
              <a
                href={YOUTUBE_WATCH_URL}
                target="_blank"
                rel="noreferrer"
                className="text-sky-50 underline decoration-sky-400/50 underline-offset-2 hover:text-white"
              >
                {YOUTUBE_WATCH_URL}
              </a>
            </p>
          </div>
        </section>

        <SignInUserInsights
          sectionId="what-professionals-say"
          className="w-full border border-blue-900/40 border-t-0 bg-gradient-to-b from-[#142a48] via-[#183254] to-[#1c3a60] px-4 py-2.5 dark:border-blue-950/60 dark:from-[#0c1828] dark:via-[#102030] dark:to-[#142838] sm:px-6 sm:py-3 md:px-8 md:py-4"
        />
        </main>
      </div>
    </div>
  );
}
