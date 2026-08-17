export type EvidenceKind = "measured" | "modeled" | "educational";

export type PathologyKind = "amyloid" | "tau" | "both";

export type MagnificationLevel =
  | "whole_brain"
  | "neural_tissue"
  | "amyloid_plaque"
  | "amyloid_fibrils"
  | "molecular";

export type HotspotId = 1 | 2 | 3 | 4 | 5;

export type PathologyHotspot = {
  id: HotspotId;
  /** Local position on the procedural molecular assembly. */
  position: [number, number, number];
  title: string;
  body: string;
  evidence: EvidenceKind;
  ccaLink?: {
    label: string;
    href: string;
  };
};

export const MAGNIFICATION_LEVELS: {
  id: MagnificationLevel;
  label: string;
  hint: string;
}[] = [
  { id: "whole_brain", label: "Whole Brain", hint: "Anatomical context" },
  { id: "neural_tissue", label: "Neural Tissue", hint: "Neurons & extracellular space" },
  { id: "amyloid_plaque", label: "Amyloid Plaque", hint: "Extracellular deposit" },
  { id: "amyloid_fibrils", label: "Amyloid Fibrils", hint: "Aggregated strands" },
  { id: "molecular", label: "Molecular View", hint: "Protein ribbon structure" },
];

export const AMYLOID_HOTSPOTS: PathologyHotspot[] = [
  {
    id: 1,
    position: [0.2, 1.55, 0.7],
    title: "What is it?",
    body: "Amyloid-β is a peptide produced through proteolytic processing of amyloid precursor protein (APP). This is an original educational ribbon reconstruction — not a patient scan.",
    evidence: "educational",
  },
  {
    id: 2,
    position: [-0.2, 0.35, 0.25],
    title: "Link to Alzheimer's disease",
    body: "Certain processing pathways involving amyloid precursor protein can produce amyloid-β peptides. Amyloid-β aggregation is associated with plaque formation in Alzheimer's disease.",
    evidence: "educational",
  },
  {
    id: 3,
    position: [-0.05, -0.35, 0.05],
    title: "Where does it occur?",
    body: "Amyloid plaques accumulate primarily in extracellular spaces between neurons. They are microscopic and are not visible on the outer surface of the intact brain.",
    evidence: "educational",
  },
  {
    id: 4,
    position: [0.55, -1.15, 0.2],
    title: "Why does it matter?",
    body: "Amyloid pathology is associated with changes in neuronal and network function in Alzheimer’s disease. This relationship is multifactorial — CCA does not infer plaque presence from cognition alone.",
    evidence: "educational",
  },
  {
    id: 5,
    position: [1.1, 0.05, -0.3],
    title: "Why this matters to CCA",
    body: "CCA monitors cognitive, speech, mobility, thermal, and biomarker signals. When amyloid PET or fluid biomarkers are available, they appear as MEASURED data. Otherwise, Pathology Explorer provides EDUCATIONAL biological context.",
    evidence: "educational",
    ccaLink: {
      label: "View related CCA data",
      href: "/dashboard/biomedical#brain-region-mapping",
    },
  },
];

export const TAU_HOTSPOTS: PathologyHotspot[] = [
  {
    id: 1,
    position: [0.2, 1.55, 0.7],
    title: "What is it?",
    body: "Tau is a microtubule-associated protein. In Alzheimer’s disease, hyperphosphorylated tau can misfold into paired helical filament–like structures inside neurons.",
    evidence: "educational",
  },
  {
    id: 2,
    position: [-0.2, 0.35, 0.25],
    title: "What happens?",
    body: "Misfolded tau aggregates into neurofibrillary tangles within the neuronal cytoplasm, disrupting cytoskeletal organization and intracellular transport.",
    evidence: "educational",
  },
  {
    id: 3,
    position: [-0.05, -0.35, 0.05],
    title: "Where does it occur?",
    body: "Unlike extracellular amyloid plaques, tau tangles form inside neurons.",
    evidence: "educational",
  },
  {
    id: 4,
    position: [0.55, -1.15, 0.2],
    title: "Why does it matter?",
    body: "Tau burden correlates with clinical progression patterns in many Alzheimer’s frameworks. Network-level cognitive change may accompany tau-related neuronal injury.",
    evidence: "educational",
  },
  {
    id: 5,
    position: [1.1, 0.05, -0.3],
    title: "Why this matters to CCA",
    body: "When p-tau217 / p-tau181 or other validated markers are available, CCA surfaces them as MEASURED biomarker context. Cognitive testing remains a complementary monitoring channel.",
    evidence: "educational",
    ccaLink: {
      label: "View biomarker intelligence",
      href: "/dashboard/biomedical",
    },
  },
];

export function hotspotsForKind(kind: PathologyKind): PathologyHotspot[] {
  if (kind === "tau") return TAU_HOTSPOTS;
  if (kind === "both") {
    return AMYLOID_HOTSPOTS.map((h, i) =>
      i === 2
        ? {
            ...h,
            title: "Amyloid vs Tau location",
            body: "Amyloid plaques form between neurons (extracellular). Tau tangles form inside neurons (intracellular). Both may coexist in Alzheimer’s disease models; CCA distinguishes MEASURED biomarkers from EDUCATIONAL illustrations.",
          }
        : h
    );
  }
  return AMYLOID_HOTSPOTS;
}

export const PATHOLOGY_COPY = {
  title: "Pathology Explorer",
  subtitle: "Explore the biology associated with monitored cognitive changes",
  educationalBadgeNote:
    "Illustrations are educational reconstructions. They are not patient-specific plaque or tangle detections unless labeled MEASURED.",
  fromAnalysisDefault: "Exploring biological context associated with monitored cognitive systems",
} as const;

export function evidenceBadgeClass(kind: EvidenceKind): string {
  if (kind === "measured") return "border-emerald-400/45 bg-emerald-500/15 text-emerald-100";
  if (kind === "modeled") return "border-amber-400/45 bg-amber-500/12 text-amber-100";
  return "border-slate-400/35 bg-slate-500/10 text-slate-200";
}

export function evidenceLabel(kind: EvidenceKind): string {
  if (kind === "measured") return "MEASURED";
  if (kind === "modeled") return "MODELED";
  return "EDUCATIONAL";
}
