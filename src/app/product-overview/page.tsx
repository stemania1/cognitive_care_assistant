import type { Metadata } from "next";
import ProductOverviewPageClient from "./ProductOverviewPageClient";

export const metadata: Metadata = {
  title: "Cognitive Care Assistant · View Sensor Models",
  description:
    "Interactive 3D sensor models: MyoWare 2.0 wristband and Raspberry Pi + AMG8833 enclosure for Cognitive Care Assistant.",
};

export default function ProductOverviewPage() {
  return <ProductOverviewPageClient />;
}
