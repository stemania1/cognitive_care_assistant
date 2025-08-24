import Link from "next/link";
import Image from "next/image";
import HomeCards from "../components/HomeCards";

export default function Dashboard() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-black via-[#0b0520] to-[#0b1a3a] text-white">
      {/* Background gradients */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(1200px_600px_at_50%_-200px,rgba(168,85,247,0.25),transparent),radial-gradient(900px_500px_at_80%_120%,rgba(34,211,238,0.18),transparent),radial-gradient(800px_400px_at_10%_120%,rgba(59,130,246,0.12),transparent)]" />
      <div className="pointer-events-none absolute -top-24 right-1/2 h-[420px] w-[420px] translate-x-1/2 rounded-full bg-gradient-to-r from-fuchsia-500/25 via-purple-500/20 to-cyan-500/25 blur-3xl -z-10" />

      <main className="relative mx-auto max-w-5xl px-6 sm:px-10 py-12 sm:py-20">
        {/* Hero */}
        <div className="flex flex-col items-center text-center gap-6 mb-10 sm:mb-14">
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-fuchsia-500/30 via-purple-500/20 to-cyan-500/30 blur-xl" />
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
          </div>

          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white">
            Cognitive Care Assistant
          </h1>
        </div>

        {/* Navigation */}
        <div className="flex justify-end mb-6">
          <Link
            href="/"
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg border border-white/15 bg-white/10 backdrop-blur text-white hover:bg-white/15 transition-all duration-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-4 w-4"
            >
              <path d="M16.5 12a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM12 7.5a4.5 4.5 0 100 9 4.5 4.5 0 000-9zM12 1.5a10.5 10.5 0 100 21 10.5 10.5 0 000-21z" />
            </svg>
            <span>Sign Out</span>
          </Link>
        </div>

        {/* Options */}
        <HomeCards />
      </main>

      {/* Floating Settings Button */}
      <Link href="/settings" className="group fixed bottom-6 right-6 sm:bottom-8 sm:right-8">
        <span className="absolute -inset-2 rounded-full bg-gradient-to-r from-purple-500/30 via-fuchsia-500/25 to-cyan-500/30 blur-xl opacity-60 group-hover:opacity-80 transition-opacity" />
        <span className="relative inline-flex h-12 w-12 items-center justify-center rounded-full border border-black/[.08] dark:border-white/[.12] bg-white/10 backdrop-blur shadow-lg transition-transform duration-200 group-hover:scale-105">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-5 w-5 opacity-90"
            aria-hidden="true"
          >
            <path d="M11.983 8.5a3.5 3.5 0 1 0 .034 7 3.5 3.5 0 0 0-.034-7Zm9.017 3.5a8.99 8.99 0 0 0-.15-1.6l2.082-1.595a.75.75 0 0 0 .177-.964l-1.973-3.416a.75.75 0 0 0-.91-.33l-2.45.9a9.08 9.08 0 0 0-1.39-.807l-.37-2.57A.75.75 0 0 0 14.3.5h-4.6a.75.75 0 0 0-.742.648l-.37 2.57c-.49.213-.953.487-1.39.807l-2.45-.9a.75.75 0 0 0-.91.33L1.27 7.34a.75.75 0 0 0 .177.964l2.082 1.595A8.99 8.99 0 0 0 3.38 12a8.99 8.99 0 0 0 .15 1.6L1.448 15.195a.75.75 0 0 0-.177.964l1.973 3.416a.75.75 0 0 0 .91.33l2.45-.9c.437.32.9.594 1.39.807l.37 2.57a.75.75 0 0 0 .742.648h4.6a.75.75 0 0 0 .742-.648l.37-2.57c.49-.213.953-.487 1.39-.807l2.45.9a.75.75 0 0 0 .91-.33l1.973-3.416a.75.75 0 0 0-.177-.964L21.85 13.6c.1-.52.15-1.06.15-1.6Z" />
          </svg>
          <span className="sr-only">Settings</span>
        </span>
      </Link>
    </div>
  );
}
