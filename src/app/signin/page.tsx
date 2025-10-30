"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import HCaptcha from "@hcaptcha/react-hcaptcha";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const router = useRouter();
  const captchaRef = useRef<HCaptcha>(null);
  const overviewVideoRef = useRef<HTMLVideoElement | null>(null);
  const [showPlayOverlay, setShowPlayOverlay] = useState(true);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState(false);

  useEffect(() => {
    // No autoplay; rely on click-to-play for reliability on production/mobile
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      if (!isSupabaseConfigured) {
        setError("Auth is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, then restart the dev server.");
        return;
      }

      if (!captchaToken) {
        setError("Please complete the CAPTCHA verification.");
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({ 
        email, 
        password,
        options: {
          captchaToken: captchaToken
        }
      });
      
      if (signInError) {
        setError(signInError.message || "Invalid email or password. Please try again.");
        // Reset CAPTCHA on error
        if (captchaRef.current) {
          captchaRef.current.resetCaptcha();
        }
        setCaptchaToken(null);
        return;
      }
      router.push("/dashboard");
    } catch (err) {
      setError("Invalid email or password. Please try again.");
      // Reset CAPTCHA on error
      if (captchaRef.current) {
        captchaRef.current.resetCaptcha();
      }
      setCaptchaToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    setIsLoading(true);
    setError("");

    try {
      if (!isSupabaseConfigured) {
        setError("Auth is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, then restart the dev server.");
        return;
      }

      if (!captchaToken) {
        // Show popup for captcha verification
        alert("Please verify that you are human by completing the security verification above before signing in as a guest.");
        setIsLoading(false);
        return;
      }
      
      // Try anonymous sign-in first
      const { error: guestError } = await supabase.auth.signInAnonymously({
        options: {
          captchaToken: captchaToken
        }
      });
      if (guestError) {
        // If anonymous auth fails, create a temporary guest session
        console.log("Anonymous auth disabled, using fallback guest mode");
        
        // Create a temporary guest user ID
        const guestUserId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Store guest session in localStorage
        localStorage.setItem('cognitive_care_guest_session', JSON.stringify({
          userId: guestUserId,
          isGuest: true,
          createdAt: new Date().toISOString()
        }));
        
        // Reset CAPTCHA after successful guest login
        if (captchaRef.current) {
          captchaRef.current.resetCaptcha();
        }
        setCaptchaToken(null);
        
        // Redirect to dashboard
        router.push("/dashboard");
        return;
      }
      
      // Reset CAPTCHA after successful anonymous login
      if (captchaRef.current) {
        captchaRef.current.resetCaptcha();
      }
      setCaptchaToken(null);
      
      router.push("/dashboard");
    } catch (err) {
      setError("Unable to sign in as guest. Please try again.");
      // Reset CAPTCHA on error
      if (captchaRef.current) {
        captchaRef.current.resetCaptcha();
      }
      setCaptchaToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCaptchaVerify = (token: string) => {
    setCaptchaToken(token);
  };

  const handleCaptchaExpire = () => {
    setCaptchaToken(null);
  };

  const handleCaptchaError = () => {
    setCaptchaToken(null);
    setError("CAPTCHA verification failed. Please try again.");
  };

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
            Welcome Back
          </h1>
          <p className="text-gray-300 text-sm">
            Sign in to access your Cognitive Care Assistant
          </p>
        </div>

        {/* Overview Video */}
        <div className="mb-10">
          <div className="relative rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
            <video
              ref={overviewVideoRef}
              className="w-full aspect-video object-cover"
              controls
              playsInline
              webkit-playsinline="true"
              x5-playsinline="true"
              preload="none"
              controlsList="nodownload"
              onLoadedData={() => setIsVideoLoading(false)}
              onPlay={() => setShowPlayOverlay(false)}
              onWaiting={() => setIsVideoLoading(true)}
              onError={() => { setVideoError(true); setIsVideoLoading(false); setShowPlayOverlay(false); }}
              poster="/digital_brain.png"
            >
              <source
                src="/videos/cognitive-care-assistant-user-overview-and-behind-the-scenes-mobile.mp4"
                type="video/mp4"
                media="(max-width: 768px)"
              />
              <source
                src="/videos/cognitive-care-assistant-user-overview-and-behind-the-scenes-compressed.mp4"
                type="video/mp4"
              />
            </video>
            {showPlayOverlay && (
              <button
                type="button"
                aria-label="Play video"
                onClick={async () => {
                  const v = overviewVideoRef.current;
                  if (!v) return;
                  try {
                    setIsVideoLoading(true);
                    await v.play();
                    setShowPlayOverlay(false);
                  } catch {
                    setIsVideoLoading(false);
                  }
                }}
                className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/20 transition"
              >
                <span className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/90 text-black text-3xl">▶</span>
              </button>
            )}
            {isVideoLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-10 h-10 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              </div>
            )}
            {videoError && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <div className="text-center p-4">
                  <p className="text-sm text-red-300 mb-2">Unable to play video.</p>
                  <a href="/videos/cognitive-care-assistant-user-overview-and-behind-the-scenes-compressed.mp4" target="_blank" className="text-cyan-300 underline">
                    Open video in a new tab
                  </a>
                </div>
              </div>
            )}
          </div>
          <p className="mt-3 text-sm text-gray-300 text-center">
            Cognitive Care Assistant – Overview & Behind the Scenes
          </p>
        </div>

        {/* Sign In Form */}
        <div className="relative max-w-md mx-auto">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-fuchsia-500/10 via-purple-500/5 to-cyan-500/10 blur-xl" />
          <div className="relative rounded-2xl border border-black/[.08] dark:border-white/[.12] bg-white/5 dark:bg-white/5 backdrop-blur p-6 sm:p-8">
            <form onSubmit={handleSignIn} className="space-y-6">
              {error && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-200">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-black/[.08] dark:border-white/[.12] bg-white/10 backdrop-blur text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your email"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-200">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-black/[.08] dark:border-white/[.12] bg-white/10 backdrop-blur text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your password"
                />
              </div>

              {/* CAPTCHA Widget */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-200">
                  Security Verification
                </label>
                <div className="flex justify-center">
                  <HCaptcha
                    ref={captchaRef}
                    sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY || "10000000-ffff-ffff-ffff-000000000001"}
                    onVerify={handleCaptchaVerify}
                    onExpire={handleCaptchaExpire}
                    onError={handleCaptchaError}
                  />
                </div>
                <p className="text-xs text-gray-400 text-center">
                  Complete the verification to continue
                </p>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded border-black/[.08] dark:border-white/[.12] bg-white/10 backdrop-blur text-purple-500 focus:ring-purple-500/50 focus:ring-offset-0"
                  />
                  <span className="text-gray-300">Remember me</span>
                </label>
                <Link
                  href="/forgot-password"
                  className="text-purple-400 hover:text-purple-300 transition-colors duration-200"
                >
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-purple-500 via-fuchsia-500 to-cyan-500 text-white font-medium hover:from-purple-600 hover:via-fuchsia-600 hover:to-cyan-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:ring-offset-2 focus:ring-offset-black transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>

            {/* Guest Account Option */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-transparent text-gray-400">or</span>
                </div>
              </div>
              
              <button
                onClick={handleGuestSignIn}
                disabled={isLoading}
                className="w-full mt-4 py-3 px-4 rounded-lg border border-white/20 bg-white/5 backdrop-blur text-white font-medium hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-black transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  "Sign in as Guest"
                )}
              </button>
              
              <p className="mt-2 text-xs text-gray-500 text-center">
                Guest accounts have limited features but don't require registration
              </p>
            </div>

            <div className="mt-6 text-center">
              <p className="text-gray-400 text-sm">
                Don't have an account?{" "}
                <Link
                  href="/signup"
                  className="text-purple-400 hover:text-purple-300 font-medium transition-colors duration-200"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>

        
      </main>
    </div>
  );
}
