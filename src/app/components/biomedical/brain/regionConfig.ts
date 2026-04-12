import type { Vector3Tuple } from "three";

/** Bundled anatomical mesh (Science Museum / Sketchfab derivative via MediaWiki3D — verify license for your deployment). */
export const BRAIN_ASSET_URL = "/models/cerebrum.glb";

/**
 * Euler XYZ (radians): upright cerebrum, frontal–oblique view (slight front/side).
 * Y ~0.28 rad ≈16°: hemispheres read level, inferior structures toward bottom of frame.
 */
export const BRAIN_SCENE_ROTATION: Vector3Tuple = [-Math.PI / 2, 0.28, 0];

/** Vertical balance in viewport (center of mass vs. frame). */
export const BRAIN_GROUP_POSITION: Vector3Tuple = [0, -0.04, 0];

/** Larger on-screen presence (~60–70% apparent fill vs. prior). */
export const BRAIN_SCENE_SCALE = 1.18;

export type CognitiveDomain = "idle" | "memory" | "speech" | "cognitive";

/**
 * Dementia-relevant anchors only (not a full atlas).
 * Positions are normalized “unit brain” approximations for emission weighting.
 */
export type BrainRegionId =
  | "hippocampus_l"
  | "hippocampus_r"
  | "entorhinal_l"
  | "entorhinal_r"
  | "mtl_l"
  | "mtl_r"
  | "broca"
  | "wernicke"
  | "prefrontal"
  | "parietal"
  | "occipital"
  | "amygdala_l"
  | "amygdala_r"
  | "pcc";

export type BrainRegionMeta = {
  id: BrainRegionId;
  position: Vector3Tuple;
  radius: number;
  label: string;
  short: string;
  /** 3–5 words for hover tooltip (function line). */
  tooltipRole: string;
  /** Plain-language role for clinical panel copy. */
  functionDescription: string;
  domains: CognitiveDomain[];
};

