"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, type ReactNode } from "react";
import * as THREE from "three";
import { getPart, type SensorModelId } from "../catalog";
import { useSensorViewer } from "../SensorViewerContext";
import { mats } from "./materials";

export function InteractivePart({
  partId,
  children,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
}: {
  partId: string;
  children: ReactNode;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
}) {
  const group = useRef<THREE.Group>(null);
  const { modelId, explodeProgress, maxLayer, selectedId, isolatedId, hiddenIds, onSelect } =
    useSensorViewer();
  const part = getPart(modelId, partId);
  const explode = useMemo(
    () => new THREE.Vector3(...(part?.explodeOffset ?? [0, 0, 0])),
    [part]
  );
  const base = useMemo(() => new THREE.Vector3(...position), [position]);

  const visible =
    !!part &&
    part.layer <= maxLayer &&
    !hiddenIds.has(partId) &&
    (isolatedId === null || isolatedId === partId);

  useFrame((_, dt) => {
    const g = group.current;
    if (!g || !part) return;
    const targetX = base.x + explode.x * explodeProgress;
    const targetY = base.y + explode.y * explodeProgress;
    const targetZ = base.z + explode.z * explodeProgress;
    if (explodeProgress < 0.001) {
      g.position.set(base.x, base.y, base.z);
      return;
    }
    g.position.x += (targetX - g.position.x) * Math.min(1, dt * 7);
    g.position.y += (targetY - g.position.y) * Math.min(1, dt * 7);
    g.position.z += (targetZ - g.position.z) * Math.min(1, dt * 7);
  });

  if (!part || !visible) return null;

  return (
    <group
      ref={group}
      position={position}
      rotation={rotation}
      scale={scale}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(partId);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "auto";
      }}
    >
      {children}
      {selectedId === partId ? (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <ringGeometry args={[0.22, 0.28, 48]} />
          <primitive object={mats.selected()} attach="material" />
        </mesh>
      ) : null}
    </group>
  );
}

export function usePartMat(
  base: THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial,
  partId: string
) {
  const { selectedId, isolatedId } = useSensorViewer();
  if (selectedId === partId) return mats.selected();
  if (selectedId !== null && selectedId !== partId && isolatedId === null) return mats.dimmed();
  return base;
}

export function MBox({
  partId,
  args,
  position,
  rotation,
  material,
}: {
  partId: string;
  args: [number, number, number];
  position?: [number, number, number];
  rotation?: [number, number, number];
  material: THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial;
}) {
  const mat = usePartMat(material, partId);
  return (
    <mesh position={position} rotation={rotation} castShadow receiveShadow>
      <boxGeometry args={args} />
      <primitive object={mat} attach="material" />
    </mesh>
  );
}

export function MCyl({
  partId,
  args,
  position,
  rotation,
  material,
}: {
  partId: string;
  args: [number, number, number, number?];
  position?: [number, number, number];
  rotation?: [number, number, number];
  material: THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial;
}) {
  const mat = usePartMat(material, partId);
  return (
    <mesh position={position} rotation={rotation} castShadow receiveShadow>
      <cylinderGeometry args={args} />
      <primitive object={mat} attach="material" />
    </mesh>
  );
}

export type { SensorModelId };
