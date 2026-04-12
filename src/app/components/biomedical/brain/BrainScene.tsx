"use client";

import { Canvas, useFrame, type RootState } from "@react-three/fiber";
import {
  Environment,
  Html,
  OrbitControls,
  PerspectiveCamera,
  ContactShadows,
  useGLTF,
} from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef, useState, Component, type ReactNode } from "react";
import * as THREE from "three";
import { createBrainSurfaceTextures } from "./brainTextures";
import { createClinicalBrainMaterial, MAX_REGIONS } from "./clinicalBrainShader";
import { buildMergedBrainGeometry } from "./mergeBrainMesh";
import type { CognitiveSignals } from "@/lib/cognitiveSignals";
import { clinicalConcernRgb, regionConcernResolved } from "../cognitiveInterpretation";
import {
  BRAIN_ASSET_URL,
  BRAIN_GROUP_POSITION,
  BRAIN_REGIONS,
  BRAIN_SCENE_ROTATION,
  BRAIN_SCENE_SCALE,
  primaryRegionsForDomain,
  type BrainRegionMeta,
  type BrainRegionId,
  type CognitiveDomain,
} from "./regionConfig";
import { inferDeclineStageFromTelemetry, stageHighlightFactor } from "./dementiaProgression";
import { isRegionWeakened } from "./brainHoverTooltipModel";

/** Must match scene & CSS so the canvas never flashes white before the first frame. */
export const BRAIN_SCENE_CLEAR_HEX = "#040a12";

useGLTF.preload(BRAIN_ASSET_URL);

type Props = {
  domain: CognitiveDomain;
  memoryPerformance: number;
  speechClarity: number;
  brainActivity: number;
  cognitiveSignals?: CognitiveSignals | null;
  onSelectRegion: (id: BrainRegionId | null) => void;
  onWeakRegionPointer: (payload: null | { id: BrainRegionId; clientX: number; clientY: number }) => void;
};

function parseHeatRgb(s: string): THREE.Vector3 {
  const m = s.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!m) return new THREE.Vector3(0.2, 0.45, 0.95);
  return new THREE.Vector3(
    parseInt(m[1], 10) / 255,
    parseInt(m[2], 10) / 255,
    parseInt(m[3], 10) / 255
  );
}

function isPrimaryForTab(domain: CognitiveDomain, id: BrainRegionId): boolean {
  const prim = primaryRegionsForDomain(domain);
  if (prim === null) return true;
  return prim.includes(id);
}

function computeRegionIntensity(
  domain: CognitiveDomain,
  id: BrainRegionId,
  memoryPerformance: number,
  speechClarity: number,
  brainActivity: number,
  signals: CognitiveSignals | null | undefined
): number {
  const r = BRAIN_REGIONS.find((x) => x.id === id);
  if (!r) return 0;

  const c = regionConcernResolved(id, signals, memoryPerformance, speechClarity, brainActivity);
  let v = 0.14 + c * 0.86;

  if (domain === "idle") {
    v = 0.1 + c * 0.9;
  } else if (domain === "memory") {
    if (r.domains.includes("memory")) {
      v = 0.2 + c * 0.8;
    } else {
      v = Math.min(0.08, c * 0.12);
    }
  } else if (domain === "speech") {
    if (r.domains.includes("speech")) {
      v = 0.2 + c * 0.8;
    } else if (
      id === "hippocampus_l" ||
      id === "hippocampus_r" ||
      id === "entorhinal_l" ||
      id === "entorhinal_r" ||
      id === "mtl_l" ||
      id === "mtl_r"
    ) {
      const lc = signals?.languageConcern ?? 1 - speechClarity;
      v = 0.06 + lc * 0.14;
    } else {
      v = 0.03;
    }
  } else if (domain === "cognitive") {
    if (r.domains.includes("cognitive")) {
      v = 0.2 + c * 0.8;
    } else {
      v = Math.min(0.08, c * 0.12);
    }
  }

  if (domain !== "idle") {
    if (!isPrimaryForTab(domain, id)) {
      return Math.min(0.1, v * 0.22);
    }
    v = Math.min(1, v * 1.55);
  }

  v = Math.min(1, v * (0.94 + c * 0.14));
  return Math.min(1, Math.max(0, v));
}

function nearestRegionId(local: THREE.Vector3): BrainRegionId | null {
  let best: BrainRegionId | null = null;
  let bestRatio = Infinity;
  for (const reg of BRAIN_REGIONS) {
    const pt = new THREE.Vector3(reg.position[0], reg.position[1], reg.position[2]);
    const d = local.distanceTo(pt);
    const limit = reg.radius + 0.12;
    const ratio = d / Math.max(limit, 1e-4);
    if (ratio < bestRatio) {
      bestRatio = ratio;
      best = reg.id;
    }
  }
  if (best === null || bestRatio > 1.08) return null;
  return best;
}

