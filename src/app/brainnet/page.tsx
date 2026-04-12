import type { Metadata } from "next";
import Link from "next/link";
import { BrainNetDiagram } from "@/app/components/brainnet/BrainNetDiagram";

export const metadata: Metadata = {
  title: "BrainNet",
  description:
    "BrainNet: Distributed Cognitive Monitoring Network — system architecture and data flow.",
};

export default function BrainNetPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-8">
        <header className="mb-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-600">
            Cognitive Care Assistant
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            BrainNet
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-slate-500">
            Distributed cognitive monitoring network — wearable sensors, edge signal processing,
            cloud machine learning, and clinical decision support at scale.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/dashboard"
              className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300"
            >
              Main dashboard
            </Link>
            <Link
              href="/dashboard/biomedical"
              className="rounded-full bg-sky-600 px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-sky-500"
            >
              Biomedical monitoring
            </Link>
          </div>
        </header>

        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_20px_60px_-24px_rgba(15,23,42,0.12)] sm:p-10">
          <BrainNetDiagram />
        </div>

        <div className="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-2">
          {[
            {
              title: "Sensor Layer",
              body: "Multi-modal wearables: EMG, PPG-derived heart rate, thermal arrays, and motion — continuous streaming with device-level buffering.",
            },
            {
              title: "Signal Processing Layer",
              body: "Edge QC, artifact rejection, resampling, and calibration before encrypted uplink to the cloud aggregation tier.",
            },
            {
              title: "Machine Learning Analysis",
              body: "Temporal risk models, anomaly detection, and cohort analytics — outputs are probabilities and explanations, not diagnoses.",
            },
            {
              title: "Clinical Decision Interface",
              body: "Physician and care-team dashboards with alerts, longitudinal trends, and audit-ready evidence trails.",
            },
          ].map((c) => (
            <div
              key={c.title}
              className="rounded-2xl border border-slate-100 bg-white/80 p-5 shadow-sm"
            >
              <h2 className="text-sm font-semibold text-slate-900">{c.title}</h2>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">{c.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