export const BRAIN_REGIONS: BrainRegionMeta[] = [
  {
    id: "hippocampus_l",
    position: [0.38, -0.12, 0.14],
    radius: 0.1,
    label: "Hippocampus (L)",
    short: "Episodic memory · encoding",
    tooltipRole: "Memory formation",
    functionDescription: "Memory formation, consolidation, and recall of new information.",
    domains: ["memory"],
  },
  {
    id: "hippocampus_r",
    position: [-0.38, -0.12, 0.14],
    radius: 0.1,
    label: "Hippocampus (R)",
    short: "Memory retrieval",
    tooltipRole: "Memory retrieval",
    functionDescription: "Supports retrieval and integration of stored memories with context.",
    domains: ["memory"],
  },
  {
    id: "entorhinal_l",
    position: [0.35, -0.17, 0.1],
    radius: 0.07,
    label: "Entorhinal cortex (L)",
    short: "Entorhinal relay · memory",
    tooltipRole: "Memory routing",
    functionDescription: "Gateway between neocortex and hippocampus for memory encoding.",
    domains: ["memory"],
  },
  {
    id: "entorhinal_r",
    position: [-0.35, -0.17, 0.1],
    radius: 0.07,
    label: "Entorhinal cortex (R)",
    short: "Entorhinal relay · memory",
    tooltipRole: "Memory routing",
    functionDescription: "Gateway between neocortex and hippocampus for memory encoding.",
    domains: ["memory"],
  },
  {
    id: "mtl_l",
    position: [0.3, -0.2, 0.18],
    radius: 0.11,
    label: "Medial temporal lobe (L)",
    short: "Declarative memory hub",
    tooltipRole: "Declarative memory",
    functionDescription: "Medial temporal structures supporting declarative learning and recall.",
    domains: ["memory", "speech"],
  },
  {
    id: "mtl_r",
    position: [-0.3, -0.2, 0.18],
    radius: 0.11,
    label: "Medial temporal lobe (R)",
    short: "Declarative memory hub",
    tooltipRole: "Declarative memory",
    functionDescription: "Medial temporal structures supporting declarative learning and recall.",
    domains: ["memory", "speech"],
  },
  {
    id: "broca",
    position: [0.44, 0.18, 0.22],
    radius: 0.08,
    label: "Broca’s area",
    short: "Speech production",
    tooltipRole: "Speech production",
    functionDescription: "Motor planning and production of fluent speech.",
    domains: ["speech"],
  },
  {
    id: "wernicke",
    position: [0.42, 0.02, -0.08],
    radius: 0.09,
    label: "Wernicke’s area",
    short: "Language comprehension",
    tooltipRole: "Language comprehension",
    functionDescription: "Understanding spoken and written language and linking meaning to words.",
    domains: ["speech"],
  },
  {
    id: "prefrontal",
    position: [0.06, 0.38, 0.12],
    radius: 0.2,
    label: "Prefrontal cortex",
    short: "Executive · attention",
    tooltipRole: "Decision making",
    functionDescription: "Executive control: attention, planning, working memory, and cognitive flexibility.",
    domains: ["cognitive"],
  },
  {
    id: "parietal",
    position: [0.05, 0.12, 0.42],
    radius: 0.18,
    label: "Parietal lobe",
    short: "Sensory · spatial",
    tooltipRole: "Spatial attention",
    functionDescription: "Sensory integration, spatial attention, and praxis-related networks.",
    domains: ["cognitive"],
  },
  {
    id: "occipital",
    position: [0.02, -0.06, -0.46],
    radius: 0.16,
    label: "Occipital lobe",
    short: "Visual processing",
    tooltipRole: "Visual processing",
    functionDescription: "Primary and associative visual cortex for perception and recognition.",
    domains: ["cognitive"],
  },
  {
    id: "amygdala_l",
    position: [0.42, -0.08, 0.1],
    radius: 0.06,
    label: "Amygdala (L)",
    short: "Emotion · salience",
    tooltipRole: "Emotion regulation",
    functionDescription: "Emotional salience, fear processing, and behavioral response modulation.",
    domains: ["cognitive"],
  },
  {
    id: "amygdala_r",
    position: [-0.42, -0.08, 0.1],
    radius: 0.06,
    label: "Amygdala (R)",
    short: "Emotion · salience",
    tooltipRole: "Emotion regulation",
    functionDescription: "Emotional salience, fear processing, and behavioral response modulation.",
    domains: ["cognitive"],
  },
  {
    id: "pcc",
    position: [0.02, -0.06, -0.22],
    radius: 0.09,
    label: "Posterior cingulate",
    short: "Default network hub",
    tooltipRole: "Self-referential thought",
    functionDescription: "Posterior cingulate / precuneus hub for default-mode and memory-related integration.",
    domains: ["memory", "cognitive"],
  },
];

/** Regions emphasized when a mapping tab is selected (Monitor uses full blend). */
export function primaryRegionsForDomain(domain: CognitiveDomain): BrainRegionId[] | null {
  if (domain === "idle") return null;
  if (domain === "memory") {
    return [
      "hippocampus_l",
      "hippocampus_r",
      "entorhinal_l",
      "entorhinal_r",
      "mtl_l",
      "mtl_r",
      "pcc",
    ];
  }
  if (domain === "speech") {
    return ["broca", "wernicke", "mtl_l", "mtl_r"];
  }
  if (domain === "cognitive") {
    return ["prefrontal", "parietal", "occipital", "amygdala_l", "amygdala_r", "pcc"];
  }
  return null;
}

export function activityToHeatColor(t: number): string {
  const x = Math.min(1, Math.max(0, t));
  const cold = { r: 0.15, g: 0.45, b: 0.95 };
  const hot = { r: 0.95, g: 0.2, b: 0.18 };
  const r = cold.r + (hot.r - cold.r) * x;
  const g = cold.g + (hot.g - cold.g) * x;
  const b = cold.b + (hot.b - cold.b) * x;
  return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
}
