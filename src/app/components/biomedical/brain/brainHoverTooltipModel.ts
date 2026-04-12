import type { CognitiveSignals } from "@/lib/cognitiveSignals";
import { concernToSeverity, regionConcernResolved } from "../cognitiveInterpretation";
import { BRAIN_REGIONS, type BrainRegionId } from "./regionConfig";
import { regionSupportModule } from "./brainRegionSupport";

/** Minimum concern to treat a voxel hit as a weakened dementia-relevant region. */
export const WEAK_REGION_CONCERN_MIN = 0.1;

export function isRegionWeakened(
  id: BrainRegionId,
  signals: CognitiveSignals | null | undefined,
  memorySim: number,
  speechSim: number,
  execSim: number
): boolean {
  return regionConcernResolved(id, signals ?? null, memorySim, speechSim, execSim) >= WEAK_REGION_CONCERN_MIN;
}

function compactLabel(label: string): string {
  return label.replace(" (L)", " · L").replace(" (R)", " · R");
}

export type BrainTooltipModel = {
  regionName: string;
  severityLine: string;
  roleLine: string;
  supportLine: string;
};

export function buildBrainTooltipModel(
  id: BrainRegionId,
  signals: CognitiveSignals | null | undefined,
  memorySim: number,
  speechSim: number,
  execSim: number
): BrainTooltipModel | null {
  const meta = BRAIN_REGIONS.find((r) => r.id === id);
  if (!meta) return null;
  const c = regionConcernResolved(id, signals ?? null, memorySim, speechSim, execSim);
  if (c < WEAK_REGION_CONCERN_MIN) return null;
  const tier = concernToSeverity(c);
  return {
    regionName: compactLabel(meta.label),
    severityLine: `Severity: ${tier}`,
    roleLine: meta.tooltipRole,
    supportLine: `Support: ${regionSupportModule(id)}`,
  };
}
