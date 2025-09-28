import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-black via-[#0b0520] to-[#0b1a3a] text-white">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(1200px_600px_at_50%_-200px,rgba(168,85,247,0.35),transparent),radial-gradient(900px_500px_at_80%_120%,rgba(34,211,238,0.28),transparent),radial-gradient(800px_400px_at_10%_120%,rgba(59,130,246,0.2),transparent)]" />
      <div className="pointer-events-none absolute -top-24 right-1/2 h-[420px] w-[420px] translate-x-1/2 rounded-full bg-gradient-to-r from-fuchsia-500/40 via-purple-500/35 to-cyan-500/40 blur-3xl -z-10" />

      <main className="relative mx-auto max-w-4xl px-6 sm:px-10 py-10 sm:py-14">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-6">About Cognitive Care</h1>

        <div className="relative">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-fuchsia-500/15 via-purple-500/10 to-cyan-500/15 blur-xl" />
          <div className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-5 sm:p-7 text-gray-100 text-base leading-relaxed">
            <p>
              We created the Cognitive Care Assistant because dementia has touched our own families, and we’ve seen firsthand the challenges it brings. Today, nearly 1 in 10 people over the age of 65 live with dementia, and the number is only rising each year. It is now the fifth leading cause of death, not because of the disease itself, but because those affected lose the ability to remember or manage vital daily functions. Watching a loved one struggle in this way is heartbreaking, and we knew something had to be done. With the Cognitive Care Assistant, our goal is to create a safe, supportive space that helps people hold on to their independence, stay healthy, and feel cared for. More than just a tool, it’s a promise of comfort and dignity for those living with dementia—and peace of mind for the families who love them.
            </p>
          </div>
        </div>

        <div className="mt-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 backdrop-blur px-4 py-2 hover:bg-white/10 transition-colors"
          >
            <span>← Back to Home</span>
          </Link>
        </div>
      </main>
    </div>
  );
}


