'use client';

import { useState } from "react";
import Image from "next/image";
import HomeCards from "../components/HomeCards";
import { GuestIndicator } from "../components/GuestIndicator";
import { DementiaCareSidebar } from "../components/DementiaCareSidebar";
import { CongressionalAppChallengeButton } from "../components/CongressionalAppChallengeButton";
import { UserProfileTopLeft } from "../components/UserProfileTopLeft";
import { DashboardSettingsMenu } from "../components/DashboardSettingsMenu";

export default function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  /** Sidebar width for profile chip only (main layout stays full-width; sidebar overlays). */
  const [sidebarOverlayWidthPx, setSidebarOverlayWidthPx] = useState(0);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-violet-50 to-sky-100 text-slate-900 dark:from-black dark:via-[#0b0520] dark:to-[#0b1a3a] dark:text-white">
      <DementiaCareSidebar onLayoutChange={setSidebarOverlayWidthPx} />
      {/* Guest Account Indicator */}
      <GuestIndicator />
      
      {/* User Profile Top Left */}
      <UserProfileTopLeft sidebarInsetPx={sidebarOverlayWidthPx} />
      
      {/* Congressional App Challenge Button */}
      <CongressionalAppChallengeButton />
      
      {/* Background gradients (slightly brighter) */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(1200px_600px_at_50%_-200px,rgba(168,85,247,0.14),transparent),radial-gradient(900px_500px_at_80%_120%,rgba(34,211,238,0.12),transparent),radial-gradient(800px_400px_at_10%_120%,rgba(59,130,246,0.1),transparent)] dark:bg-[radial-gradient(1200px_600px_at_50%_-200px,rgba(168,85,247,0.35),transparent),radial-gradient(900px_500px_at_80%_120%,rgba(34,211,238,0.28),transparent),radial-gradient(800px_400px_at_10%_120%,rgba(59,130,246,0.2),transparent)]" />
      <div className="pointer-events-none absolute -top-24 right-1/2 h-[420px] w-[420px] translate-x-1/2 rounded-full bg-gradient-to-r from-fuchsia-500/20 via-purple-500/18 to-cyan-500/20 blur-3xl -z-10 dark:from-fuchsia-500/40 dark:via-purple-500/35 dark:to-cyan-500/40" />

      <main className="relative mx-auto max-w-5xl px-6 sm:px-10 py-8 sm:py-12">
        {/* Hero */}
        <div className="flex flex-col items-center text-center gap-3 sm:gap-4 mb-6 sm:mb-8">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="relative cursor-pointer select-none group" 
            title="Learn about Cognitive Care" 
            aria-label="Learn about Cognitive Care"
          >
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-fuchsia-500/40 via-purple-500/30 to-cyan-500/40 blur-xl group-hover:bg-white/20 group-hover:blur-2xl transition-all duration-300" />
            <div className="light-ui-frame relative rounded-2xl border border-slate-200/90 bg-white/80 p-4 shadow-sm backdrop-blur transition-all duration-300 group-hover:border-violet-300/80 group-hover:shadow-lg dark:border-black/[.08] dark:bg-white/5 dark:shadow-none dark:group-hover:border-white/30 dark:group-hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]">
              <Image
                src="/digital_brain.png"
                alt="Cognitive Care Assistant logo"
                width={96}
                height={96}
                priority
                className="h-16 w-16 sm:h-24 sm:w-24 object-contain drop-shadow"
              />
            </div>
          </button>

          <h1 className="font-extrabold tracking-tight text-center">
            <span className="block text-3xl sm:text-5xl gradient-text leading-[1.15] pb-1">Cognitive Care</span>
            <span className="block text-lg sm:text-2xl -mt-1 gradient-text">Assistant</span>
          </h1>

        </div>

        {/* Options */}
        <HomeCards />
      </main>

      <DashboardSettingsMenu />

      {/* Development Info Modal */}
      {isModalOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm dark:bg-black/60"
            onClick={() => setIsModalOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="light-ui-frame relative w-full max-w-2xl rounded-2xl border border-slate-200/90 bg-white/95 p-6 shadow-2xl backdrop-blur sm:p-8 dark:border-white/20 dark:bg-gradient-to-br dark:from-cyan-950/95 dark:to-blue-950/95 dark:shadow-2xl">
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 text-slate-500 hover:text-slate-800 transition-colors dark:text-white/70 dark:hover:text-white"
                aria-label="Close modal"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6 pr-8 dark:text-white">
                About Cognitive Care Assistant
              </h2>
              
              <div className="text-slate-700 text-base leading-relaxed space-y-6 dark:text-gray-200">
                <div className="relative">
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-fuchsia-500/10 via-purple-500/8 to-cyan-500/10 blur-xl dark:from-fuchsia-500/15 dark:via-purple-500/10 dark:to-cyan-500/15" />
                  <div className="light-ui-frame relative rounded-xl border border-slate-200/80 bg-slate-50/80 p-5 backdrop-blur sm:p-6 dark:border-white/10 dark:bg-white/5">
                    <p>
                      We created the Cognitive Care Assistant because dementia has touched our own families, and we've seen firsthand the challenges it brings. Today, nearly 1 in 10 people over the age of 65 live with dementia, and the number is only rising each year. It is now the fifth leading cause of death, not because of the disease itself, but because those affected lose the ability to remember or manage vital daily functions. Watching a loved one struggle in this way is heartbreaking, and we knew something had to be done. With the Cognitive Care Assistant, our goal is to create a safe, supportive space that helps people hold on to their independence, stay healthy, and feel cared for. More than just a tool, it's a promise of comfort and dignity for those living with dementia—and peace of mind for the families who love them.
                    </p>
                  </div>
                </div>
                
                <div>
                  <p className="mb-3">
                    This app was developed using feedback from caregivers, family members, and healthcare professionals, including:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Professional caregivers, CNAs, and home health aides</li>
                    <li>Neuropsychologists and neurologists</li>
                    <li>Physicians who work with dementia patients</li>
                    <li>Assisted living and memory-care staff</li>
                  </ul>
                  <p className="mt-3">
                    Their insights helped shape the app's features and usability.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}



