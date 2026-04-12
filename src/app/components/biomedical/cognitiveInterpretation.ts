import type { CognitiveSignals } from "@/lib/cognitiveSignals";
import {
  BRAIN_REGIONS,
  primaryRegionsForDomain,
  type BrainRegionId,
  type CognitiveDomain,
} from "./brain/regionConfig";

export type TrendLabel = "Improving" | "Stable" | "Declining";
export type RiskTier = "Low" | "Moderate" | "Elevated";
/** Aligns with emission key: cool → mild, amber → moderate, warm → elevated concern. */
export type SeverityTier = "Mild" | "Moderate" | "Elevated";

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

/** Blue (mild) → amber (moderate) → red (elevated) — tuned for on-tissue emission. */
export function clinicalConcernRgb(concern: number): string {
  const c = Math.min(1, Math.max(0, concern));
  if (c < 0.34) {
    const t = c / 0.34;
    const r = Math.round(45 + t * 55);
    const g = Math.round(118 + t * 58);
    const b = Math.round(208 + t * 32);
    return `rgb(${r},${g},${b})`;
  }
  if (c < 0.67) {
    const t = (c - 0.34) / 0.33;
    const r = Math.round(185 + t * 58);
    const g = Math.round(152 - t * 28);
    const b = Math.round(78 + t * 38);
    return `rgb(${r},${g},${b})`;
  }
  const t = (c - 0.67) / 0.33;
  const r = Math.round(228 + t * 27);
  const g = Math.round(88 - t * 38);
  const b = Math.round(78 - t * 22);
  return `rgb(${r},${g},${b})`;
}

export function concernToSeverity(c: number): SeverityTier {
  if (c < 0.34) return "Mild";
  if (c < 0.67) return "Moderate";
  return "Elevated";
}

function isMemorySystem(id: BrainRegionId): boolean {
  return (
    id === "hippocampus_l" ||
    id === "hippocampus_r" ||
    id === "entorhinal_l" ||
    id === "entorhinal_r" ||
    id === "mtl_l" ||
    id === "mtl_r" ||
    id === "pcc"
  );
}

function isLanguage(id: BrainRegionId): boolean {
  return id === "broca" || id === "wernicke";
}

function isExecutiveCortex(id: BrainRegionId): boolean {
  return id === "prefrontal" || id === "parietal" || id === "occipital";
}

function isAmygdala(id: BrainRegionId): boolean {
  return id === "amygdala_l" || id === "amygdala_r";
}

export function regionConcern(id: BrainRegionId, signals: CognitiveSignals | null): number {
  if (!signals) {
    if (isMemorySystem(id) || isLanguage(id) || isExecutiveCortex(id) || isAmygdala(id)) return 0.38;
    return 0.3;
  }
  if (isMemorySystem(id)) {
    return clamp01(1 - signals.memoryStrength);
  }
  if (isLanguage(id)) {
    return signals.languageConcern;
  }
  if (isExecutiveCortex(id)) {
    if (id === "occipital") {
      return clamp01(0.88 * signals.executiveConcern + 0.12 * (1 - signals.memoryStrength));
    }
    return signals.executiveConcern;
  }
  if (isAmygdala(id)) {
    return clamp01(0.55 * signals.languageConcern + 0.45 * signals.executiveConcern);
  }
  return 0.28;
}

/**
 * Unified concern for visualization + copy: uses app signals when present,
 * otherwise derives weakness from simulator channels (inverse of “strength” metrics).
 */
export function regionConcernResolved(
  id: BrainRegionId,
  signals: CognitiveSignals | null | undefined,
  memorySim: number,
  speechSim: number,
  execSim: number
): number {
  if (signals) return regionConcern(id, signals);
  if (isMemorySystem(id)) return clamp01(1 - memorySim);
  if (isLanguage(id)) return clamp01(1 - speechSim);
  if (isExecutiveCortex(id)) {
    if (id === "occipital") {
      return clamp01(0.88 * (1 - execSim) + 0.12 * (1 - memorySim));
    }
    return clamp01(1 - execSim);
  }
  if (isAmygdala(id)) {
    return clamp01(0.55 * (1 - speechSim) + 0.45 * (1 - execSim));
  }
  return 0.32;
}

