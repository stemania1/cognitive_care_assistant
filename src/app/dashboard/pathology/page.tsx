import type { Metadata } from "next";
import { PathologyExplorerClient } from "@/app/components/pathology/PathologyExplorerClient";

export const metadata: Metadata = {
  title: "Pathology Explorer · Cognitive Care Assistant",
  description:
    "Educational interactive amyloid and tau pathology explorer — biological context for CCA monitoring. Demonstration only — not a medical device.",
};

type SearchParams = Promise<{ region?: string; signal?: string }>;

export default async function PathologyExplorerPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const sp = searchParams ? await searchParams : {};
  return (
    <PathologyExplorerClient
      fromRegion={typeof sp.region === "string" ? sp.region : null}
      fromSignal={typeof sp.signal === "string" ? sp.signal : null}
    />
  );
}
