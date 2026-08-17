"use client";

import { useGLTF } from "@react-three/drei";
import { useLayoutEffect, useMemo } from "react";
import * as THREE from "three";
import { useSensorViewer } from "../SensorViewerContext";

/** Meters → scene units (procedural assemblies are ~Pi-board-width ≈ 1.72). */
export const CAD_SCENE_SCALE = 20;

type CadAssetProps = {
  url: string;
  /** Optional override; otherwise CAD_SCENE_SCALE is applied. */
  scale?: number;
  /** Rotate CAD from STEP orientation into the scene (radians). */
  rotation?: [number, number, number];
  partId?: string;
  position?: [number, number, number];
};

/**
 * Loads a STEP-converted GLB, centers it on XZ, seats the bottom on y=0,
 * and scales meters → viewer units.
 */
export function CadAsset({
  url,
  scale = CAD_SCENE_SCALE,
  rotation = [0, 0, 0],
  partId,
  position = [0, 0, 0],
}: CadAssetProps) {
  const { scene } = useGLTF(url);
  const { selectedId, isolatedId } = useSensorViewer();
  const selected = partId != null && selectedId === partId;
  const dimmed =
    partId != null && selectedId !== null && selectedId !== partId && isolatedId === null;

  const root = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      if (Array.isArray(mesh.material)) {
        mesh.material = mesh.material.map((m) => m.clone());
      } else if (mesh.material) {
        mesh.material = mesh.material.clone();
      }
    });

    // Normalize: center XZ, seat on ground plane, then scale.
    const box = new THREE.Box3().setFromObject(clone);
    const center = box.getCenter(new THREE.Vector3());
    clone.position.x -= center.x;
    clone.position.z -= center.z;
    clone.position.y -= box.min.y;
    clone.scale.setScalar(scale);
    return clone;
  }, [scene, scale]);

  useLayoutEffect(() => {
    root.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const mat of mats) {
        if (!mat) continue;
        const std = mat as THREE.MeshStandardMaterial;
        if ("emissive" in std && std.emissive) {
          if (selected) {
            std.emissive.set("#0891b2");
            std.emissiveIntensity = 0.45;
            std.transparent = false;
            std.opacity = 1;
          } else if (dimmed) {
            std.emissive.set("#000000");
            std.emissiveIntensity = 0;
            std.transparent = true;
            std.opacity = 0.2;
            std.depthWrite = false;
          } else {
            std.emissive.set("#000000");
            std.emissiveIntensity = 0;
            std.transparent = false;
            std.opacity = 1;
            std.depthWrite = true;
          }
          std.needsUpdate = true;
        }
      }
    });
  }, [root, selected, dimmed]);

  return <primitive object={root} position={position} rotation={rotation} />;
}

export const CAD_PATHS = {
  amg8833: "/models/cad/amg8833.glb",
  esp32: "/models/cad/esp-wroom-32.glb",
  raspberryPi: "/models/cad/raspberry-pi-3-model-b.glb",
} as const;

useGLTF.preload(CAD_PATHS.amg8833);
useGLTF.preload(CAD_PATHS.raspberryPi);
// esp-wroom-32 is optional; preload only when MyoWare wiring uses it again.
