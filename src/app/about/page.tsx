import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { StructuredData } from "../components/StructuredData";

export const metadata: Metadata = {
  title: "About - Winners of the 2025 Congressional App Challenge",
  description: "Cognitive Care Assistant won the 2025 Congressional App Challenge for Florida's District 17. Learn about our journey, inspiration, and recognition from Rep. Gregory Steube.",
  openGraph: {
    title: "About - Winners of the 2025 Congressional App Challenge",
    description: "Cognitive Care Assistant won the 2025 Congressional App Challenge for Florida's District 17. Learn about our journey and recognition.",
    url: "/about",
    images: [
      {
        url: "/images/CAClogo-dome-only-color.png",
        width: 400,
        height: 400,
        alt: "Congressional App Challenge Capitol Dome",
      },
    ],
  },
  alternates: {
    canonical: "/about",
  },
};

export default function AboutPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "About Cognitive Care Assistant - Winners of the 2025 Congressional App Challenge",
    "description": "Cognitive Care Assistant won the 2025 Congressional App Challenge for Florida's District 17. Learn about our journey, inspiration, and recognition from Rep. Gregory Steube.",
    "url": "https://cognitive-care-assistant.vercel.app/about",
    "mainEntity": {
      "@type": "SoftwareApplication",
      "name": "Cognitive Care Assistant",
      "applicationCategory": "HealthApplication",
      "operatingSystem": "Web",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "5",
        "ratingCount": "1"
      },
      "award": "Winner of the 2025 Congressional App Challenge - Florida District 17",
      "creator": {
        "@type": "Organization",
        "name": "Corbin Craig and Connor Craig",
        "affiliation": {
          "@type": "EducationalOrganization",
          "name": "Pine View School"
        }
      }
    },
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://cognitive-care-assistant.vercel.app"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "About",
          "item": "https://cognitive-care-assistant.vercel.app/about"
        }
      ]
    }
  };

  return (
    <>
      <StructuredData data={structuredData} />
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-black via-[#0b0520] to-[#0b1a3a] text-white">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(1200px_600px_at_50%_-200px,rgba(168,85,247,0.35),transparent),radial-gradient(900px_500px_at_80%_120%,rgba(34,211,238,0.28),transparent),radial-gradient(800px_400px_at_10%_120%,rgba(59,130,246,0.2),transparent)]" />
      <div className="pointer-events-none absolute -top-24 right-1/2 h-[420px] w-[420px] translate-x-1/2 rounded-full bg-gradient-to-r from-fuchsia-500/40 via-purple-500/35 to-cyan-500/40 blur-3xl -z-10" />

      <main className="relative mx-auto max-w-4xl px-6 sm:px-10 py-10 sm:py-14">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-6">About Cognitive Care</h1>

        {/* Congressional App Challenge Winners Section */}
        <div className="relative mb-8">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-fuchsia-500/20 via-purple-500/15 to-cyan-500/20 blur-xl" />
          <div className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-6 sm:p-8">
            <div className="flex flex-col items-center gap-6">
              <div className="text-center">
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                  Winners of the 2025 Congressional App Challenge
                </h2>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8 w-full">
                <div className="flex-1 max-w-sm">
                  <Image
                    src="/images/CAClogo-dome-only-color.png"
                    alt="Congressional App Challenge Capitol Dome"
                    width={400}
                    height={400}
                    className="w-full h-auto object-contain"
                  />
                </div>
                <div className="flex-1 max-w-sm">
                  <Image
                    src="/images/CAClogo-white-letters-only.png"
                    alt="Congressional App Challenge Logo"
                    width={400}
                    height={200}
                    className="w-full h-auto object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-fuchsia-500/15 via-purple-500/10 to-cyan-500/15 blur-xl" />
          <div className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-5 sm:p-7 text-gray-100 text-base leading-relaxed">
            <p>
              Winning the 2025 Congressional App Challenge for Florida's District 17 was an incredible honor, and I am truly grateful to everyone who supported this journey. A huge thank-you to my parents for providing the constant support, encouragement, and resources I needed throughout the entire process. I am also sincerely thankful to the judges for taking the time to review the submissions and for choosing my app—your recognition means so much to me. A special shout-out to Greg Steube for supporting student innovation and STEM education through the Congressional App Challenge. This experience motivated me to keep learning, building, and using technology to make a real impact.
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
    </>
  );
}