function compositeConcern(signals: CognitiveSignals | null): number {
  if (!signals) return 0.42;
  return Math.min(
    1,
    (1 - signals.memoryStrength) * 0.35 + signals.languageConcern * 0.33 + signals.executiveConcern * 0.32
  );
}

export function computeClinicalMetrics(
  signals: CognitiveSignals | null,
  memorySim: number,
  speechSim: number,
  execSim: number
): {
  modelConfidence: number;
  trend: TrendLabel;
  riskLevel: RiskTier;
  predictiveInsight: string;
} {
  const cc = signals
    ? compositeConcern(signals)
    : (1 - memorySim) * 0.35 + (1 - speechSim) * 0.3 + (1 - execSim) * 0.35;

  const dataDensity =
    signals && (signals.hasMemoryStats || signals.hasDailyAnswers)
      ? (signals.hasMemoryStats ? 0.25 : 0) + (signals.hasDailyAnswers ? 0.25 : 0) + 0.35
      : 0.45;
  const modelConfidence = Math.round(Math.min(94, Math.max(61, 62 + dataDensity * 28 + (1 - Math.abs(0.52 - cc)) * 12)));

  let trend: TrendLabel = "Stable";
  if (signals) {
    if (signals.memoryStrength > 0.62 && signals.executiveConcern < 0.42 && signals.languageConcern < 0.45) {
      trend = "Improving";
    } else if (signals.memoryStrength < 0.42 || signals.executiveConcern > 0.62 || signals.languageConcern > 0.58) {
      trend = "Declining";
    }
  }

  let riskLevel: RiskTier = "Low";
  if (cc > 0.58) riskLevel = "Elevated";
  else if (cc > 0.38) riskLevel = "Moderate";

  let predictiveInsight: string;
  if (trend === "Improving" && riskLevel === "Low") {
    predictiveInsight =
      "Predicted cognitive risk (24–48h): Low ↔ — short-horizon trajectory favorable vs. blended baseline.";
  } else if (riskLevel === "Elevated") {
    predictiveInsight =
      "Predicted cognitive risk (24–48h): Elevated ↑ — sustained cross-domain deviation vs. blended baseline.";
  } else if (riskLevel === "Moderate") {
    predictiveInsight =
      "Predicted cognitive risk (24–48h): Moderate ↑ — early-stage variability; extend capture window.";
  } else {
    predictiveInsight =
      "Predicted cognitive risk (24–48h): Low — trajectories within expected monitoring band.";
  }

  return { modelConfidence, trend, riskLevel, predictiveInsight };
}

export type RegionInsight = {
  id: BrainRegionId;
  regionName: string;
  regionFunction: string;
  detectedWeakness: string;
  whatThisMayMean: string;
  triggerSource: string;
  severity: SeverityTier;
  concern: number;
  concernColorRgb: string;
};

function triggerLabelForRegion(
  id: BrainRegionId,
  signals: CognitiveSignals | null,
  domain: CognitiveDomain,
  memorySim: number,
  speechSim: number,
  execSim: number
): string {
  if (
    id === "hippocampus_l" ||
    id === "hippocampus_r" ||
    id === "entorhinal_l" ||
    id === "entorhinal_r" ||
    id === "mtl_l" ||
    id === "mtl_r" ||
    id === "pcc"
  ) {
    if (signals?.hasMemoryStats) return "Memory Games module";
    return `Memory Games module · simulator fill (${(memorySim * 100).toFixed(0)}% strength est.)`;
  }
  if (id === "broca" || id === "wernicke") {
    if (signals?.hasDailyAnswers) return "Speech & Language module (daily questions)";
    return `Speech & Language module · simulator fill (${(speechClarityPct(speechSim))})`;
  }
  if (id === "prefrontal" || id === "parietal" || id === "occipital") {
    if (signals?.hasDailyAnswers || signals?.hasMemoryStats) return "Cognitive tests & cross-module fusion (assessments + daily responses)";
    if (domain === "cognitive") return "Cognitive tests · executive mapping tab";
    return `Executive channel · simulator (${(execSim * 100).toFixed(0)}% est.)`;
  }
  if (id === "amygdala_l" || id === "amygdala_r") {
    return signals?.hasDailyAnswers
      ? "Daily Checks · mood/behavior heuristics from responses"
      : `Daily Checks · blended simulator (${(execSim * 100).toFixed(0)}% est.)`;
  }
  return "Blended telemetry";
}

