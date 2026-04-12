"use client";

import { Line } from "react-chartjs-2";
import { registerChartJS } from "@/utils/chart-registration";

registerChartJS();

export function EmgWaveformPanel({ series }: { series: number[] }) {
  const labels = series.map((_, i) => `${i}`);
  const rms = Math.sqrt(series.reduce((s, v) => s + v * v, 0) / Math.max(1, series.length));
  const peak = Math.max(...series.map((v) => Math.abs(v)));

  const data = {
    labels,
    datasets: [
      {
        label: "EMG",
        data: series,
        borderColor: "rgba(56, 189, 248, 0.95)",
        backgroundColor: "rgba(34, 211, 238, 0.08)",
        borderWidth: 1.25,
        pointRadius: 0,
        tension: 0.2,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false as const,
    interaction: { mode: "nearest" as const, intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
    },
    scales: {
      x: {
        display: true,
        grid: { display: false },
        ticks: {
          color: "#475569",
          font: { size: 8 },
          maxTicksLimit: 6,
        },
        border: { display: false },
      },
      y: {
        grid: {
          color: "rgba(51, 65, 85, 0.45)",
          lineWidth: 1,
        },
        ticks: {
          color: "#64748b",
          font: { size: 9, family: "ui-monospace, monospace" },
          callback: (v: string | number) => `${Number(v).toFixed(1)}`,
        },
        border: { display: false, dash: [3, 4] as [number, number] },
        suggestedMin: -1.6,
        suggestedMax: 1.6,
      },
    },
  };

  return (
    <div className="space-y-1.5">
      <div className="relative h-[118px] w-full overflow-hidden rounded-lg border border-cyan-500/15 bg-[#020617] shadow-[inset_0_0_32px_rgba(34,211,238,0.05),0_0_24px_rgba(34,211,238,0.12)]">
        <Line data={data} options={options} />
      </div>
      <div className="flex flex-wrap justify-between gap-x-3 gap-y-0.5 font-mono text-[9px] text-slate-500">
        <span>
          RMS <span className="text-slate-400">{rms.toFixed(3)}</span> mVₑq
        </span>
        <span>
          |peak| <span className="text-slate-400">{peak.toFixed(2)}</span>
        </span>
        <span className="text-emerald-500/80">●</span> sim stream
      </div>
    </div>
  );
}
