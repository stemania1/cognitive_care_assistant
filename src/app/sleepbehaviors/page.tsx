"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import ThermalVisualization from "../components/ThermalVisualization";
import { useAlertCenter } from "../components/AlertCenter";
import { supabase, safeGetUser } from "@/lib/supabaseClient";
import { isGuestUser, getGuestUserId } from "@/lib/guestDataManager";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

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

// Component for live motion chart during recording
interface LiveMotionChartProps {
  samples: Array<{ sampleIndex: number; timestamp: number; heatmapVariance: number | null; patternStability: number | null; temperatureRange?: number | null; temperatureChange?: number | null; restlessness?: number | null }>;
  sessionStart: number | null;
}

function LiveMotionChart({ samples, sessionStart }: LiveMotionChartProps) {
  // Apply rolling window: keep only last 20 seconds of data
  const ROLLING_WINDOW_SECONDS = 20;
  const filteredSamples = (() => {
    if (!samples || samples.length === 0) return [];
    if (!sessionStart) return samples; // If no session start, show all data
    
    const now = Date.now();
    const cutoffTime = now - (ROLLING_WINDOW_SECONDS * 1000);
    
    // Filter samples that are within the rolling window
    const filtered = samples.filter(sample => sample.timestamp >= cutoffTime);
    
    // If filtering removes all data but we have samples, show all samples (might be early in recording)
    return filtered.length > 0 ? filtered : samples;
  })();

  const getChartData = () => {
    if (!filteredSamples || filteredSamples.length === 0) {
      return null;
    }
    
    // For rolling window chart, show time relative to sessionStart
    // If no sessionStart, use the oldest sample in the window
    let baseTime: number;
    if (sessionStart) {
      baseTime = sessionStart;
    } else if (filteredSamples.length > 0) {
      // Fallback: use oldest sample time
      baseTime = Math.min(...filteredSamples.map(s => s.timestamp || Date.now()));
    } else {
      baseTime = Date.now();
    }
    
    // Create labels array with numeric seconds values (formatted to 1 decimal)
    const labels = filteredSamples.map((sample, index) => {
      if (!sample.timestamp) {
        // If no timestamp, use index as fallback (assuming ~100ms per sample)
        return (index * 0.1).toFixed(1);
      }
      
      const seconds = (sample.timestamp - baseTime) / 1000;
      
      // If seconds is 0 or negative for all samples, use index-based time
      if (seconds <= 0 && index > 0) {
        // Estimate time based on index (assuming samples come every ~100-200ms)
        return (index * 0.15).toFixed(1);
      }
      
      // Return formatted to 1 decimal place, ensuring positive value
      const value = Math.max(0, seconds);
      return isNaN(value) ? (index * 0.1).toFixed(1) : value.toFixed(1);
    });

    const datasets: any[] = [
      {
        label: 'Motion / Heatmap Variance',
        data: filteredSamples.map(s => s.heatmapVariance ?? null),
        borderColor: 'rgb(34, 211, 238)',
        backgroundColor: 'rgba(34, 211, 238, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 1,
        pointHoverRadius: 3,
        yAxisID: 'y',
      },
    ];

    if (filteredSamples.some(s => s.temperatureRange !== null && s.temperatureRange !== undefined)) {
      datasets.push({
        label: 'Temperature Range (°C)',
        data: filteredSamples.map(s => s.temperatureRange ?? null),
        borderColor: 'rgb(251, 146, 60)',
        backgroundColor: 'rgba(251, 146, 60, 0.1)',
        borderWidth: 2,
        fill: false,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 2,
        yAxisID: 'y1',
      });
    }

    if (filteredSamples.some(s => s.temperatureChange !== null && s.temperatureChange !== undefined)) {
      datasets.push({
        label: 'Temperature Change (°C)',
        data: filteredSamples.map(s => s.temperatureChange ?? null),
        borderColor: 'rgb(168, 85, 247)',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        borderWidth: 2,
        fill: false,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 2,
        yAxisID: 'y1',
      });
    }

    return { labels, datasets };
  };

  const chartData = getChartData();
  const hasTemperatureData = filteredSamples.some(s => s.temperatureRange !== null || s.temperatureChange !== null);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 0, // Disable animation for real-time updates
    },
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          color: 'rgb(156, 163, 175)',
          font: {
            size: 11,
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgb(34, 211, 238)',
        borderWidth: 1,
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            if (label.includes('Temperature')) {
              return `${label}: ${value !== null ? value.toFixed(1) + '°C' : 'N/A'}`;
            }
            if (label === 'Restlessness') {
              return `${label}: ${value === 1 ? 'Yes' : value === 0 ? 'No' : 'N/A'}`;
            }
            return `${label}: ${value !== null ? value.toFixed(2) : 'N/A'}`;
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Time (seconds from start)',
          color: 'rgb(156, 163, 175)',
        },
        ticks: {
          color: 'rgb(156, 163, 175)',
          maxRotation: 45,
          minRotation: 45,
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Motion / Variance',
          color: 'rgb(34, 211, 238)',
        },
        ticks: {
          color: 'rgb(34, 211, 238)',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
      y1: {
        type: 'linear' as const,
        display: hasTemperatureData,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Temperature (°C)',
          color: 'rgb(251, 146, 60)',
        },
        ticks: {
          color: 'rgb(251, 146, 60)',
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  if (!chartData) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-400">
          {samples.length === 0 
            ? "Waiting for motion data..." 
            : `Data available (${samples.length} samples) but chart cannot render`}
        </p>
      </div>
    );
  }

  // Ensure chart data has valid values
  const hasValidData = chartData.datasets.some(dataset => 
    dataset.data.some((val: any) => val !== null && val !== undefined && !isNaN(val))
  );

  if (!hasValidData) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-400">
          Chart ready but no valid numeric data found ({samples.length} samples)
        </p>
        <p className="text-xs text-gray-500 mt-2">
          Filtered: {filteredSamples.length} samples | Has variance: {filteredSamples.some(s => s.heatmapVariance !== null)}
        </p>
      </div>
    );
  }

  return <Line data={chartData} options={chartOptions} />;
}

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
  const [subjectIdentifier, setSubjectIdentifier] = useState("Test_Subject");
  const [userId, setUserId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [moveEventCount, setMoveEventCount] = useState(0);
  const [moveButtonPressed, setMoveButtonPressed] = useState(false);
  const [chartUpdateTrigger, setChartUpdateTrigger] = useState(0);

  const frameStatsRef = useRef<
    Array<{ timestamp: number; average: number; min: number; max: number; variance: number }>
  >([]);
  const totalFramesRef = useRef(0);
  const stableFrameCountRef = useRef(0);
  const eventCountRef = useRef(0);
  const recordingTotalFramesRef = useRef(0);
  const recordingStableFramesRef = useRef(0);
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
  const sessionSamplesRef = useRef<Array<{ sampleIndex: number; timestamp: number; heatmapVariance: number | null; patternStability: number | null; temperatureRange?: number | null; temperatureChange?: number | null; restlessness?: number | null; averageTemperature?: number | null; thermalData?: number[][] | null }>>([]);
  const moveEventsRef = useRef<Array<{ timestamp: number; secondsFromStart: number }>>([]);
  const movementDetectedRef = useRef<Array<{ timestamp: number; secondsFromStart: number }>>([]);

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
    // Adjusted thresholds to account for sensor noise (5.1 is noise, not motion)
    if (value < 6) return { label: "Minimal motion", tone: "text-emerald-300" };
    if (value < 12) return { label: "Moderate motion", tone: "text-yellow-200" };
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

    // Calculate variance on RAW thermal data (before any calibration/smoothing)
    // This ensures motion detection works correctly
    const rawTemps = data.thermal_data.flat();
    if (rawTemps.length === 0) return;

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

    // Calculate statistics on RAW data for accurate variance detection
    const avgTemp = rawTemps.reduce((sum, temp) => sum + temp, 0) / rawTemps.length;
    const minTemp = Math.min(...rawTemps);
    const maxTemp = Math.max(...rawTemps);
    const range = maxTemp - minTemp;
    // Variance calculated on raw thermal data to detect motion accurately
    const variance =
      rawTemps.reduce((acc, temp) => acc + Math.pow(temp - avgTemp, 2), 0) /
      rawTemps.length;

    setCurrentTemp(avgTemp);

    totalFramesRef.current += 1;
    if (isRecording) {
      recordingTotalFramesRef.current += 1;
    }
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

    // A stable frame has low variance (sensor noise level) and reasonable temperature range
    // Adjusted thresholds to account for sensor noise - range and variance thresholds are more lenient
    // when still, range can be 2-4°C due to sensor noise and thermal variation across the frame
    const stableFrame =
      range < 4.0 && variance < 8.0 && baselineForFrame !== null; // Adjusted for sensor noise
    if (stableFrame) {
      stableFrameCountRef.current += 1;
      if (isRecording) {
        recordingStableFramesRef.current += 1;
      }
    }

    const HIGH_TEMP_THRESHOLD = 2.0;
    const RESTLESS_RANGE_THRESHOLD = 2.5;
    const RESTLESS_VARIANCE_THRESHOLD = 12.0; // Adjusted for sensor noise (was 4.0)
    const OUT_OF_FRAME_TEMP_DROP = 4.0;
    const OUT_OF_FRAME_WARM_RATIO = 0.2;
    const ALERT_COOLDOWN_MS = 2 * 60 * 1000;

    if (baselineForFrame !== null) {
      const tempDiff = avgTemp - baselineForFrame;
      const warmPixelRatio =
        rawTemps.filter((temp) => temp >= baselineForFrame - 1).length / rawTemps.length;

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

      // Debug logging for movement detection (only during recording to avoid spam)
      if (isRecording && (restlessFrame || restlessnessStreakRef.current > 0)) {
        console.log(`🔍 Movement Detection Debug:`, {
          range: range.toFixed(2),
          rangeThreshold: RESTLESS_RANGE_THRESHOLD,
          rangeExceeded: range > RESTLESS_RANGE_THRESHOLD,
          variance: variance.toFixed(2),
          varianceThreshold: RESTLESS_VARIANCE_THRESHOLD,
          varianceExceeded: variance > RESTLESS_VARIANCE_THRESHOLD,
          tempDiff: tempDiff.toFixed(2),
          tempThreshold: HIGH_TEMP_THRESHOLD,
          tempExceeded: Math.abs(tempDiff) > HIGH_TEMP_THRESHOLD,
          restlessFrame,
          currentStreak: restlessnessStreakRef.current,
          baselineTemp: baselineForFrame?.toFixed(2) || 'null',
          avgTemp: avgTemp.toFixed(2)
        });
      }

      // Calculate restlessness value: 1 if restless, 0 if not
      const restlessnessValue = restlessFrame ? 1 : 0;

      if (restlessFrame) {
        restlessnessStreakRef.current += 1;
        
        // Track movement detection during recording
        // Only record when we have a sustained detection (3+ frames)
        // Record immediately when streak reaches exactly 3 (first detection of a movement period)
        if (isRecording && sessionStartRef.current && restlessnessStreakRef.current === 3) {
          const secondsFromStart = Math.floor((now - sessionStartRef.current) / 1000);
          console.log(`🎯 MOVEMENT DETECTED! Adding to movementDetectedRef at ${secondsFromStart}s`);
          movementDetectedRef.current.push({
            timestamp: now,
            secondsFromStart: secondsFromStart,
          });
        }
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

    // Calculate pattern stability: use recording-specific counters if recording, otherwise use all-time counters
    const stabilityPercent = isRecording
      ? (recordingTotalFramesRef.current > 0
          ? (recordingStableFramesRef.current / recordingTotalFramesRef.current) * 100
          : null)
      : (totalFramesRef.current > 0
          ? (stableFrameCountRef.current / totalFramesRef.current) * 100
          : null);

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

    const finalStability = stabilityPercent !== null
      ? Math.min(100, Math.max(0, stabilityPercent))
      : null;

    setMetricSnapshot({
      averageSurfaceTemperature: avgTemp,
      temperatureRange: range,
      thermalEventCount: eventCountRef.current,
      heatmapVariance: variance,
      thermalPatternStability: finalStability,
      calibrationDrift,
      thermalSleepCorrelation: null,
    });

    if (isRecording) {
      setSessionData((prev) => [...prev, data]);
      // Calculate temperature change from baseline
      const tempChange = baselineForFrame !== null ? avgTemp - baselineForFrame : null;
      
      // Calculate restlessness value: 1 if restless frame detected, 0 otherwise
      // Use the same logic as the restlessFrame calculation above
      const restlessnessFrame = baselineForFrame !== null && (
        range > RESTLESS_RANGE_THRESHOLD ||
        variance > RESTLESS_VARIANCE_THRESHOLD ||
        Math.abs(tempChange ?? 0) > HIGH_TEMP_THRESHOLD
      );
      const restlessnessValue = restlessnessFrame ? 1 : 0;
      
      // Store sample data for saving to database
      sessionSamplesRef.current.push({
        sampleIndex: sessionSamplesRef.current.length,
        timestamp: data.timestamp ?? now,
        heatmapVariance: variance,
        patternStability: finalStability,
        temperatureRange: range,
        temperatureChange: tempChange,
        restlessness: restlessnessValue,
        averageTemperature: avgTemp,
        thermalData: data.thermal_data ? JSON.parse(JSON.stringify(data.thermal_data)) : null, // Deep copy the thermal grid
      });
      
      // Trigger chart update on every sample for real-time display
      setChartUpdateTrigger(prev => prev + 1);
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

  const handleMoveButton = () => {
    if (!isRecording || !sessionStartRef.current) {
      return;
    }

    const now = Date.now();
    const secondsFromStart = Math.floor((now - sessionStartRef.current) / 1000);
    
    moveEventsRef.current.push({
      timestamp: now,
      secondsFromStart: secondsFromStart,
    });

    // Update the move event count for UI display
    setMoveEventCount(moveEventsRef.current.length);

    // Visual feedback - button pressed animation
    setMoveButtonPressed(true);
    setTimeout(() => setMoveButtonPressed(false), 200);

    addAlert({
      message: `Move event recorded at ${formatTime(secondsFromStart)}`,
      severity: "info",
      source: "Thermal Sensor",
    });
  };

  const toggleThermal = () => {
    setIsThermalActive(!isThermalActive);
    if (!isThermalActive) {
      setCurrentTemp(22.5);
    }
  };

  // Get user ID on mount
  useEffect(() => {
    async function initializeUser() {
      try {
        const guestStatus = await isGuestUser();
        if (guestStatus) {
          const guestUserId = getGuestUserId();
          setUserId(guestUserId);
        } else {
          const { user } = await safeGetUser();
          if (user?.id) {
            setUserId(user.id);
          }
        }
      } catch (error) {
        console.error('Error getting user:', error);
      }
    }
    initializeUser();
  }, []);

  const toggleRecording = async () => {
    if (isThermalActive) {
      if (!isRecording) {
        // Starting recording - reset counters and session data
        setSessionDuration(0);
        eventCountRef.current = 0;
        recordingTotalFramesRef.current = 0;
        recordingStableFramesRef.current = 0;
        setSessionData([]);
        sessionSamplesRef.current = [];
        moveEventsRef.current = [];
        movementDetectedRef.current = [];
        setMoveEventCount(0);
        sessionStartRef.current = Date.now();
        
        console.log(`🎬 RECORDING STARTED:`, {
          baselineTemp: baselineTemp?.toFixed(2) || 'null',
          currentTemp: currentTemp.toFixed(2),
          thresholds: {
            RESTLESS_RANGE_THRESHOLD: 2.5,
            RESTLESS_VARIANCE_THRESHOLD: 12.0,
            HIGH_TEMP_THRESHOLD: 2.0
          },
          resetStates: {
            restlessnessStreak: 0,
            movementDetected: 0,
            moveEvents: 0
          }
        });
        
        // Reset detection state
        restlessnessStreakRef.current = 0;
        
        setIsRecording(true);
      } else {
        // Stopping recording - stop immediately, then try to save
        const startedAt = sessionStartRef.current ?? Date.now();
        const endedAt = Date.now();
        const durationSeconds = Math.floor((endedAt - startedAt) / 1000);
        
        console.log('🛑 RECORDING STOPPED - Final Summary:', {
          sessionSamples: sessionSamplesRef.current.length,
          moveEvents: moveEventsRef.current.length,
          movementDetected: movementDetectedRef.current.length,
          movementDetectedEvents: movementDetectedRef.current,
          subjectIdentifier,
          userId,
          sessionDuration: `${durationSeconds}s`,
          baselineTemp: baselineTemp?.toFixed(2) || 'null'
        });
        
        // Stop recording immediately (better UX - user doesn't wait for save)
        setIsRecording(false);
        
        // Validate and save in background
        if (!subjectIdentifier.trim()) {
          addAlert({
            message: "Recording stopped. Please enter a subject identifier to save the session.",
            severity: "warning",
            source: "Thermal Sensor",
          });
          // Reset session data since we can't save without subject identifier
          setSessionData([]);
          sessionSamplesRef.current = [];
          moveEventsRef.current = [];
          movementDetectedRef.current = [];
          setMoveEventCount(0);
          return;
        }

        if (!userId) {
          addAlert({
            message: "Recording stopped. Unable to save session: user not authenticated.",
            severity: "critical",
            source: "Thermal Sensor",
          });
          // Reset session data since we can't save without user ID
          setSessionData([]);
          sessionSamplesRef.current = [];
          moveEventsRef.current = [];
          movementDetectedRef.current = [];
          setMoveEventCount(0);
          return;
        }

        // Calculate averages from frameStatsRef
        const recordingFrames = frameStatsRef.current.filter(
          (frame) => frame.timestamp >= startedAt && frame.timestamp <= endedAt
        );

        const averageSurfaceTemp = recordingFrames.length > 0
          ? recordingFrames.reduce((sum, f) => sum + f.average, 0) / recordingFrames.length
          : null;

        const averageTempRange = recordingFrames.length > 0
          ? recordingFrames.reduce((sum, f) => sum + (f.max - f.min), 0) / recordingFrames.length
          : null;

        // Save to database in background (non-blocking)
        setIsSaving(true);
        (async () => {
          try {
            console.log('💾 Saving thermal session with data:', {
              userId,
              subjectIdentifier: subjectIdentifier.trim(),
              startedAt: new Date(startedAt).toISOString(),
              endedAt: new Date(endedAt).toISOString(),
              durationSeconds,
              averageSurfaceTemp,
              averageTemperatureRange: averageTempRange,
              thermalEventCount: eventCountRef.current,
              samplesCount: sessionSamplesRef.current.length,
              moveEventsCount: moveEventsRef.current.length,
              movementDetectedCount: movementDetectedRef.current.length,
            });

            const response = await fetch('/api/thermal-sessions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId,
                subjectIdentifier: subjectIdentifier.trim(),
                startedAt: new Date(startedAt).toISOString(),
                endedAt: new Date(endedAt).toISOString(),
                durationSeconds,
                averageSurfaceTemp,
                averageTemperatureRange: averageTempRange,
                thermalEventCount: eventCountRef.current,
                samples: sessionSamplesRef.current,
                moveEvents: moveEventsRef.current,
                movementDetected: movementDetectedRef.current,
              }),
            });

            const result = await response.json();
            console.log('📊 Save session API response:', {
              status: response.status,
              ok: response.ok,
              result: result
            });

            if (!response.ok) {
              throw new Error(result.error || result.details || 'Failed to save session');
            }

            addAlert({
              message: `Session saved successfully for Subject: ${subjectIdentifier.trim()}.`,
              severity: "info",
              source: "Thermal Sensor",
            });
            
            // Clear session data after successful save
            setSessionData([]);
            sessionSamplesRef.current = [];
            moveEventsRef.current = [];
            movementDetectedRef.current = [];
            setMoveEventCount(0);
          } catch (error) {
            console.error('Error saving session:', error);
            addAlert({
              message: `Failed to save session: ${error instanceof Error ? error.message : 'Unknown error'}`,
              severity: "critical",
              source: "Thermal Sensor",
            });
          } finally {
            setIsSaving(false);
          }
        })();
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

        {/* Main Layout: Live Thermal Metrics (Left) and Thermal Sensor Display (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {/* Live Thermal Metrics - Left Side */}
          <div className="lg:col-span-1">
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

                  {/* Sensor Info Section */}
                  {thermalData && thermalData.sensor_info && (
                    <>
                      <div className="pt-4 mt-4 border-t border-white/10">
                        <p className="text-xs text-gray-400 mb-3 uppercase tracking-wide">Sensor Information</p>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between gap-4">
                            <p className="text-gray-300">Sensor Model</p>
                            <p className="text-sm font-medium text-cyan-200">
                              {thermalData.sensor_info.model || thermalData.sensor_info.type || "AMG8833"}
                            </p>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <p className="text-gray-300">Sensor Status</p>
                            <p className="text-sm font-medium text-cyan-200">
                              {thermalData.sensor_info.status || "Active"}
                            </p>
                          </div>
                          {thermalData.sensor_info.bus && thermalData.sensor_info.bus !== 'none' && (
                            <div className="flex items-center justify-between gap-4">
                              <p className="text-gray-300">I2C Bus</p>
                              <p className="text-sm font-medium text-cyan-200">
                                {thermalData.sensor_info.bus}
                              </p>
                            </div>
                          )}
                          {thermalData.thermal_data && thermalData.thermal_data.length > 0 && (
                            <>
                              <div className="flex items-center justify-between gap-4 pt-2 mt-2 border-t border-white/5">
                                <p className="text-gray-300">Current Temperature</p>
                                <p className="text-lg font-semibold text-cyan-200">
                                  {(() => {
                                    const temps = thermalData.thermal_data.flat();
                                    const avg = temps.reduce((sum, temp) => sum + temp, 0) / temps.length;
                                    return avg.toFixed(1);
                                  })()}°C
                                </p>
                              </div>
                              <div className="flex items-center justify-between gap-4">
                                <p className="text-gray-300">Temperature Range</p>
                                <p className="text-sm font-medium text-cyan-200">
                                  {Math.min(...thermalData.thermal_data.flat()).toFixed(1)}°C - {Math.max(...thermalData.thermal_data.flat()).toFixed(1)}°C
                                </p>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Thermal Sensor Display - Right Side */}
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
                <div className="flex justify-center mb-6">
                  <div className="relative inline-flex items-center justify-center rounded-xl border border-white/20 bg-gradient-to-br from-gray-900 to-gray-800 overflow-hidden">
                    {isThermalActive ? (
                      <div className="flex items-center justify-center p-4">
                        <ThermalVisualization 
                          isActive={isThermalActive}
                          onDataReceived={handleThermalDataReceived}
                          onConnectionStatusChange={handleConnectionStatusChange}
                          calibrationMatrix={thermalCalibrationMatrix}
                          isBaselineCalibrating={isThermalBaselineCalibrating}
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
                </div>

                {/* Control Buttons */}
                <div className="flex flex-col gap-3">
                  {/* Subject Identifier Input */}
                  <div>
                    <label htmlFor="subject-identifier" className="block text-sm font-medium text-gray-300 mb-2">
                      Subject
                    </label>
                    <input
                      id="subject-identifier"
                      type="text"
                      value={subjectIdentifier}
                      onChange={(e) => setSubjectIdentifier(e.target.value)}
                      placeholder="Enter subject ID or name"
                      disabled={isRecording}
                      className={`w-full py-2 px-4 rounded-lg border ${
                        isRecording
                          ? 'border-white/10 bg-white/5 text-gray-400 cursor-not-allowed'
                          : 'border-white/20 bg-white/10 text-white placeholder-gray-400 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20'
                      } transition-all`}
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Required before saving a recording session
                    </p>
                  </div>

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
                      disabled={!isThermalActive || isSaving}
                      className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                        isRecording
                          ? 'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600'
                          : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {isSaving ? 'Saving...' : isRecording ? 'Stop Recording' : 'Start Recording'}
                    </button>
                  </div>
                  {isRecording && (
                    <div className="flex flex-col gap-3">
                      <button
                        onClick={handleMoveButton}
                        className={`flex-1 py-3 px-4 rounded-lg border border-yellow-400/40 font-medium transition-all duration-200 ${
                          moveButtonPressed
                            ? 'bg-yellow-500/40 scale-95'
                            : 'bg-yellow-500/10 text-yellow-100 hover:bg-yellow-500/20'
                        }`}
                      >
                        📍 Mark Move Event {moveEventCount > 0 && `(${moveEventCount})`}
                      </button>
                    </div>
                  )}
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
                    <p className="text-xs text-cyan-200 text-center">
                      Capturing baseline ({baselineSampleCount}/{BASELINE_SAMPLE_TARGET}) — keep the scene steady.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
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
              <p className="text-sm text-gray-300 mb-2">
                {isRecording ? 'Session Active' : 'Not Recording'}
              </p>
              {isRecording && moveEventCount > 0 && (
                <div className="mt-2 pt-2 border-t border-white/10">
                  <p className="text-xs text-gray-400">Move Events</p>
                  <p className="text-lg font-semibold text-yellow-400">{moveEventCount}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Live Motion Chart - Only during recording */}
        {isRecording && sessionSamplesRef.current.length > 0 && (
          <div className="mb-8">
            <div className="relative rounded-2xl border border-white/15 bg-white/5 backdrop-blur p-6">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-purple-500/10 via-fuchsia-500/5 to-pink-500/10 blur-xl" />
              <div className="relative">
                <h2 className="text-xl font-semibold mb-4">Live Motion Chart</h2>
                <div className="text-xs text-gray-400 mb-2">
                  Showing {sessionSamplesRef.current.length} sample(s) | Window: 20 seconds
                </div>
                <div className="h-80">
                  <LiveMotionChart 
                    key={`${chartUpdateTrigger}-${sessionSamplesRef.current.length}`} 
                    samples={sessionSamplesRef.current} 
                    sessionStart={sessionStartRef.current} 
                  />
                </div>
              </div>
            </div>
          </div>
        )}

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
            href="/thermal-history"
            className="group relative block rounded-xl border border-cyan-400/30 bg-cyan-500/10 backdrop-blur px-5 py-6 hover:bg-cyan-500/20 transition-all duration-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium mb-2">Session History</h3>
                <p className="text-sm text-gray-300">View past thermal recordings</p>
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