function speechClarityPct(speechSim: number): string {
  return `${(speechSim * 100).toFixed(0)}% clarity est.`;
}

function weaknessCopy(
  id: BrainRegionId,
  sev: SeverityTier,
  signals: CognitiveSignals | null
): { detected: string; meaning: string } {
  const isMem =
    id === "hippocampus_l" ||
    id === "hippocampus_r" ||
    id === "entorhinal_l" ||
    id === "entorhinal_r" ||
    id === "mtl_l" ||
    id === "mtl_r" ||
    id === "pcc";
  const isLang = id === "broca" || id === "wernicke";
  const isExec = id === "prefrontal" || id === "parietal" || id === "occipital";
  const isAmyg = id === "amygdala_l" || id === "amygdala_r";

  if (isMem) {
    if (sev === "Mild") {
      return {
        detected: "In-app metrics suggest a modest shift in recall efficiency versus recent activity.",
        meaning:
          "May indicate a possible mild change in memory-related processing; not a diagnosis — track trends over time.",
      };
    }
    if (sev === "Moderate") {
      return {
        detected: signals?.hasMemoryStats
          ? "Memory-game timing and error patterns suggest reduced pattern retention versus your baseline."
          : "Simulator-weighted memory channel shows moderate deviation consistent with slower recall emphasis.",
        meaning:
          "May suggest short-term memory or encoding variability worth monitoring alongside daily function — discuss persistent changes with a clinician.",
      };
    }
    return {
      detected: signals?.hasMemoryStats
        ? "Stronger deviation in memory-game performance is driving medial temporal emphasis in this view."
        : "Elevated emphasis on medial temporal mapping from the blended model (limited live memory data).",
      meaning:
        "May suggest more pronounced memory-related strain on this heuristic map — use as a monitoring cue only; clinical evaluation is required for any concern.",
    };
  }

  if (isLang) {
    if (sev === "Mild") {
      return {
        detected:
          id === "broca"
            ? "Response timing hints at mildly slowed verbal formulation in free-text activity."
            : "Language-processing heuristics show mild variability in comprehension-related engagement.",
        meaning:
          "May indicate possible mild expressive or receptive inefficiency in app tasks — not a speech diagnosis.",
      };
    }
    if (sev === "Moderate") {
      return {
        detected:
          id === "broca"
            ? "Delayed verbal response formation appears in daily-question patterns (length/latency heuristics)."
            : "Semantic integration signals show moderate variability versus baseline text responses.",
        meaning:
          "May suggest slowed speech production or reduced verbal comprehension efficiency in this context — formal language assessment differs.",
      };
    }
    return {
      detected:
        id === "broca"
          ? "Stronger expressive-language load on the map — short answers or high latency clusters in recent items."
          : "Receptive-language weighting is elevated from blended daily-response analytics.",
      meaning:
        "May suggest meaningful language-processing variability on this interface; clinical speech-language evaluation addresses real symptoms.",
    };
  }

  if (isExec) {
    if (sev === "Mild") {
      return {
        detected:
          id === "occipital"
            ? "Visual-association load shows mild variability versus cross-module baselines."
            : "Frontoparietal fusion shows mild executive concern from cross-module heuristics.",
        meaning:
          "May indicate possible mild difficulty with attention, planning, or cognitive speed in app tasks.",
      };
    }
    if (sev === "Moderate") {
      return {
        detected:
          id === "occipital"
            ? "Visual processing heuristics show moderate deviation alongside executive blend."
            : "Executive indices (memory + daily responses) indicate moderate control-network emphasis.",
        meaning:
          "May suggest variability in executive function signals — associated with attention and planning in everyday tasks when sustained.",
      };
    }
    return {
      detected:
        id === "occipital"
          ? "Stronger occipital-parietal emphasis in this snapshot — monitoring context only."
          : "Strong executive-network emphasis — multiple modules align on higher concern in this snapshot.",
      meaning:
        "May suggest more pronounced executive-function strain on this map; not ADHD or dementia diagnosis — clinical context matters.",
    };
  }

  if (isAmyg) {
    if (sev === "Mild") {
      return {
        detected: "Limbic salience shows mild variability versus blended behavioral heuristics.",
        meaning: "May indicate possible mild emotional or behavioral variability in app engagement — not a psychiatric diagnosis.",
      };
    }
    if (sev === "Moderate") {
      return {
        detected: "Amygdala-weighted mapping shows moderate deviation from routine monitoring band.",
        meaning: "May suggest more noticeable mood or reactivity signals in this interface — clinical follow-up addresses real symptoms.",
      };
    }
    return {
      detected: "Stronger limbic emphasis in this fused view — use as a monitoring cue only.",
      meaning: "May suggest pronounced behavioral salience on this map; not a substitute for clinical evaluation.",
    };
  }

  return {
    detected: "Regional load deviates from the blended reference in this voxel-weighted view.",
    meaning: "Interpret as monitoring context only.",
  };
}