function computeRegionColor(
  domain: CognitiveDomain,
  id: BrainRegionId,
  memoryPerformance: number,
  speechClarity: number,
  brainActivity: number,
  signals: CognitiveSignals | null | undefined
): string {
  void domain;
  return clinicalConcernRgb(regionConcernResolved(id, signals, memoryPerformance, speechClarity, brainActivity));
}

function BrainSuspenseFallback() {
  return (
    <Html center zIndexRange={[8, 18]}>
      <div className="rounded-lg border border-cyan-500/30 bg-[#0a1629]/95 px-3 py-2 text-[10px] text-cyan-200/90 shadow-lg">
        Loading 3D brain…
      </div>
    </Html>
  );
}

function AnatomicalBrain(props: Props) {
  const { onSelectRegion, onWeakRegionPointer } = props;
  const gltf = useGLTF(BRAIN_ASSET_URL);
  const { geometry, hasTangent } = useMemo(() => buildMergedBrainGeometry(gltf.scene), [gltf.scene]);

  const vertCount = geometry.attributes.position?.count ?? 0;
  const surface = useMemo(() => createBrainSurfaceTextures(), []);
  const material = useMemo(
    () =>
      createClinicalBrainMaterial(surface.normalMap, surface.roughnessMap, {
        fissureStrength: 0,
        regionSpread: 0.36,
        normalScale: hasTangent ? 0.42 : 0,
      }),
    [surface, hasTangent]
  );

  const propsRef = useRef(props);
  propsRef.current = props;

  useEffect(() => {
    return () => {
      surface.dispose();
      material.dispose();
      geometry.dispose();
    };
  }, [surface, material, geometry]);

  useFrame(({ camera, clock }) => {
    const p = propsRef.current;
    const mat = material;
    mat.uniforms.uTime.value = clock.elapsedTime;
    const viewDir = new THREE.Vector3(0, 0, 0).sub(camera.position).normalize();
    mat.uniforms.uViewDirWorld.value.copy(viewDir);

    const pos = mat.uniforms.uRegionPos.value as THREE.Vector3[];
    const ints = mat.uniforms.uRegionInt.value as Float32Array;
    const cols = mat.uniforms.uRegionCol.value as THREE.Vector3[];

    const stage = inferDeclineStageFromTelemetry(
      p.cognitiveSignals,
      p.memoryPerformance,
      p.speechClarity,
      p.brainActivity
    );

    for (let i = 0; i < MAX_REGIONS; i++) {
      if (i < BRAIN_REGIONS.length) {
        const reg = BRAIN_REGIONS[i];
        pos[i].set(reg.position[0], reg.position[1], reg.position[2]);
        const inten = computeRegionIntensity(
          p.domain,
          reg.id,
          p.memoryPerformance,
          p.speechClarity,
          p.brainActivity,
          p.cognitiveSignals ?? null
        );
        ints[i] = Math.min(1, inten * stageHighlightFactor(reg.id, stage));
        cols[i].copy(
          parseHeatRgb(
            computeRegionColor(
              p.domain,
              reg.id,
              p.memoryPerformance,
              p.speechClarity,
              p.brainActivity,
              p.cognitiveSignals ?? null
            )
          )
        );
      } else {
        pos[i].set(0, 0, 0);
        ints[i] = 0;
        cols[i].set(0, 0, 0);
      }
    }

    const speechBoost = p.domain === "speech" ? 0.85 : 0;
    mat.uniforms.uAmbient.value.setRGB(
      0.06 + speechBoost * 0.04,
      0.08 + speechBoost * 0.06,
      0.11 + speechBoost * 0.08
    );
  });

  useEffect(() => {
    material.uniforms.uLightDirWorld.value.set(0.35, 0.88, 0.38).normalize();
  }, [material]);

  const meshRef = useRef<THREE.Mesh>(null);

  const emitWeakHover = (local: THREE.Vector3, clientX: number, clientY: number) => {
    const p = propsRef.current;
    const best = nearestRegionId(local);
    if (
      best &&
      isRegionWeakened(best, p.cognitiveSignals, p.memoryPerformance, p.speechClarity, p.brainActivity)
    ) {
      onWeakRegionPointer({ id: best, clientX, clientY });
    } else {
      onWeakRegionPointer(null);
    }
  };

  const handleOut = () => {
    onWeakRegionPointer(null);
  };

  const [rx, ry, rz] = BRAIN_SCENE_ROTATION;
  const [px, py, pz] = BRAIN_GROUP_POSITION;

  if (vertCount === 0) {
    return (
      <group position={[px, py, pz]} rotation={[rx, ry, rz]} scale={BRAIN_SCENE_SCALE}>
        <mesh>
          <boxGeometry args={[0.45, 0.55, 0.4]} />
          <meshStandardMaterial color="#475569" roughness={0.65} metalness={0.1} />
        </mesh>
        <Html center distanceFactor={6} zIndexRange={[12, 22]}>
          <div className="max-w-[220px] rounded-md border border-amber-500/40 bg-[#0f172a]/95 px-2 py-1 text-[10px] text-amber-100">
            Mesh data missing — check that {BRAIN_ASSET_URL} is available in /public.
          </div>
        </Html>
      </group>
    );
  }

  return (
    <group position={[px, py, pz]} rotation={[rx, ry, rz]} scale={BRAIN_SCENE_SCALE}>
      <mesh
        ref={meshRef}
        geometry={geometry}
        material={material}
        castShadow
        receiveShadow
        onPointerMove={(e) => {
          e.stopPropagation();
          if (!meshRef.current) return;
          const local = meshRef.current.worldToLocal(e.point.clone());
          emitWeakHover(local, e.clientX, e.clientY);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          handleOut();
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (!meshRef.current) return;
          const local = meshRef.current.worldToLocal(e.point.clone());
          const p = propsRef.current;
          const best = nearestRegionId(local);
          if (
            best &&
            isRegionWeakened(best, p.cognitiveSignals, p.memoryPerformance, p.speechClarity, p.brainActivity)
          ) {
            onSelectRegion(best);
          } else {
            onSelectRegion(null);
          }
        }}
      />
    </group>
  );
}

