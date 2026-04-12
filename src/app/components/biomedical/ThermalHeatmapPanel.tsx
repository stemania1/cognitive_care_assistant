"use client";

import { useEffect, useRef } from "react";
import { THERMAL_GRID_SIZE } from "./useBiomedicalTelemetry";

const W = THERMAL_GRID_SIZE;
const H = THERMAL_GRID_SIZE;

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const hue = ((h % 360) + 360) % 360;
  const sat = Math.min(1, Math.max(0, s));
  const lit = Math.min(1, Math.max(0, l));
  const c = (1 - Math.abs(2 * lit - 1)) * sat;
  const hp = hue / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r1 = 0;
  let g1 = 0;
  let b1 = 0;
  if (hp >= 0 && hp < 1) {
    r1 = c;
    g1 = x;
  } else if (hp < 2) {
    r1 = x;
    g1 = c;
  } else if (hp < 3) {
    g1 = c;
    b1 = x;
  } else if (hp < 4) {
    g1 = x;
    b1 = c;
  } else if (hp < 5) {
    r1 = x;
    b1 = c;
  } else {
    r1 = c;
    b1 = x;
  }
  const m = lit - c / 2;
  return [
    Math.round((r1 + m) * 255),
    Math.round((g1 + m) * 255),
    Math.round((b1 + m) * 255),
  ];
}

function sampleBilinear(grid: number[][], x: number, y: number): number {
  const xf = (x / W) * (W - 1);
  const yf = (y / H) * (H - 1);
  const x0 = Math.max(0, Math.min(W - 1, Math.floor(xf)));
  const y0 = Math.max(0, Math.min(H - 1, Math.floor(yf)));
  const x1 = Math.min(W - 1, x0 + 1);
  const y1 = Math.min(H - 1, y0 + 1);
  const tx = xf - x0;
  const ty = yf - y0;
  const v00 = grid[y0][x0];
  const v10 = grid[y0][x1];
  const v01 = grid[y1][x0];
  const v11 = grid[y1][x1];
  const v0 = v00 * (1 - tx) + v10 * tx;
  const v1 = v01 * (1 - tx) + v11 * tx;
  return v0 * (1 - ty) + v1 * ty;
}

function findPeak(grid: number[][]): { r: number; c: number; v: number } {
  let pr = 0;
  let pc = 0;
  let pv = -Infinity;
  for (let r = 0; r < H; r++) {
    for (let c = 0; c < W; c++) {
      if (grid[r][c] > pv) {
        pv = grid[r][c];
        pr = r;
        pc = c;
      }
    }
  }
  return { r: pr, c: pc, v: pv };
}

export function ThermalHeatmapPanel({ grid }: { grid: number[][] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const flat = grid.flat();
  const lo = Math.min(...flat);
  const hi = Math.max(...flat);
  const peak = findPeak(grid);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = wrap.getBoundingClientRect();
    const cw = Math.max(160, Math.floor(rect.width));
    const ch = 168;
    canvas.width = cw;
    canvas.height = ch;

    const iw = cw;
    const ih = ch;
    const img = ctx.createImageData(iw, ih);
    const data = img.data;

    for (let py = 0; py < ih; py++) {
      for (let px = 0; px < iw; px++) {
        const sx = ((px + 0.5) / iw) * W;
        const sy = ((py + 0.5) / ih) * H;
        const v = sampleBilinear(grid, sx, sy);
        const n = hi > lo ? (v - lo) / (hi - lo) : 0.5;
        const hue = 205 - n * 138;
        const sat = 0.58 + n * 0.32;
        const light = 0.19 + n * 0.4;
        const [r, g, b] = hslToRgb(hue, sat, light);
        const i = (py * iw + px) * 4;
        const grain = (Math.random() - 0.5) * 11;
        data[i] = Math.min(255, Math.max(0, r + grain));
        data[i + 1] = Math.min(255, Math.max(0, g + grain * 0.92));
        data[i + 2] = Math.min(255, Math.max(0, b + grain * 0.85));
        data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);

    ctx.save();
    ctx.globalCompositeOperation = "soft-light";
    ctx.fillStyle = "rgba(15,23,42,0.14)";
    ctx.fillRect(0, 0, iw, ih);
    ctx.restore();

    const pxPeak = ((peak.c + 0.5) / W) * iw;
    const pyPeak = ((peak.r + 0.5) / H) * ih;
    ctx.save();
    ctx.strokeStyle = "rgba(251, 191, 36, 0.45)";
    ctx.lineWidth = 1.25;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.arc(pxPeak, pyPeak, Math.min(iw, ih) * 0.07, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.strokeStyle = "rgba(34,211,238,0.05)";
    ctx.lineWidth = 1;
    const cols = 8;
    const rows = 8;
    for (let i = 0; i <= cols; i++) {
      const x = (i / cols) * iw;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, ih);
      ctx.stroke();
    }
    for (let j = 0; j <= rows; j++) {
      const y = (j / rows) * ih;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(iw, y);
      ctx.stroke();
    }
  }, [grid, lo, hi, peak.c, peak.r]);

  return (
    <div ref={wrapRef} className="flex flex-col gap-1.5">
      <div className="relative overflow-hidden rounded-lg border border-cyan-500/20 bg-[#020617] shadow-[inset_0_0_40px_rgba(34,211,238,0.06)]">
        <canvas ref={canvasRef} className="block w-full" />
        <div className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-white/5" />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-[9px] uppercase tracking-wide text-slate-500">
        <span className="text-emerald-400/90">Thermal anomaly detection: active</span>
        <span className="font-mono text-slate-400">
          {lo.toFixed(1)} – {hi.toFixed(1)} °C
        </span>
      </div>
      <p className="text-[8px] leading-snug text-slate-600">
        Peak cell ({peak.r},{peak.c}) · sensor grain + asymmetric body map (sim)
      </p>
    </div>
  );
}
