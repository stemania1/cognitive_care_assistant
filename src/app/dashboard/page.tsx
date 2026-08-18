'use client';

import { useState } from "react";
import Image from "next/image";
import HomeCards from "../components/HomeCards";
import { GuestIndicator } from "../components/GuestIndicator";
import { DementiaCareSidebar } from "../components/DementiaCareSidebar";
import { DashboardTopRight } from "../components/DashboardTopRight";
import { UserProfileTopLeft } from "../components/UserProfileTopLeft";
import { DashboardSettingsMenu } from "../components/DashboardSettingsMenu";
import GradientWaves from "../components/GradientWaves";

export default function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  /** Sidebar width for profile chip only (main layout stays full-width; sidebar overlays). */
  const [sidebarOverlayWidthPx, setSidebarOverlayWidthPx] = useState(0);

  return (
    <div className="cca-dashboard cca-dashboard-saas relative min-h-screen overflow-hidden text-slate-100">
      <DementiaCareSidebar onLayoutChange={setSidebarOverlayWidthPx} />
      {/* Guest Account Indicator */}
      <GuestIndicator />
      
      {/* User Profile Top Left */}
      <UserProfileTopLeft sidebarInsetPx={sidebarOverlayWidthPx} />
      
      {/* Congressional App Challenge + Messenger */}
      <DashboardTopRight />
      
      {/* SaaS ambient background — z-0 so it stays above the page fill, under UI */}
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
        <div className="cca-dashboard-bg-base absolute inset-0" />
        <div className="cca-dashboard-gradient-waves absolute inset-0">
          <GradientWaves
            horizonColor="#07101f"
            waveColor="#1d4ed8"
            crestColor="#93c5fd"
            speed={0.22}
            amplitude={2.2}
            waveScale={0.55}
            waveRatio={0.85}
            swell={28}
            turbulence={16}
            tilt={1.08}
            zoom={1.05}
            height={5.2}
            fogDepth={18}
            detail="medium"
            brightness={0.85}
            opacity={0.9}
            mouseInteraction
            parallaxStrength={0.35}
            grain
            grainIntensity={0.03}
          />
        </div>
        <div className="cca-dashboard-vignette absolute inset-0" />
        <div className="cca-dashboard-grid-glow absolute inset-0" />
      </div>

      <main className="cca-dashboard-main relative z-10 mx-auto max-w-5xl">
        {/* Hero */}
        <div className="cca-dashboard-hero flex flex-col items-center text-center">
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
            <div className="cca-dashboard-logo-card light-ui-frame relative rounded-2xl p-4">
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

          <div className="cca-dashboard-hero-text flex max-w-2xl flex-col items-center text-center">
            <h1 className="cca-dashboard-title-wrap">
              <span className="cca-dashboard-title-line cca-dashboard-title-line--primary">
                Cognitive Care
              </span>
              <span className="cca-dashboard-title-line cca-dashboard-title-line--secondary">
                Assistant
              </span>
            </h1>
            <p className="cca-dashboard-subtitle">
              AI-powered support for memory, wellness, and caregiver insights.
            </p>
          </div>

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
            <div className="cca-dashboard-modal light-ui-frame relative w-full max-w-2xl rounded-2xl p-6 sm:p-8">
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



