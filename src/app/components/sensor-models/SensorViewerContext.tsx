"use client";

import { createContext, useContext } from "react";
import type { SensorModelId } from "./catalog";

export type SensorViewerState = {
  modelId: SensorModelId;
  explodeProgress: number;
  maxLayer: number;
  selectedId: string | null;
  isolatedId: string | null;
  hiddenIds: Set<string>;
  transparentEnclosure: boolean;
  onSelect: (id: string) => void;
};

const Ctx = createContext<SensorViewerState | null>(null);

export function SensorViewerProvider({
  value,
  children,
}: {
  value: SensorViewerState;
  children: React.ReactNode;
}) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSensorViewer(): SensorViewerState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSensorViewer requires SensorViewerProvider");
  return v;
}
