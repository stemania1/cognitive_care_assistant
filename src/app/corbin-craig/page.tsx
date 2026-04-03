import type { Metadata } from "next";
import Link from "next/link";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://cognitive-care-assistant.vercel.app";

export const metadata: Metadata = {
  title: "Corbin Craig — Cognitive Care Assistant",
  description:
    "Corbin Craig is the creator of Cognitive Care Assistant, winner of the 2025 Congressional App Challenge (Florida District 17). Health monitoring for dementia patients and caregivers.",
  keywords: [
    "Corbin Craig",
    "Cognitive Care Assistant",
    "Congressional App Challenge",
    "Corbin Craig app",
    "Pine View School",
  ],
  openGraph: {
    title: "Corbin Craig — Cognitive Care Assistant",
    description:
      "Corbin Craig created Cognitive Care Assistant, a Congressional App Challenge winner for dementia care and health monitoring.",
    url: "/corbin-craig",
    siteName: "Cognitive Care Assistant",
    type: "website",
  },
  alternates: {
    canonical: "/corbin-craig",
  },
  robots: { index: true, follow: true },
};

export default function CorbinCraigPage() {
  const personLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Corbin Craig",
    url: `${baseUrl}/corbin-craig`,
    description:
      "Creator of Cognitive Care Assistant, winner of the 2025 Congressional App Challenge for Florida District 17.",
    affiliation: {
      "@type": "EducationalOrganization",
      name: "Pine View School",
    },
    knowsAbout: [
      "Health technology",
      "Dementia care",
      "EMG monitoring",
      "Thermal health monitoring",
    ],
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${baseUrl}/corbin-craig`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personLd) }}
      />
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-black via-[#0b0520] to-[#0b1a3a] text-white">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(1200px_600px_at_50%_-200px,rgba(168,85,247,0.35),transparent),radial-gradient(900px_500px_at_80%_120%,rgba(34,211,238,0.28),transparent)]" />
        <main className="relative mx-auto max-w-2xl px-6 py-12 sm:py-16">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">Corbin Craig</h1>
          <p className="text-gray-300 text-lg leading-relaxed mb-6">
            Corbin Craig is the creator of{" "}
            <strong className="text-white">Cognitive Care Assistant</strong>, a web application for
            health monitoring, daily assessments, and support for dementia patients and caregivers.
            The project won the <strong className="text-white">2025 Congressional App Challenge</strong>{" "}
            for Florida&apos;s District 17.
          </p>
          <p className="text-gray-400 text-base leading-relaxed mb-8">
            The official site for the app is{" "}
            <a href={baseUrl} className="text-cyan-400 hover:text-cyan-300 underline">
              {baseUrl.replace(/^https?:\/\//, "")}
            </a>
            . Sign in to use the dashboard, daily questions, thermal and EMG features, reminders, and
            more.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/signin"
              className="inline-flex items-center rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium hover:bg-white/15"
            >
              Open Cognitive Care Assistant
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center rounded-xl border border-white/15 px-4 py-2 text-sm text-gray-300 hover:bg-white/5"
            >
              About the app
            </Link>
          </div>
        </main>
      </div>
    </>
  );
}
