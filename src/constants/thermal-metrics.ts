import { ThermalMetric } from '@/types/thermal';

export const THERMAL_METRICS: ThermalMetric[] = [
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

