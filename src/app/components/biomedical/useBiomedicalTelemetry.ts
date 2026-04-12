"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

export type CognitiveState = "Normal" | "Fatigued" | "At Risk";

export type AlertItem = {
  id: string;
  ts: number;
  severity: "info" | "warn" | "crit";
  message: string;
};

const GRID = 8;

/** Same output on server & client — avoids hydration mismatch from Math.random() in useState. */
function createInitialThermalGrid(): number[][] {
  return Array.from({ length: GRID }, (_, r) =>
    Array.from({ length: GRID }, (_, c) => {
      const v =
        34.2 +
        0.35 * Math.sin(r * 0.72 + c * 0.58) +
        0.22 * Math.cos(r * 1.05 - c * 0.41);
      return Math.round(v * 100) / 100;
    })
  );
}

function pushAlert(
  set: Dispatch<SetStateAction<AlertItem[]>>,
  severity: AlertItem["severity"],
  message: string
) {
  set((prev) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const next = [{ id, ts: Date.now(), severity, message }, ...prev];
    return next.slice(0, 8);
  });
}

export function useBiomedicalTelemetry() {
  const [emgSeries, setEmgSeries] = useState<number[]>(() =>
    Array.from({ length: 120 }, () => 0)
  );
  const [heartRate, setHeartRate] = useState(72);
  /** Simulated RMSSD-like variability (0–1 scale for display). */
  const [heartRateVariability, setHeartRateVariability] = useState(0.12);
  const [thermal, setThermal] = useState<number[][]>(createInitialThermalGrid);
  const [brainActivity, setBrainActivity] = useState(0.45);
  const [memoryPerformance, setMemoryPerformance] = useState(0.62);
  const [speechClarity, setSpeechClarity] = useState(0.78);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);

  const lastHrBand = useRef<"ok" | "high" | "crit">("ok");
  const lastThermalCrit = useRef(false);
  /** Debounce alert spam when telemetry oscillates near thresholds. */
  const lastHrWarnAt = useRef(0);
  const lastHrCritAt = useRef(0);
  const lastThermalAlertAt = useRef(0);

  useEffect(() => {
    let t = 0;
    const id = window.setInterval(() => {
      t += 0.08;
      const base = Math.sin(t * 3.1) * 0.35 + Math.sin(t * 7.3) * 0.12;
      const spike = Math.random() < 0.04 ? (Math.random() - 0.5) * 2.2 : 0;
      setEmgSeries((prev) => {
        const next = [...prev.slice(1), base + spike + (Math.random() - 0.5) * 0.08];
        return next;
      });

      setHeartRate((hr) => {
        const target = 68 + Math.sin(t * 0.7) * 8 + (Math.random() - 0.5) * 3;
        return Math.round(hr * 0.85 + target * 0.15);
      });
      setHeartRateVariability((v) =>
        Math.min(0.28, Math.max(0.04, v + (Math.random() - 0.5) * 0.012))
      );

      setThermal(() => {
        const cx = 3.55 + Math.sin(t * 0.38) * 1.35 + 0.22 * Math.sin(t * 1.05);
        const cy = 3.45 + Math.cos(t * 0.41) * 1.25 + 0.18 * Math.cos(t * 0.88);
        return Array.from({ length: GRID }, (_, r) =>
          Array.from({ length: GRID }, (_, c) => {
            const dist = Math.hypot(c - cx, r - cy);
            const asym = 0.11 * Math.sin((r - c) * 0.55 + t * 0.6) + 0.06 * Math.sin(r * 0.3 - c * 0.7);
            const body = 35.75 + Math.exp(-dist * dist / 8.2) * 2.85 + asym;
            const fine = Math.sin(r * 0.95 + t * 0.5) * 0.13 + Math.cos(c * 0.88 - t * 0.45) * 0.1;
            const edge = (Math.abs(c - 3.5) + Math.abs(r - 3.5)) * 0.014;
            const streak = (Math.random() - 0.5) * 0.06;
            const noise = (Math.random() - 0.5) * 0.1;
            const v = body + fine - edge + streak + noise;
            return Math.round(Math.min(39.6, Math.max(33.4, v)) * 100) / 100;
          })
        );
      });

      setBrainActivity(0.4 + Math.sin(t * 0.5) * 0.12 + Math.random() * 0.06);
      setMemoryPerformance((m) =>
        Math.min(1, Math.max(0.15, m + (Math.random() - 0.5) * 0.02))
      );
      setSpeechClarity((s) =>
        Math.min(1, Math.max(0.2, s + (Math.random() - 0.5) * 0.015))
      );
    }, 120);
    return () => window.clearInterval(id);
  }, []);

  const cognitiveState: CognitiveState = useMemo(() => {
    const hrHigh = heartRate > 102;
    const hrCrit = heartRate > 118;
    const emgPeak = emgSeries.some((v) => Math.abs(v) > 1.35);
    const hot = thermal.some((row) => row.some((v) => v > 38.4));
    if (hrCrit || hot) return "At Risk";
    if (hrHigh || emgPeak || memoryPerformance < 0.35) return "Fatigued";
    return "Normal";
  }, [heartRate, emgSeries, thermal, memoryPerformance]);

  useEffect(() => {
    let band: "ok" | "high" | "crit" = "ok";
    if (heartRate > 118) band = "crit";
    else if (heartRate > 104) band = "high";

    if (band !== lastHrBand.current) {
      lastHrBand.current = band;
      const now = Date.now();
      if (band === "crit") {
        if (now - lastHrCritAt.current >= 5000) {
          lastHrCritAt.current = now;
          pushAlert(setAlerts, "crit", `Tachycardia pattern: HR ${heartRate} BPM`);
        }
      } else if (band === "high") {
        if (now - lastHrWarnAt.current >= 12000) {
          lastHrWarnAt.current = now;
          pushAlert(setAlerts, "warn", `Elevated heart rate: ${heartRate} BPM`);
        }
      }
    }
  }, [heartRate]);

  useEffect(() => {
    const maxT = Math.max(...thermal.flat());
    const crit = maxT > 38.5;
    const now = Date.now();
    const wasCrit = lastThermalCrit.current;
    if (crit) {
      if (!wasCrit && now - lastThermalAlertAt.current >= 42000) {
        lastThermalAlertAt.current = now;
        pushAlert(setAlerts, "crit", `Thermal excursion: ${maxT.toFixed(1)} °C peak`);
      }
      lastThermalCrit.current = true;
    } else {
      lastThermalCrit.current = false;
    }
  }, [thermal]);

  const dismissAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  return {
    emgSeries,
    heartRate,
    heartRateVariability,
    thermal,
    brainActivity,
    memoryPerformance,
    speechClarity,
    cognitiveState,
    alerts,
    dismissAlert,
  };
}

export const THERMAL_GRID_SIZE = GRID;
