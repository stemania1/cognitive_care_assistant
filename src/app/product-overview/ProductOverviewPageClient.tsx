"use client";

import Link from "next/link";
import { SensorModelsWorkspace } from "@/app/components/sensor-models/SensorModelsWorkspace";

/** Full-page sensor models route (same viewer as the dashboard modal). */
export default function ProductOverviewPageClient() {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-hidden bg-[#030712] text-slate-100">
      <div
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_100%_80%_at_50%_-15%,rgba(34,211,238,0.1),transparent),radial-gradient(ellipse_70%_50%_at_100%_40%,rgba(59,130,246,0.07),transparent)]"
        aria-hidden
      />
      <header className="shrink-0 border-b border-cyan-500/20 bg-[#030712]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1920px] flex-col gap-2.5 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-400/90">
              Cognitive Care Assistant
            </p>
            <h1 className="text-lg font-bold tracking-tight text-white sm:text-xl">
              View Sensor Models
            </h1>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Interactive 3D hardware · MyoWare 2.0 · Raspberry Pi &amp; AMG8833
            </p>
          </div>
          <Link
            href="/dashboard"
            className="rounded-lg border border-white/12 bg-white/[0.04] px-3 py-2 text-[11px] font-medium text-slate-200 transition hover:border-cyan-500/30 hover:bg-white/[0.07]"
          >
            Main dashboard
          </Link>
        </div>
      </header>
      <main className="mx-auto flex min-h-0 w-full max-w-[1920px] flex-1 flex-col px-4 py-4 sm:px-6 sm:py-5">
        <SensorModelsWorkspace />
      </main>
    </div>
  );
}