function regionsInScope(domain: CognitiveDomain): BrainRegionId[] {
  const prim = primaryRegionsForDomain(domain);
  if (prim === null) return BRAIN_REGIONS.map((r) => r.id);
  return prim;
}

export function buildRegionInsights(
  domain: CognitiveDomain,
  focusedRegionId: BrainRegionId | null,
  signals: CognitiveSignals | null,
  memorySim: number,
  speechSim: number,
  execSim: number
): RegionInsight[] {
  const ids = regionsInScope(domain);
  const ordered =
    focusedRegionId && ids.includes(focusedRegionId)
      ? [focusedRegionId, ...ids.filter((x) => x !== focusedRegionId)]
      : [...ids];

  return ordered.map((id) => {
    const meta = BRAIN_REGIONS.find((r) => r.id === id)!;
    const concern = regionConcernResolved(id, signals, memorySim, speechSim, execSim);
    const sev = concernToSeverity(concern);
    const { detected, meaning } = weaknessCopy(id, sev, signals);
    return {
      id,
      regionName: meta.label,
      regionFunction: meta.functionDescription,
      detectedWeakness: detected,
      whatThisMayMean: meaning,
      triggerSource: triggerLabelForRegion(id, signals, domain, memorySim, speechSim, execSim),
      severity: sev,
      concern,
      concernColorRgb: clinicalConcernRgb(concern),
    };
  });
}

function buildWhatThisMeans(
  domain: CognitiveDomain,
  signals: CognitiveSignals | null,
  insights: RegionInsight[]
): string {
  const top = [...insights].sort((a, b) => b.concern - a.concern)[0];
  if (!top) {
    return "No regional emphasis is available in this snapshot — capture memory, language, or assessment activity to refine mapping.";
  }

  if (domain === "memory") {
    return top.concern >= 0.34
      ? "Strongest signal in memory pathways (recall/retention). Not a diagnosis — track over time."
      : "Memory mapping is mild on this snapshot; keep using in-app tasks.";
  }
  if (domain === "speech") {
    return top.concern >= 0.34
      ? "Language variability may reflect expressive or receptive load in app responses — not formal speech testing."
      : "Language networks look relatively balanced here.";
  }
  if (domain === "cognitive") {
    return top.concern >= 0.34
      ? "Executive-style load from cross-module activity — attention/planning/speed (heuristic only)."
      : "Executive networks look stable in this fused view.";
  }
  return `${top.regionName} shows the highest concern (${top.severity.toLowerCase()}) in this multimodal blend.`;
}

export type ClinicalPanelSections = {
  activeRegionMappingTitle: string;
  regionInsights: RegionInsight[];
  whatThisMeans: string;
  /** Short merged narrative for the Interpretation card. */
  interpretationSummary: string;
  functionalInterpretation: string;
  cognitiveCorrelation: string;
  riskSignals: string;
  systemNotes: string;
  modelConfidence: number;
  trend: TrendLabel;
  riskLevel: RiskTier;
  predictiveInsight: string;
};

export function activeMappingLabel(domain: CognitiveDomain): string {
  switch (domain) {
    case "idle":
      return "Active mapping: Multimodal cognitive blend";
    case "memory":
      return "Active mapping: Memory systems · medial temporal";
    case "speech":
      return "Active mapping: Speech & language · left perisylvian";
    case "cognitive":
      return "Active mapping: Executive function · frontoparietal";
    default:
      return "Active mapping";
  }
}

