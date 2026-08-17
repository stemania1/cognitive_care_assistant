"use client";

import { Canvas } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  OrbitControls,
  PerspectiveCamera,
} from "@react-three/drei";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type * as THREE from "three";
import {
  maxLayerFor,
  partsForModel,
  type SensorModelId,
} from "./catalog";
import { SensorViewerProvider } from "./SensorViewerContext";
import { SCENE_CLEAR } from "./models/materials";
import { SensorSceneModel } from "./models/SensorSceneModel";

export type SensorModelViewerProps = {
  modelId: SensorModelId;
  exploded: boolean;
  maxLayer: number;
  selectedId: string | null;
  isolatedId: string | null;
  hiddenIds: Set<string>;
  transparentEnclosure: boolean;
  resetToken: number;
  onSelect: (id: string | null) => void;
  onLoadState: (state: "loading" | "ready" | "fallback" | "error", message?: string) => void;
};

const CAM = {
  /** Framed for MyoWare two-board stack and the Pi thermal hub. */
  position: [2.1, 1.55, 2.35] as [number, number, number],
  target: [0, 0.08, 0] as [number, number, number],
};

function SceneRig(props: SensorModelViewerProps) {
  const controls = useRef<OrbitControlsImpl>(null);

  const interaction = useMemo(
    () => ({
      modelId: props.modelId,
      explodeProgress: props.exploded ? 1 : 0,
      maxLayer: props.maxLayer,
      selectedId: props.selectedId,
      isolatedId: props.isolatedId,
      hiddenIds: props.hiddenIds,
      transparentEnclosure: props.transparentEnclosure,
      onSelect: (id: string) => {
        props.onSelect(props.selectedId === id ? null : id);
      },
    }),
    [
      props.modelId,
      props.exploded,
      props.maxLayer,
      props.selectedId,
      props.isolatedId,
      props.hiddenIds,
      props.transparentEnclosure,
      props.onSelect,
    ]
  );

  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    c.object.position.set(...CAM.position);
    c.target.set(...CAM.target);
    c.update();
  }, [props.resetToken, props.modelId]);

  return (
    <>
      <color attach="background" args={[SCENE_CLEAR]} />
      <PerspectiveCamera makeDefault position={CAM.position} fov={40} near={0.02} far={50} />
      <ambientLight intensity={0.45} />
      <directionalLight position={[3.5, 5.5, 2.8]} intensity={1.15} castShadow={false} />
      <directionalLight position={[-2.8, 2.2, -2.0]} intensity={0.35} color="#93c5fd" />
      <pointLight position={[0, 1.8, 1.2]} intensity={0.35} color="#22d3ee" distance={12} />
      <Suspense fallback={null}>
        <Environment preset="city" environmentIntensity={0.35} />
      </Suspense>

      <SensorViewerProvider value={interaction}>
        <Suspense fallback={null}>
          <SensorSceneModel modelId={props.modelId} onLoadState={props.onLoadState} />
        </Suspense>
      </SensorViewerProvider>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.35, 0]} receiveShadow>
        <circleGeometry args={[2.4, 48]} />
        <meshStandardMaterial color="#0a1220" metalness={0.2} roughness={0.85} />
      </mesh>
      <ContactShadows position={[0, -0.34, 0]} opacity={0.45} scale={6} blur={2.2} far={3} />

      <OrbitControls
        ref={controls}
        makeDefault
        enableDamping
        dampingFactor={0.08}
        minDistance={0.45}
        maxDistance={8}
        maxPolarAngle={Math.PI * 0.92}
        target={CAM.target}
      />
    </>
  );
}

export function SensorModelViewer(props: SensorModelViewerProps) {
  const [contextKey, setContextKey] = useState(0);

  const onCreated = useCallback(({ gl }: { gl: THREE.WebGLRenderer }) => {
    gl.setClearColor(SCENE_CLEAR, 1);
    const canvas = gl.domElement;
    const onLost = (e: Event) => {
      e.preventDefault();
      // Remount Canvas to recover a lost WebGL context (common after HMR / Strict Mode).
      setContextKey((k) => k + 1);
    };
    canvas.addEventListener("webglcontextlost", onLost, false);
  }, []);

  return (
    <Canvas
      key={contextKey}
      shadows={false}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      className="h-full w-full touch-none cursor-grab select-none active:cursor-grabbing"
      style={{ background: SCENE_CLEAR }}
      onCreated={onCreated}
      onPointerMissed={() => props.onSelect(null)}
    >
      <SceneRig {...props} />
    </Canvas>
  );
}

export { maxLayerFor, partsForModel };
