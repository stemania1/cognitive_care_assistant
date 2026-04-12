import type { BrainRegionId } from "./regionConfig";

/** In-app module tied to each region (hover tooltip + clinical routing). */
export function regionSupportModule(id: BrainRegionId): string {
  switch (id) {
    case "hippocampus_l":
    case "hippocampus_r":
    case "entorhinal_l":
    case "entorhinal_r":
    case "pcc":
      return "Memory Games";
    case "mtl_l":
    case "mtl_r":
      return "Memory + Language";
    case "broca":
    case "wernicke":
      return "Speech & Language";
    case "prefrontal":
    case "parietal":
    case "occipital":
      return "Cognitive Tests";
    case "amygdala_l":
    case "amygdala_r":
      return "Daily Checks";
    default:
      return "Daily Checks";
  }
}