export function buildClinicalPanelSections(
  domain: CognitiveDomain,
  focusedRegionId: BrainRegionId | null,
  signals: CognitiveSignals | null,
  memoryPerformanceSim: number,
  speechClaritySim: number,
  executiveSim: number
): ClinicalPanelSections {
  const metrics = computeClinicalMetrics(signals, memoryPerformanceSim, speechClaritySim, executiveSim);
  const systemNotes = "Demo interface · not a medical device.";

  const regionInsights = buildRegionInsights(
    domain,
    focusedRegionId,
    signals,
    memoryPerformanceSim,
    speechClaritySim,
    executiveSim
  );
  const whatThisMeans = buildWhatThisMeans(domain, signals, regionInsights);

  let activeRegionMappingTitle: string;
  if (domain === "idle") {
    activeRegionMappingTitle = "Active region mapping · blended surveillance";
  } else if (domain === "memory") {
    activeRegionMappingTitle = "Active region mapping · medial temporal (memory)";
  } else if (domain === "speech") {
    activeRegionMappingTitle = "Active region mapping · perisylvian language network";
  } else {
    activeRegionMappingTitle = "Active region mapping · frontoparietal executive network";
  }

  let functionalInterpretation: string;
  let cognitiveCorrelation: string;
  let riskSignals: string;

  if (!signals) {
    functionalInterpretation =
      "Awaiting richer app-side signals — regional colors reflect simulator-weighted weakness estimates blended with anatomical priors.";
    cognitiveCorrelation =
      "Connect hardware: play Memory Games, complete daily questions, and use assessments so this panel replaces simulator fill with live fusion.";
    riskSignals = "Stratification uses simulated channels until memory / daily-question telemetry populates.";
  } else {
    const mem = signals.memoryStrength;
    const lang = signals.languageConcern;
    const ex = signals.executiveConcern;

    functionalInterpretation =
      "Each highlighted zone pairs voxel-weighted emission on the mesh with domain-specific concern indices from your recent in-app behavior.";

    cognitiveCorrelation =
      signals.hasMemoryStats || signals.hasDailyAnswers
        ? `Fusion inputs — memory strength ${(mem * 100).toFixed(0)}%, language concern ${(lang * 100).toFixed(0)}%, executive concern ${(ex * 100).toFixed(0)}%. Weakness drives cooler→warmer emission on affected anatomy.`
        : `Partial ingest — memory ${signals.hasMemoryStats ? `${(mem * 100).toFixed(0)}%` : "sim"}, language ${signals.hasDailyAnswers ? `${(lang * 100).toFixed(0)}%` : "sim"}, executive blend ${(ex * 100).toFixed(0)}%.`;

    riskSignals =
      compositeConcern(signals) > 0.52
        ? "Composite concern is elevated versus the blended reference — prioritize consistent module use for clearer trajectories."
        : "Composite indices remain within a routine monitoring band for this ingest window.";
  }

  let interpretationSummary: string;
  if (!signals) {
    interpretationSummary =
      "Simulator priors only. Use Memory Games, daily questions, and assessments for patient-specific fusion.";
  } else {
    const mem = signals.memoryStrength;
    const lang = signals.languageConcern;
    const ex = signals.executiveConcern;
    const cc = compositeConcern(signals);
    interpretationSummary =
      cc > 0.52
        ? `Fused indices: memory ${(mem * 100).toFixed(0)}%, language concern ${(lang * 100).toFixed(0)}%, executive ${(ex * 100).toFixed(0)}%. Composite load is elevated vs. baseline.`
        : `Fused indices: memory ${(mem * 100).toFixed(0)}%, language concern ${(lang * 100).toFixed(0)}%, executive ${(ex * 100).toFixed(0)}%. Composite load is within the monitoring band.`;
  }

  return {
    activeRegionMappingTitle,
    regionInsights,
    whatThisMeans,
    interpretationSummary,
    functionalInterpretation,
    cognitiveCorrelation,
    riskSignals,
    systemNotes,
    ...metrics,
  };
}

export function weaknessToRgb(concern: number): string {
  return clinicalConcernRgb(concern);
}
