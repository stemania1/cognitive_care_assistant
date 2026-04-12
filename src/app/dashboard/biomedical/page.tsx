import type { Metadata } from "next";
import { BiomedicalDashboardClient } from "@/app/components/biomedical/BiomedicalDashboardClient";

export const metadata: Metadata = {
  title: "Cognitive Care Assistant · Neurocognitive monitoring",
  description:
    "Neurocognitive monitoring interface: anatomical 3D brain mapping, multimodal telemetry (simulated when offline). Demonstration only — not a medical device.",
};

export default function BiomedicalPage() {
  return <BiomedicalDashboardClient />;
}
