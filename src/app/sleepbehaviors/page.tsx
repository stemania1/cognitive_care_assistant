"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import ThermalVisualization from "../components/ThermalVisualization";
import { useAlertCenter } from "../components/AlertCenter";

interface ThermalData {
  type: string;
  timestamp: number;
  thermal_data: number[][];
  sensor_info: any;
  grid_size: { width: number; height: number };
}

interface ThermalMetricSnapshot {
  averageSurfaceTemperature: number | null;
  temperatureRange: number | null;
  thermalEventCount: number;
  heatmapVariance: number | null;
  thermalPatternStability: number | null;
  calibrationDrift: number | null;
  thermalSleepCorrelation: number | null;
}

const THERMAL_METRICS = [
  {
    metric: "Average surface temperature (°C)",
    type: "Quantitative",
    definition: "Mean pixel temperature across sensor grid",
    purpose: "Baseline skin or ambient temperature check",
  },
  {
    metric: "Temperature range (ΔT)",
    type: "Quantitative",
    definition: "Max – Min temperature per frame",
    purpose: "Highlights movement or changing thermal hotspots",
  },
  {
    metric: "Thermal event count",
    type: "Quantitative",
    definition: "# frames exceeding threshold (e.g., +2 °C change)",
    purpose: "Flags restlessness, hot spots, or caregiver touch",
  },
  {
    metric: "Heatmap variance",
    type: "Quantitative",
    definition: "Pixel temperature variance across the frame",
    purpose: "Quantifies motion or positional shifts across the bed",
  },
  {
    metric: "Thermal pattern stability (%)",
    type: "Quantitative",
    definition: "(Stable frames ÷ total frames) × 100",
    purpose: "Indicates consistency during rest",
  },
  {
    metric: "Calibration drift (°C/min)",
    type: "Quantitative",
    definition: "Difference in mean temperature over session",
    purpose: "Evaluates sensor reliability over time",
  },
  {
    metric: "Thermal-sleep correlation (r)",
    type: "Derived",
    definition: "Correlation between thermal activity and recorded sleep phase",
    purpose: "Links physiology to behavioral patterns",
  },
  {
    metric: "Clinician readability (1–10)",
    type: "Subjective",
    definition: "Surveyed clarity of heatmap visualization",
    purpose: "Ensures charts are ready for professional review",
  },
  {
    metric: "User comprehension (1–10)",
    type: "Subjective",
    definition: "Participant understanding of color scale",
    purpose: "Measures layperson usability of the heatmap",
  },
];

