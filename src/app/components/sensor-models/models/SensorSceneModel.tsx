"use client";

import { useEffect } from "react";
import type { SensorModelId } from "../catalog";
import { MODEL_PATHS } from "../catalog";
import { MyoWareWristbandModel } from "./MyoWareWristbandModel";
import { RaspberryPiEnclosureModel } from "./RaspberryPiEnclosureModel";

type Props = {
  modelId: SensorModelId;
  onLoadState: (state: "loading" | "ready" | "fallback" | "error", message?: string) => void;
};

function ProceduralModel({ modelId }: { modelId: SensorModelId }) {
  if (modelId === "myoware") return <MyoWareWristbandModel />;
  return <RaspberryPiEnclosureModel />;
}

/**
 * MyoWare: standalone procedural board.
 * Thermal hub: STEP→GLB Pi / AMG8833 plus procedural enclosure fixtures.
 */
export function SensorSceneModel({ modelId, onLoadState }: Props) {
  useEffect(() => {
    let cancelled = false;
    onLoadState("loading");

    (async () => {
      try {
        if (modelId === "myoware") {
          if (!cancelled) {
            onLoadState(
              "ready",
              "MyoWare 2.0 Muscle Sensor (triangle) + Wireless board — geometry from product photos."
            );
          }
          return;
        }

        const paths = [MODEL_PATHS.raspberryPi, MODEL_PATHS.amg8833];
        const results = await Promise.all(
          paths.map(async (p) => {
            const res = await fetch(p, { method: "HEAD" });
            return { path: p, ok: res.ok };
          })
        );
        if (cancelled) return;
        const missing = results.filter((r) => !r.ok).map((r) => r.path);
        if (missing.length) {
          onLoadState(
            "fallback",
            `Missing CAD: ${missing.join(", ")}. Run scripts/convert-step-to-glb.py after placing STEP files.`
          );
        } else {
          onLoadState(
            "ready",
            "Loaded STEP CAD (AMG8833 / Raspberry Pi 3 Model B) with enclosure fixtures."
          );
        }
      } catch (err) {
        if (!cancelled) {
          onLoadState(
            "error",
            err instanceof Error ? err.message : "Failed to verify CAD assets."
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [modelId, onLoadState]);

  return <ProceduralModel modelId={modelId} />;
}
