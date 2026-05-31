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
    <div className="cca-dashboard relative min-h-screen overflow-hidden bg-[#060d18] text-slate-100">
      <DementiaCareSidebar onLayoutChange={setSidebarOverlayWidthPx} />
      {/* Guest Account Indicator */}
      <GuestIndicator />
      
      {/* User Profile Top Left */}
      <UserProfileTopLeft sidebarInsetPx={sidebarOverlayWidthPx} />
      
      {/* Congressional App Challenge Button */}
      <CongressionalAppChallengeButton />
      
      {/* Healthcare-tech ambient background */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-[#060d18] via-[#0b1424] to-[#0a1628]"
        aria-hidden
      />
      <div
        className="cca-dashboard-ambient pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(1100px_520px_at_50%_-12%,rgba(99,102,241,0.22),transparent_58%),radial-gradient(900px_480px_at_88%_72%,rgba(59,130,246,0.14),transparent_55%),radial-gradient(760px_420px_at_8%_88%,rgba(139,92,246,0.12),transparent_52%),radial-gradient(600px_320px_at_50%_42%,rgba(56,189,248,0.06),transparent_70%)]"
        aria-hidden
      />
      <div
        className="cca-dashboard-glow-top pointer-events-none absolute -top-32 left-1/2 h-[480px] w-[520px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(129,140,248,0.18)_0%,rgba(59,130,246,0.08)_42%,transparent_68%)] blur-3xl -z-10"
        aria-hidden
      />
      <div
        className="cca-dashboard-glow-bottom pointer-events-none absolute bottom-0 right-0 h-[360px] w-[360px] translate-x-1/4 translate-y-1/4 rounded-full bg-[radial-gradient(circle,rgba(79,70,229,0.12)_0%,transparent_65%)] blur-3xl -z-10"
        aria-hidden
      />

      <main className="relative mx-auto max-w-5xl px-6 sm:px-10 py-8 sm:py-12">
        {/* Hero */}
        <div className="flex flex-col items-center text-center gap-3 sm:gap-4 mb-6 sm:mb-8">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="relative cursor-pointer select-none group" 
            title="Learn about Cognitive Care" 
            aria-label="Learn about Cognitive Care"
          >
            <div
              className="cca-dashboard-logo-glow absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(129,140,248,0.45)_0%,rgba(59,130,246,0.22)_38%,rgba(139,92,246,0.1)_58%,transparent_72%)] blur-2xl transition-transform duration-700 ease-out group-hover:scale-[1.48]"
              aria-hidden
            />
            <div
              className="absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_50%_40%,rgba(147,197,253,0.2)_0%,transparent_55%)] blur-xl opacity-90"
              aria-hidden
            />
            <div className="light-ui-frame relative rounded-2xl border border-white/12 bg-[#0f1a2e]/75 p-4 shadow-[0_0_48px_rgba(59,130,246,0.18),0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-md transition-all duration-500 ease-out group-hover:-translate-y-1 group-hover:border-sky-400/25 group-hover:shadow-[0_0_56px_rgba(99,102,241,0.28),0_8px_36px_rgba(0,0,0,0.4)]">
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
            <span className="cca-dashboard-title block text-3xl sm:text-5xl leading-[1.15] pb-1">Cognitive Care</span>
            <span className="cca-dashboard-title block text-lg sm:text-2xl -mt-1 opacity-95">Assistant</span>
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
            className="fixed inset-0 z-50 bg-[#060d18]/75 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="light-ui-frame relative w-full max-w-2xl rounded-2xl border border-white/12 bg-gradient-to-br from-[#0f1a2e]/95 via-[#111d33]/95 to-[#0c1528]/95 p-6 shadow-[0_0_40px_rgba(59,130,246,0.12),0_24px_48px_rgba(0,0,0,0.45)] backdrop-blur-md sm:p-8">
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 transition-colors hover:text-slate-100"
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
              
              <h2 className="mb-6 pr-8 text-2xl font-bold text-slate-50 sm:text-3xl">
                About Cognitive Care Assistant
              </h2>
              
              <div className="space-y-6 text-base leading-relaxed text-slate-300">
                <div className="relative">
                  <div className="absolute inset-0 rounded-xl bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.15)_0%,transparent_70%)] blur-xl" aria-hidden />
                  <div className="light-ui-frame relative rounded-xl border border-white/10 bg-[#0a1220]/80 p-5 backdrop-blur sm:p-6">
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