export default function SleepBehaviors() {
  const { addAlert } = useAlertCenter();
  const [isThermalActive, setIsThermalActive] = useState(false);
  const [currentTemp, setCurrentTemp] = useState(22.5);
  const [isRecording, setIsRecording] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [thermalData, setThermalData] = useState<ThermalData | null>(null);
  const [sessionData, setSessionData] = useState<ThermalData[]>([]);
  const [baselineTemp, setBaselineTemp] = useState<number | null>(null);
  const [isSensorConnected, setIsSensorConnected] = useState<boolean>(false);
  const [lastDataTime, setLastDataTime] = useState<number>(0);
  const [metricSnapshot, setMetricSnapshot] = useState<ThermalMetricSnapshot>({
    averageSurfaceTemperature: null,
    temperatureRange: null,
    thermalEventCount: 0,
    heatmapVariance: null,
    thermalPatternStability: null,
    calibrationDrift: null,
    thermalSleepCorrelation: null,
  });
  const [showThermalMetrics, setShowThermalMetrics] = useState(false);
  const [thermalCalibrationMatrix, setThermalCalibrationMatrix] = useState<number[][] | null>(null);
  const [thermalCalibrationTimestamp, setThermalCalibrationTimestamp] = useState<string | null>(null);
  const [isThermalBaselineCalibrating, setIsThermalBaselineCalibrating] = useState(false);
  const [baselineSampleCount, setBaselineSampleCount] = useState(0);

  const frameStatsRef = useRef<
    Array<{ timestamp: number; average: number; min: number; max: number; variance: number }>
  >([]);
  const totalFramesRef = useRef(0);
  const stableFrameCountRef = useRef(0);
  const eventCountRef = useRef(0);
  const restlessnessStreakRef = useRef(0);
  const outOfFrameStreakRef = useRef(0);
  const lastAlertsRef = useRef<{ highTemp: number; restlessness: number; outOfFrame: number }>({
    highTemp: 0,
    restlessness: 0,
    outOfFrame: 0,
  });
  const sessionStartRef = useRef<number | null>(null);
  const baselineSamplesRef = useRef<number[][][]>([]);
  const BASELINE_SAMPLE_TARGET = 25;

  const formatTemperature = (value: number | null, suffix = "°C") =>
    value === null ? "—" : `${value.toFixed(1)}${suffix}`;

  const formatDelta = (value: number | null) => {
    if (value === null) return "";
    const sign = value > 0 ? "+" : "";
    return `${sign}${value.toFixed(1)}°C`;
  };

  const baselineDelta = useMemo(() => {
    if (baselineTemp === null || metricSnapshot.averageSurfaceTemperature === null) {
      return null;
    }
    return metricSnapshot.averageSurfaceTemperature - baselineTemp;
  }, [baselineTemp, metricSnapshot.averageSurfaceTemperature]);

  const stabilityDescriptor = useMemo(() => {
    const value = metricSnapshot.thermalPatternStability;
    if (value === null) return { label: "Collecting baseline", tone: "text-gray-300" };
    if (value >= 80) return { label: "Calm", tone: "text-emerald-300" };
    if (value >= 50) return { label: "Some movement", tone: "text-yellow-200" };
    return { label: "Restless", tone: "text-red-300" };
  }, [metricSnapshot.thermalPatternStability]);

  const varianceDescriptor = useMemo(() => {
    const value = metricSnapshot.heatmapVariance;
    if (value === null) return { label: "Collecting data", tone: "text-gray-300" };
    if (value < 2) return { label: "Minimal motion", tone: "text-emerald-300" };
    if (value < 5) return { label: "Moderate motion", tone: "text-yellow-200" };
    return { label: "High motion", tone: "text-red-300" };
  }, [metricSnapshot.heatmapVariance]);

  const calibrationDescriptor = useMemo(() => {
    const value = metricSnapshot.calibrationDrift;
    if (value === null) return { label: "Need more time", tone: "text-gray-300" };
    if (Math.abs(value) < 0.2) return { label: "Stable", tone: "text-emerald-300" };
    if (Math.abs(value) < 0.5) return { label: "Monitor", tone: "text-yellow-200" };
    return { label: "Recalibration suggested", tone: "text-red-300" };
  }, [metricSnapshot.calibrationDrift]);

  const thermalMetricLiveValues = useMemo(
    () => ({
      "Average surface temperature (°C)":
        metricSnapshot.averageSurfaceTemperature === null
          ? "—"
          : `${metricSnapshot.averageSurfaceTemperature.toFixed(1)}°C`,
      "Temperature range (ΔT)":
        metricSnapshot.temperatureRange === null
          ? "—"
          : `${metricSnapshot.temperatureRange.toFixed(1)}°C`,
      "Thermal event count": metricSnapshot.thermalEventCount.toString(),
      "Heatmap variance":
        metricSnapshot.heatmapVariance === null
          ? "—"
          : metricSnapshot.heatmapVariance.toFixed(1),
      "Thermal pattern stability (%)":
        metricSnapshot.thermalPatternStability === null
          ? "—"
          : `${metricSnapshot.thermalPatternStability.toFixed(0)}%`,
      "Calibration drift (°C/min)":
        metricSnapshot.calibrationDrift === null
          ? "—"
          : `${metricSnapshot.calibrationDrift.toFixed(2)}°C/min`,
      "Thermal-sleep correlation (r)": "Needs sleep stage data",
      "Clinician readability (1–10)": "Survey pending",
      "User comprehension (1–10)": "Survey pending",
    }),
    [
      metricSnapshot.averageSurfaceTemperature,
      metricSnapshot.temperatureRange,
      metricSnapshot.thermalEventCount,
      metricSnapshot.heatmapVariance,
      metricSnapshot.thermalPatternStability,
      metricSnapshot.calibrationDrift,
    ]
  );

  // Handle sensor connection status changes
  const handleConnectionStatusChange = (connected: boolean) => {
    setIsSensorConnected(connected);
  };

  // Handle real thermal data from sensor
  const handleThermalDataReceived = (data: ThermalData) => {
    const now = Date.now();
    setThermalData(data);
    setLastDataTime(now);

    if (!data.thermal_data || data.thermal_data.length === 0) {
      return;
    }

    const temps = data.thermal_data.flat();
    if (temps.length === 0) return;

    if (isThermalBaselineCalibrating) {
      baselineSamplesRef.current.push(
        data.thermal_data.map((row) => [...row])
      );
      setBaselineSampleCount(baselineSamplesRef.current.length);
      if (baselineSamplesRef.current.length >= BASELINE_SAMPLE_TARGET) {
        const sampleCount = baselineSamplesRef.current.length;
        const avgMatrix = baselineSamplesRef.current[0].map((row, y) =>
          row.map((_, x) => {
            let sum = 0;
            for (const sample of baselineSamplesRef.current) {
              sum += sample[y][x];
            }
            return Math.round((sum / sampleCount) * 10) / 10;
          })
        );
        setThermalCalibrationMatrix(avgMatrix);
        setThermalCalibrationTimestamp(new Date().toLocaleTimeString());
        setIsThermalBaselineCalibrating(false);
        baselineSamplesRef.current = [];
        setBaselineSampleCount(0);
      }
    }

    const avgTemp = temps.reduce((sum, temp) => sum + temp, 0) / temps.length;
    const minTemp = Math.min(...temps);
    const maxTemp = Math.max(...temps);
    const range = maxTemp - minTemp;
    const variance =
      temps.reduce((acc, temp) => acc + Math.pow(temp - avgTemp, 2), 0) /
      temps.length;

    setCurrentTemp(avgTemp);

    totalFramesRef.current += 1;
    frameStatsRef.current.push({
      timestamp: data.timestamp ?? now,
      average: avgTemp,
      min: minTemp,
      max: maxTemp,
      variance,
    });
    if (frameStatsRef.current.length > 600) {
      frameStatsRef.current.shift();
    }

    if (!sessionStartRef.current) {
      sessionStartRef.current = data.timestamp ?? now;
    }

    let baselineForFrame = baselineTemp;
    if (baselineForFrame === null && frameStatsRef.current.length >= 10) {
      const recent = frameStatsRef.current.slice(-10);
      const computedBaseline =
        recent.reduce((sum, stat) => sum + stat.average, 0) / recent.length;
      baselineForFrame = computedBaseline;
      setBaselineTemp(computedBaseline);
    }

    const stableFrame =
      range < 1.0 && variance < 2.0 && baselineForFrame !== null;
    if (stableFrame) {
      stableFrameCountRef.current += 1;
    }

    const HIGH_TEMP_THRESHOLD = 2.0;
    const RESTLESS_RANGE_THRESHOLD = 2.5;
    const RESTLESS_VARIANCE_THRESHOLD = 4.0;
    const OUT_OF_FRAME_TEMP_DROP = 4.0;
    const OUT_OF_FRAME_WARM_RATIO = 0.2;
    const ALERT_COOLDOWN_MS = 2 * 60 * 1000;

    if (baselineForFrame !== null) {
      const tempDiff = avgTemp - baselineForFrame;
      const warmPixelRatio =
        temps.filter((temp) => temp >= baselineForFrame - 1).length / temps.length;

      const isHighTemp = tempDiff >= HIGH_TEMP_THRESHOLD;
      const isLowTemp = tempDiff <= -HIGH_TEMP_THRESHOLD;

      if (isHighTemp && now - lastAlertsRef.current.highTemp > ALERT_COOLDOWN_MS) {
        addAlert({
          message: `High surface temperature ${avgTemp.toFixed(
            1
          )}°C detected (${tempDiff.toFixed(1)}°C over baseline).`,
          severity: "critical",
          source: "Thermal Sensor",
        });
        lastAlertsRef.current.highTemp = now;
      }

      if (isLowTemp && now - lastAlertsRef.current.highTemp > ALERT_COOLDOWN_MS) {
        addAlert({
          message: `Surface temperature dropped to ${avgTemp.toFixed(
            1
          )}°C (${Math.abs(tempDiff).toFixed(1)}°C under baseline).`,
          severity: "warning",
          source: "Thermal Sensor",
        });
        lastAlertsRef.current.highTemp = now;
      }

      const restlessFrame =
        range > RESTLESS_RANGE_THRESHOLD ||
        variance > RESTLESS_VARIANCE_THRESHOLD ||
        Math.abs(tempDiff) > HIGH_TEMP_THRESHOLD;

      if (restlessFrame) {
        restlessnessStreakRef.current += 1;
      } else {
        restlessnessStreakRef.current = 0;
      }

      if (
        restlessnessStreakRef.current >= 3 &&
        now - lastAlertsRef.current.restlessness > ALERT_COOLDOWN_MS
      ) {
        addAlert({
          message: "Restlessness detected — check on the participant.",
          severity: "warning",
          source: "Thermal Sensor",
        });
        lastAlertsRef.current.restlessness = now;
      }

      const outOfFrameFrame =
        avgTemp <= baselineForFrame - OUT_OF_FRAME_TEMP_DROP ||
        warmPixelRatio < OUT_OF_FRAME_WARM_RATIO;

      if (outOfFrameFrame) {
        outOfFrameStreakRef.current += 1;
      } else {
        outOfFrameStreakRef.current = 0;
      }

      if (
        outOfFrameStreakRef.current >= 5 &&
        now - lastAlertsRef.current.outOfFrame > ALERT_COOLDOWN_MS
      ) {
        addAlert({
          message:
            "Thermal sensor lost track — participant may have left the bed or camera view.",
          severity: "critical",
          source: "Thermal Sensor",
        });
        lastAlertsRef.current.outOfFrame = now;
      }

      if (Math.abs(tempDiff) >= HIGH_TEMP_THRESHOLD) {
        eventCountRef.current += 1;
      }
    }

    const stabilityPercent =
      totalFramesRef.current > 0
        ? (stableFrameCountRef.current / totalFramesRef.current) * 100
        : null;

    const elapsedMinutes =
      sessionStartRef.current !== null
        ? Math.max(
            ((data.timestamp ?? now) - sessionStartRef.current) / 60000,
            0.01
          )
        : null;

    const calibrationDrift =
      baselineForFrame !== null && elapsedMinutes
        ? (avgTemp - baselineForFrame) / elapsedMinutes
        : null;

    setMetricSnapshot({
      averageSurfaceTemperature: avgTemp,
      temperatureRange: range,
      thermalEventCount: eventCountRef.current,
      heatmapVariance: variance,
      thermalPatternStability:
        stabilityPercent !== null
          ? Math.min(100, Math.max(0, stabilityPercent))
          : null,
      calibrationDrift,
      thermalSleepCorrelation: null,
    });

    if (isRecording) {
      setSessionData((prev) => [...prev, data]);
    }
  };

  // Session timer
  useEffect(() => {
    if (isRecording) {
      const interval = setInterval(() => {
        setSessionDuration(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isRecording]);

  // Check if sensor is connected based on recent data
  useEffect(() => {
    const checkConnection = () => {
      const now = Date.now();
      const timeSinceLastData = now - lastDataTime;
      const isActuallyConnected = lastDataTime > 0 && timeSinceLastData < 10000; // 10 seconds
      
      if (isActuallyConnected && !isSensorConnected) {
        setIsSensorConnected(true);
      } else if (!isActuallyConnected && isSensorConnected && lastDataTime > 0) {
        setIsSensorConnected(false);
      }
    };

    const interval = setInterval(checkConnection, 2000);
    return () => clearInterval(interval);
  }, [lastDataTime, isSensorConnected]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleThermal = () => {
    setIsThermalActive(!isThermalActive);
    if (!isThermalActive) {
      setCurrentTemp(22.5);
    }
  };

  const toggleRecording = () => {
    if (isThermalActive) {
      setIsRecording(!isRecording);
      if (!isRecording) {
        setSessionDuration(0);
      }
    }
  };

  const calibrateThermalBaseline = () => {
    if (!isThermalActive) return;
    setIsThermalBaselineCalibrating(true);
    baselineSamplesRef.current = [];
    setBaselineSampleCount(0);
  };

  const clearThermalCalibration = () => {
    setThermalCalibrationMatrix(null);
    setThermalCalibrationTimestamp(null);
    setIsThermalBaselineCalibrating(false);
    baselineSamplesRef.current = [];
    setBaselineSampleCount(0);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-black via-[#0b0520] to-[#0b1a3a] text-white">
      {/* Background gradients */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(1200px_600px_at_50%_-200px,rgba(168,85,247,0.25),transparent),radial-gradient(900px_500px_at_80%_120%,rgba(34,211,238,0.18),transparent),radial-gradient(800px_400px_at_10%_120%,rgba(59,130,246,0.12),transparent)]" />
      <div className="pointer-events-none absolute -top-24 right-1/2 h-[420px] w-[420px] translate-x-1/2 rounded-full bg-gradient-to-r from-fuchsia-500/25 via-purple-500/20 to-cyan-500/25 blur-3xl -z-10" />

      <main className="relative mx-auto max-w-6xl px-6 sm:px-10 py-8 sm:py-12">
        {/* Header */}
        <div className="flex flex-col items-center text-center gap-4 mb-8">
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-fuchsia-500/30 via-purple-500/20 to-cyan-500/30 blur-xl" />
            <div className="relative rounded-2xl border border-black/[.08] dark:border-white/[.12] bg-white/5 dark:bg-white/5 backdrop-blur p-4">
              <Image
                src="/digital_brain.png"
                alt="Cognitive Care Assistant logo"
                width={96}
                height={96}
                priority
                className="h-16 w-16 sm:h-20 sm:w-20 object-contain drop-shadow"
              />
            </div>
          </div>

                                            <div className="text-center">
               <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-2">
                 Sleep Behaviors
               </h1>
               <p className="text-sm text-gray-300">
                 Monitor thermal patterns and sleep analysis
               </p>
             </div>
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {/* Thermal Sensor Monitor */}
          <div className="lg:col-span-2">
            <div className="relative rounded-2xl border border-white/15 bg-white/5 backdrop-blur p-6">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-cyan-500/10 via-sky-500/5 to-blue-500/10 blur-xl" />
              <div className="relative">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">Thermal Sensor Monitor</h2>
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${isThermalActive ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                    <span className="text-sm">{isThermalActive ? 'Active' : 'Inactive'}</span>
                  </div>
                </div>

                {/* Thermal Sensor Display */}
                <div className="relative aspect-video rounded-xl border border-white/20 bg-gradient-to-br from-gray-900 to-gray-800 overflow-hidden mb-6">
                  {isThermalActive ? (
                    <div className="absolute inset-0 flex items-center justify-center p-4">
                      <ThermalVisualization 
                        isActive={isThermalActive}
                        onDataReceived={handleThermalDataReceived}
                        onConnectionStatusChange={handleConnectionStatusChange}
                        calibrationMatrix={thermalCalibrationMatrix}
                      />
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <svg className="w-16 h-16 mx-auto mb-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-gray-400">Sensor Offline</p>
                        <p className="text-xs text-gray-500 mt-2">Click "Start Sensor" to connect to thermal sensor</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Control Buttons */}
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={toggleThermal}
                      className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                        isThermalActive
                          ? 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600'
                          : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
                      }`}
                    >
                      {isThermalActive ? 'Stop Sensor' : 'Start Sensor'}
                    </button>
                    
                    <button
                      onClick={toggleRecording}
                      disabled={!isThermalActive}
                      className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                        isRecording
                          ? 'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600'
                          : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {isRecording ? 'Stop Recording' : 'Start Recording'}
                    </button>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={calibrateThermalBaseline}
                      disabled={!thermalData || isThermalBaselineCalibrating}
                      className="flex-1 py-3 px-4 rounded-lg border border-cyan-400/40 bg-cyan-500/10 text-cyan-100 font-medium hover:bg-cyan-500/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isThermalBaselineCalibrating
                        ? 'Calibrating...'
                        : thermalCalibrationMatrix
                          ? 'Recalibrate Baseline'
                          : 'Calibrate Baseline'}
                    </button>
                    <button
                      onClick={clearThermalCalibration}
                      disabled={!thermalCalibrationMatrix && !isThermalBaselineCalibrating}
                      className="flex-1 py-3 px-4 rounded-lg border border-white/15 bg-white/5 text-gray-200 font-medium hover:bg-white/10 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Clear Calibration
                    </button>
                  </div>
                  {isThermalBaselineCalibrating && (
                    <p className="text-xs text-cyan-200">
                      Capturing baseline ({baselineSampleCount}/{BASELINE_SAMPLE_TARGET}) — keep the scene steady.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="space-y-6">
            {/* Temperature Display */}
            <div className="relative rounded-2xl border border-white/15 bg-white/5 backdrop-blur p-6">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-orange-500/10 via-red-500/5 to-pink-500/10 blur-xl" />
              <div className="relative text-center">
                <h3 className="text-lg font-medium mb-4">Current Temperature</h3>
                <div className="text-4xl font-bold text-orange-400 mb-2">
                  {currentTemp.toFixed(1)}°C
                </div>
                <p className="text-sm text-gray-300">Room Temperature</p>
              </div>
            </div>

            {/* Recording Status */}
            <div className="relative rounded-2xl border border-white/15 bg-white/5 backdrop-blur p-6">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-purple-500/10 via-fuchsia-500/5 to-pink-500/10 blur-xl" />
              <div className="relative text-center">
                <h3 className="text-lg font-medium mb-4">Recording Status</h3>
                <div className="text-2xl font-bold text-purple-400 mb-2">
                  {isRecording ? formatTime(sessionDuration) : '00:00'}
                </div>
                <p className="text-sm text-gray-300">
                  {isRecording ? 'Session Active' : 'Not Recording'}
                </p>
              </div>
            </div>

          {/* Live Thermal Metrics */}
          <div className="relative rounded-2xl border border-white/15 bg-white/5 backdrop-blur p-6">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-cyan-500/10 via-blue-500/5 to-indigo-500/10 blur-xl" />
            <div className="relative">
              <div className="mb-4">
                <h3 className="text-lg font-medium">Live Thermal Metrics</h3>
                <p className="text-xs text-gray-300">
                  Auto-generated from the latest sensor frames so caregivers can act fast.
                </p>
                {thermalCalibrationMatrix && (
                  <p className="text-[11px] text-cyan-200 mt-1">
                    Displaying values relative to baseline captured at {thermalCalibrationTimestamp}.
                  </p>
                )}
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-gray-300">Average surface temp</p>
                    <p className="text-xs text-gray-400">
                      {baselineTemp !== null
                        ? `Baseline ${baselineTemp.toFixed(1)}°C`
                        : "Baseline calibrating"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-semibold text-cyan-200">
                      {formatTemperature(metricSnapshot.averageSurfaceTemperature)}
                    </p>
                    <p className="text-xs text-gray-400">{formatDelta(baselineDelta)}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <p className="text-gray-300">Temperature range (ΔT)</p>
                  <p className="text-lg font-semibold text-cyan-200">
                    {metricSnapshot.temperatureRange === null
                      ? "—"
                      : `${metricSnapshot.temperatureRange.toFixed(1)}°C`}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <p className="text-gray-300">Heatmap variance</p>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-cyan-200">
                      {metricSnapshot.heatmapVariance === null
                        ? "—"
                        : metricSnapshot.heatmapVariance.toFixed(1)}
                    </p>
                    <p className={`text-xs ${varianceDescriptor.tone}`}>{varianceDescriptor.label}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <p className="text-gray-300">Pattern stability</p>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-cyan-200">
                      {metricSnapshot.thermalPatternStability === null
                        ? "—"
                        : `${metricSnapshot.thermalPatternStability.toFixed(0)}%`}
                    </p>
                    <p className={`text-xs ${stabilityDescriptor.tone}`}>{stabilityDescriptor.label}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <p className="text-gray-300">Thermal event count</p>
                  <p className="text-lg font-semibold text-cyan-200">
                    {metricSnapshot.thermalEventCount}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <p className="text-gray-300">Calibration drift</p>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-cyan-200">
                      {metricSnapshot.calibrationDrift === null
                        ? "—"
                        : `${metricSnapshot.calibrationDrift.toFixed(2)}°C/min`}
                    </p>
                    <p className={`text-xs ${calibrationDescriptor.tone}`}>
                      {calibrationDescriptor.label}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          </div>
        </div>

        {/* Session Data Display */}
        {isRecording && sessionData.length > 0 && (
          <div className="mb-8">
            <div className="relative rounded-2xl border border-white/15 bg-white/5 backdrop-blur p-6">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-purple-500/10 via-fuchsia-500/5 to-pink-500/10 blur-xl" />
              <div className="relative">
                <h2 className="text-xl font-semibold mb-4">Recording Session Data</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Session Statistics</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-300">Data Points:</span>
                        <span className="text-white">{sessionData.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Duration:</span>
                        <span className="text-white">{formatTime(sessionDuration)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Avg Temperature:</span>
                        <span className="text-white">{currentTemp.toFixed(1)}°C</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-2">Temperature Range</h3>
                    <div className="space-y-2 text-sm">
                      {thermalData && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-gray-300">Min:</span>
                            <span className="text-blue-400">
                              {Math.min(...thermalData.thermal_data.flat()).toFixed(1)}°C
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-300">Max:</span>
                            <span className="text-red-400">
                              {Math.max(...thermalData.thermal_data.flat()).toFixed(1)}°C
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Thermal Metrics Reference */}
        <div className="mb-8">
          <div className="relative rounded-2xl border border-white/15 bg-white/5 backdrop-blur p-6">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-cyan-500/10 via-purple-500/5 to-pink-500/10 blur-xl" />
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowThermalMetrics((prev) => !prev)}
                className="w-full flex items-center justify-between gap-3 rounded-lg bg-white/10 px-4 py-3 text-left hover:bg-white/15 transition"
                aria-expanded={showThermalMetrics}
                aria-controls="thermal-metrics-panel"
              >
                <div>
                  <h3 className="text-lg font-semibold text-white">What the thermal metrics mean</h3>
                  <p className="text-xs text-gray-300">
                    Definitions that match the live sensor snapshot so families and clinicians see the same story.
                  </p>
                </div>
                <span className="text-xl text-gray-200">{showThermalMetrics ? "−" : "+"}</span>
              </button>

              {showThermalMetrics && (
                <div id="thermal-metrics-panel" className="mt-4 space-y-3">
                  {THERMAL_METRICS.map((item) => (
                    <div
                      key={item.metric}
                      className="rounded-xl border border-white/10 bg-white/10 p-4 shadow-inner"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                        <div>
                          <h4 className="text-base font-semibold text-white">{item.metric}</h4>
                          <p className="text-xs uppercase tracking-wide text-gray-300">{item.type}</p>
                        </div>
                        <div className="text-right text-sm text-cyan-200">
                          {thermalMetricLiveValues[item.metric as keyof typeof thermalMetricLiveValues] ?? "—"}
                        </div>
                      </div>
                      <p className="text-sm text-gray-200 mb-2">
                        <span className="font-medium text-white">Definition: </span>
                        {item.definition}
                      </p>
                      <p className="text-sm text-gray-200">
                        <span className="font-medium text-white">Purpose: </span>
                        {item.purpose}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/dashboard"
            className="group relative block rounded-xl border border-white/15 bg-white/5 backdrop-blur px-5 py-6 hover:bg-white/10 transition-all duration-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium mb-2">Dashboard</h3>
                <p className="text-sm text-gray-300">Return to main dashboard</p>
              </div>
              <span className="text-2xl opacity-60 transition-transform group-hover:translate-x-1">→</span>
            </div>
          </Link>

          <Link
            href="/sensors"
            className="group relative block rounded-xl border border-white/15 bg-white/5 backdrop-blur px-5 py-6 hover:bg-white/10 transition-all duration-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium mb-2">Sensors</h3>
                <p className="text-sm text-gray-300">View all sensor data</p>
              </div>
              <span className="text-2xl opacity-60 transition-transform group-hover:translate-x-1">→</span>
            </div>
          </Link>
        </div>
       </main>
     </div>
   );
}

