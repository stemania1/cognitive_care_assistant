import Link from "next/link";

export default function SensorsPage() {
  return (
    <>
      <main className="min-h-screen p-8 sm:p-16 grid place-items-center">
        <div className="w-full max-w-2xl">
          <h1 className="text-2xl sm:text-3xl font-semibold mb-2">Thermal Camera • Sleep Patterns</h1>
          <p className="opacity-80">Track nightly sleep patterns using thermal data.</p>
        </div>
      </main>
              <Link href="/dashboard" className="group fixed bottom-6 left-6 sm:bottom-8 sm:left-8">
        <span className="absolute -inset-2 rounded-full bg-gradient-to-r from-purple-500/30 via-fuchsia-500/25 to-cyan-500/30 blur-xl opacity-60 group-hover:opacity-80 transition-opacity" />
        <span className="relative inline-flex h-12 w-12 items-center justify-center rounded-full border border-black/[.08] dark:border-white/[.12] bg-white/10 backdrop-blur shadow-lg transition-transform duration-200 group-hover:scale-105">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 opacity-90" aria-hidden="true">
            <path d="M11.47 3.84a.75.75 0 0 1 1.06 0l8.25 8.25a.75.75 0 1 1-1.06 1.06l-.97-.97v8.07a.75.75 0 0 1-.75.75h-4.5a.75.75 0 0 1-.75-.75v-4.5h-3v4.5a.75.75 0 0 1-.75.75H4.5a.75.75 0 0 1-.75-.75v-8.07l-.97.97a.75.75 0 1 1-1.06-1.06Z" />
          </svg>
          <span className="sr-only">Home</span>
        </span>
      </Link>
    </>
  );
}


