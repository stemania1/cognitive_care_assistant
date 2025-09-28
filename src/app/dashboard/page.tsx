import Link from "next/link";
import Image from "next/image";
import HomeCards from "../components/HomeCards";

export default function Dashboard() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-black via-[#0b0520] to-[#0b1a3a] text-white">
      {/* Background gradients (slightly brighter) */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(1200px_600px_at_50%_-200px,rgba(168,85,247,0.35),transparent),radial-gradient(900px_500px_at_80%_120%,rgba(34,211,238,0.28),transparent),radial-gradient(800px_400px_at_10%_120%,rgba(59,130,246,0.2),transparent)]" />
      <div className="pointer-events-none absolute -top-24 right-1/2 h-[420px] w-[420px] translate-x-1/2 rounded-full bg-gradient-to-r from-fuchsia-500/40 via-purple-500/35 to-cyan-500/40 blur-3xl -z-10" />

      <main className="relative mx-auto max-w-5xl px-6 sm:px-10 py-12 sm:py-20">
        {/* Hero */}
        <div className="flex flex-col items-center text-center gap-4 sm:gap-6 mb-8 sm:mb-12">
          <Link href="/about" className="relative cursor-pointer select-none" title="Learn why we built Cognitive Care" role="button">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-fuchsia-500/40 via-purple-500/30 to-cyan-500/40 blur-xl" />
            <div className="relative rounded-2xl border border-black/[.08] dark:border-white/[.12] bg-white/5 dark:bg-white/5 backdrop-blur p-4">
              <Image
                src="/digital_brain.png"
                alt="Cognitive Care Assistant logo"
                width={96}
                height={96}
                priority
                className="h-16 w-16 sm:h-24 sm:w-24 object-contain drop-shadow"
              />
            </div>
          </Link>

          <h1 className="font-extrabold tracking-tight text-center">
            <span className="block text-3xl sm:text-5xl gradient-text leading-[1.15] pb-1">Cognitive Care</span>
            <span className="block text-lg sm:text-2xl -mt-1 gradient-text">Assistant</span>
          </h1>

        </div>
        

        {/* Options */}
        <HomeCards />
      </main>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 flex flex-col gap-4">
        {/* Sign Out Button */}
        <Link href="/signout" className="group">
          <span className="absolute -inset-2 rounded-full bg-gradient-to-r from-red-500/40 via-pink-500/35 to-rose-500/40 blur-xl opacity-70 group-hover:opacity-90 transition-opacity" />
          <span className="relative inline-flex h-12 w-12 items-center justify-center rounded-full border border-black/[.08] dark:border-white/[.12] bg-white/10 backdrop-blur shadow-lg transition-transform duration-200 group-hover:scale-105">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-5 w-5 opacity-90"
              aria-hidden="true"
            >
              <path d="M16.5 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM21 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM15.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM9.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM3.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25z" />
            </svg>
            <span className="sr-only">Sign Out</span>
          </span>
        </Link>
      </div>
    </div>
  );
}



