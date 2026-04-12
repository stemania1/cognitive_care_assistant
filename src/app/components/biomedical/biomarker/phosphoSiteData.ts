export type PhosphoSiteId = "ptau217" | "ptau181" | "thr231" | "ser202" | "ser396";

export type PhosphoTier = "low" | "moderate" | "high";

export type PhosphoSiteMeta = {
  id: PhosphoSiteId;
  /** Normalized position along backbone curve (0–1). */
  curveT: number;
  biomarkerLabel: string;
  brainRegion: string;
  coreFunction: string;
  clinicalMeaning: string;
  /** Intrinsic emphasis for elevated / progression visualization (not a patient diagnosis). */
  tier: PhosphoTier;
  /** Shorter line for hover tooltip (function). */
  hoverFunction: string;
  /** Concise clinical note for hover (not diagnostic). */
  hoverClinicalNote: string;
  /**
   * Activation priority when progression unlocks more sites (lower = appears earlier in elevated states).
   */
  activationPriority: number;
  /** Normalized focal position on the minimal brain glyph (0–1). */
  brainGlyph: { nx: number; ny: number };
};

export const PHOSPHO_SITES: PhosphoSiteMeta[] = [
  {
    id: "ptau181",
    curveT: 0.26,
    biomarkerLabel: "p-tau181",
    brainRegion: "Inferior temporal cortex",
    coreFunction: "Microtubule-associated stabilization",
    clinicalMeaning:
      "Elevated levels may correlate with tau-related change and may support further clinical evaluation.",
    tier: "moderate",
    hoverFunction: "Microtubule stabilization",
    hoverClinicalNote: "Tau phosphorylation burden signal",
    activationPriority: 2,
    brainGlyph: { nx: 0.38, ny: 0.55 },
  },
  {
    id: "ptau217",
    curveT: 0.44,
    biomarkerLabel: "p-tau217",
    brainRegion: "Hippocampus",
    coreFunction: "Memory formation",
    clinicalMeaning:
      "Elevated levels may correlate with early Alzheimer’s-related neurodegeneration patterns.",
    tier: "high",
    hoverFunction: "Memory encoding",
    hoverClinicalNote: "Early elevation marker (research context)",
    activationPriority: 1,
    brainGlyph: { nx: 0.5, ny: 0.62 },
  },
  {
    id: "thr231",
    curveT: 0.56,
    biomarkerLabel: "Thr231",
    brainRegion: "Entorhinal cortex",
    coreFunction: "Synaptic trafficking modulation",
    clinicalMeaning:
      "Phosphorylation at this epitope may correlate with disease-stage dynamics and warrants contextual review.",
    tier: "moderate",
    hoverFunction: "Synaptic trafficking",
    hoverClinicalNote: "Stage-associated epitope change",
    activationPriority: 3,
    brainGlyph: { nx: 0.52, ny: 0.48 },
  },
  {
    id: "ser202",
    curveT: 0.68,
    biomarkerLabel: "Ser202",
    brainRegion: "Posterior cingulate",
    coreFunction: "Network integration / attention",
    clinicalMeaning:
      "Signal change may correlate with network-level stress; interpretation should be multimodal.",
    tier: "low",
    hoverFunction: "Network integration",
    hoverClinicalNote: "Network-level phosphorylation signal",
    activationPriority: 5,
    brainGlyph: { nx: 0.48, ny: 0.38 },
  },
  {
    id: "ser396",
    curveT: 0.82,
    biomarkerLabel: "Ser396",
    brainRegion: "Lateral temporal",
    coreFunction: "Cytoskeletal regulation",
    clinicalMeaning:
      "Increased phosphorylation suggests elevated proteostatic burden; not specific to a single etiology.",
    tier: "high",
    hoverFunction: "Cytoskeletal regulation",
    hoverClinicalNote: "Proteostasis-related epitope burden",
    activationPriority: 4,
    brainGlyph: { nx: 0.35, ny: 0.52 },
  },
];

export function siteById(id: PhosphoSiteId): PhosphoSiteMeta {
  const s = PHOSPHO_SITES.find((x) => x.id === id);
  if (!s) throw new Error(`Unknown site ${id}`);
  return s;
}

/** Sites that receive pointer events and render in the current presentation. */
export function sitesActiveForPresentation(
  mode: "healthy" | "elevated",
  progression: number
): Set<PhosphoSiteId> {
  const sorted = [...PHOSPHO_SITES].sort((a, b) => a.activationPriority - b.activationPriority);
  const active = new Set<PhosphoSiteId>();
  if (mode === "healthy") {
    active.add(sorted[0].id);
    if (progression > 0.34) active.add(sorted[1].id);
    return active;
  }
  const n = Math.min(5, 2 + Math.round(progression * 3));
  for (let i = 0; i < n; i++) active.add(sorted[i].id);
  return active;
}

/**
 * 0 = baseline blue epitope; 1 = strong red-shifted signal. Driven by mode, progression, and site tier.
 */
export function siteAbnormalityScalar(
  mode: "healthy" | "elevated",
  progression: number,
  tier: PhosphoTier
): number {
  const tierK = tier === "high" ? 1 : tier === "moderate" ? 0.55 : 0.22;
  if (mode === "healthy") return Math.min(0.35, 0.06 + progression * 0.15) * tierK;
  return Math.min(1, (0.25 + progression * 0.75) * (0.45 + tierK * 0.55));
}
