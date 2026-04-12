import type { CognitiveSignals } from "@/lib/cognitiveSignals";
import type { BrainRegionId } from "./regionConfig";

export type DeclineStage = "early" | "mid" | "late";

/** Infer stage from fused concern (higher → later-stage emphasis on frontal/parietal/occipital networks). */
export function inferDeclineStageFromTelemetry(
  signals: CognitiveSignals | null | undefined,
  memorySim: number,
  speechSim: number,
  execSim: number
): DeclineStage {
  const cc = signals
    ? Math.min(
        1,
        (1 - signals.memoryStrength) * 0.35 + signals.languageConcern * 0.33 + signals.executiveConcern * 0.32
      )
    : (1 - memorySim) * 0.35 + (1 - speechSim) * 0.3 + (1 - execSim) * 0.35;

  if (cc < 0.37) return "early";
  if (cc < 0.58) return "mid";
  return "late";
}

/**
 * Per-region emphasis by dementia stage (early → medial temporal; mid → language/temporal;
 * late → frontoparietal/occipital/limbic). Multiplier applied to shader intensity.
 */
export const REGION_STAGE_WEIGHT: Record<
  BrainRegionId,
  { early: number; mid: number; late: number }
> = {
  hippocampus_l: { early: 1, mid: 0.88, late: 0.52 },
  hippocampus_r: { early: 1, mid: 0.88, late: 0.52 },
  entorhinal_l: { early: 1, mid: 0.92, late: 0.58 },
  entorhinal_r: { early: 1, mid: 0.92, late: 0.58 },
  mtl_l: { early: 0.82, mid: 1, late: 0.78 },
  mtl_r: { early: 0.82, mid: 1, late: 0.78 },
  broca: { early: 0.48, mid: 1, late: 0.92 },
  wernicke: { early: 0.48, mid: 1, late: 0.92 },
  prefrontal: { early: 0.42, mid: 0.78, late: 1 },
  parietal: { early: 0.38, mid: 0.72, late: 1 },
  occipital: { early: 0.32, mid: 0.62, late: 0.98 },
  amygdala_l: { early: 0.52, mid: 0.88, late: 1 },
  amygdala_r: { early: 0.52, mid: 0.88, late: 1 },
  pcc: { early: 0.92, mid: 0.88, late: 0.72 },
};

export function stageHighlightFactor(id: BrainRegionId, stage: DeclineStage): number {
  const w = REGION_STAGE_WEIGHT[id];
  if (!w) return 1;
  const raw = stage === "early" ? w.early : stage === "mid" ? w.mid : w.late;
  return 0.68 + raw * 0.44;
}
