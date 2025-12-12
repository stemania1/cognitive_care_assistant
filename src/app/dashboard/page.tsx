'use client';

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import HomeCards from "../components/HomeCards";
import { GuestIndicator } from "../components/GuestIndicator";
import DementiaStagesButton from "../components/DementiaStagesButton";

export default function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-black via-[#0b0520] to-[#0b1a3a] text-white">
      {/* Guest Account Indicator */}
      <GuestIndicator />
      
      {/* Background gradients (slightly brighter) */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(1200px_600px_at_50%_-200px,rgba(168,85,247,0.35),transparent),radial-gradient(900px_500px_at_80%_120%,rgba(34,211,238,0.28),transparent),radial-gradient(800px_400px_at_10%_120%,rgba(59,130,246,0.2),transparent)]" />
      <div className="pointer-events-none absolute -top-24 right-1/2 h-[420px] w-[420px] translate-x-1/2 rounded-full bg-gradient-to-r from-fuchsia-500/40 via-purple-500/35 to-cyan-500/40 blur-3xl -z-10" />

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
            <div className="relative rounded-2xl border border-black/[.08] dark:border-white/[.12] bg-white/5 dark:bg-white/5 backdrop-blur p-4 group-hover:border-white/30 group-hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all duration-300">
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

        <div className="flex justify-center mb-6">
          <DementiaStagesButton />
        </div>

        {/* Options */}
        <HomeCards />
      </main>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 left-6 sm:bottom-8 sm:left-8 flex flex-col gap-4">
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

      {/* Development Info Modal */}
      {isModalOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="relative w-full max-w-2xl rounded-2xl border border-white/20 bg-gradient-to-br from-cyan-950/95 to-blue-950/95 shadow-2xl p-6 sm:p-8 backdrop-blur">
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
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
              
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 pr-8">
                About Cognitive Care Assistant
              </h2>
              
              <div className="text-gray-200 text-base leading-relaxed space-y-6">
                <div className="relative">
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-fuchsia-500/15 via-purple-500/10 to-cyan-500/15 blur-xl" />
                  <div className="relative rounded-xl border border-white/10 bg-white/5 backdrop-blur p-5 sm:p-6">
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