function SceneContent(props: Props) {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0.2, 0.06, 1.86]} fov={28} near={0.01} far={100} />
      <OrbitControls
        enablePan={false}
        minDistance={1.45}
        maxDistance={3.85}
        target={[0, 0.02, 0]}
        minPolarAngle={0.35}
        maxPolarAngle={Math.PI - 0.38}
        rotateSpeed={0.35}
        zoomSpeed={0.55}
        enableDamping
        dampingFactor={0.092}
      />

      <color attach="background" args={[BRAIN_SCENE_CLEAR_HEX]} />
      <ambientLight intensity={0.22} />
      <hemisphereLight intensity={0.55} color="#a5c4fd" groundColor="#0a1018" />
      <directionalLight
        position={[3.2, 4.5, 2.4]}
        intensity={0.85}
        color="#e8f0ff"
        castShadow
      />
      <spotLight
        position={[2.5, 2.5, 2.35]}
        angle={0.38}
        penumbra={0.95}
        intensity={0.95}
        color="#e8f0ff"
      />
      <spotLight
        position={[-2.4, 1.6, 1.9]}
        angle={0.5}
        penumbra={1}
        intensity={0.52}
        color="#c4f0e8"
      />
      <pointLight position={[0, 1.1, 1.2]} intensity={0.32} color="#7dd3fc" />

      <Suspense fallback={<BrainSuspenseFallback />}>
        <AnatomicalBrain {...props} />
      </Suspense>

      <Suspense fallback={null}>
        <Environment preset="night" environmentIntensity={0.12} />
      </Suspense>

      <ContactShadows
        position={[0, -1.12, 0]}
        opacity={0.38}
        scale={9}
        blur={3.6}
        far={4.8}
        color="#01040a"
      />
    </>
  );
}

function initGl(state: RootState) {
  const bg = new THREE.Color(BRAIN_SCENE_CLEAR_HEX);
  state.gl.setClearColor(bg, 1);
  state.scene.background = bg;
  if ("outputColorSpace" in state.gl) {
    state.gl.outputColorSpace = THREE.SRGBColorSpace;
  }
  state.gl.toneMapping = THREE.ACESFilmicToneMapping;
}

type BrainErrorBoundaryProps = { children: ReactNode; onRetry: () => void };

type BrainErrorBoundaryState = { hasError: boolean };

export class BrainErrorBoundary extends Component<BrainErrorBoundaryProps, BrainErrorBoundaryState> {
  state: BrainErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): BrainErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("[BrainScene]", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full min-h-[400px] w-full flex-col items-center justify-center gap-3 bg-[#020810] px-4 text-center">
          <p className="max-w-xs text-[11px] leading-relaxed text-slate-400">
            3D brain failed to load – check that <span className="font-mono text-slate-300">/models/cerebrum.glb</span> exists, then retry.
          </p>
          <button
            type="button"
            className="rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-[11px] font-medium text-cyan-200 transition hover:bg-cyan-500/15"
            onClick={() => this.props.onRetry()}
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export function BrainCanvas(props: Props) {
  const [mountKey, setMountKey] = useState(0);

  return (
    <BrainErrorBoundary key={mountKey} onRetry={() => setMountKey((k) => k + 1)}>
      <div
        className="relative h-full min-h-0 w-full max-w-full overflow-hidden bg-[#020810]"
        style={{ backgroundColor: BRAIN_SCENE_CLEAR_HEX, contain: "paint" }}
      >
        <Canvas
          className="!block h-full w-full max-w-full touch-none"
          style={{
            width: "100%",
            height: "100%",
            maxWidth: "100%",
            maxHeight: "100%",
            display: "block",
            background: BRAIN_SCENE_CLEAR_HEX,
            position: "relative",
          }}
          shadows
          frameloop="always"
          gl={{
            antialias: true,
            alpha: false,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.08,
            powerPreference: "high-performance",
          }}
          dpr={[1, 2]}
          onCreated={initGl}
        >
          <SceneContent {...props} />
        </Canvas>
      </div>
    </BrainErrorBoundary>
  );
}

export default BrainCanvas;
