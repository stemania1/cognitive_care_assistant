"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { Suspense, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import {
  PHOSPHO_SITES,
  siteAbnormalityScalar,
  sitesActiveForPresentation,
  type PhosphoSiteId,
} from "./phosphoSiteData";

const CLEAR = "#05080f";

export type BiomarkerMode = "healthy" | "elevated";

type Props = {
  mode: BiomarkerMode;
  progression: number;
  selectedSiteId: PhosphoSiteId | null;
  onSelectSite: (id: PhosphoSiteId | null) => void;
  onHoverSite: (payload: null | { id: PhosphoSiteId; clientX: number; clientY: number }) => void;
};

function rnd(i: number, j: number, salt = 0): number {
  const x = Math.sin(i * 12.9898 + j * 78.233 + salt * 3.14) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Elongated, partially misfolded filament path — asymmetric, no closed loops, not helical.
 * Distortion budget capped (~5% of span) for elevated + progression.
 */
function createFilamentBackbone(mode: BiomarkerMode, progression: number): THREE.Vector3[] {
  const n = 260;
  const pts: THREE.Vector3[] = [];
  const span = 2.85;
  const dMax =
    mode === "elevated" ? 0.05 * span * (0.42 + progression * 0.58) : 0.05 * span * 0.022;

  for (let i = 0; i <= n; i++) {
    const u = i / n;
    let y = u * 2.35 - 1.18;
    const w1 = Math.sin(u * 4.71 + 0.37) * 0.36;
    const w2 = Math.cos(u * 11.17 + 1.03) * 0.13;
    const w3 = Math.sin(u * 2.08 + u * u * 3.9) * 0.21;
    let x = w1 + w2 + w3 * 0.48;
    let z = Math.cos(u * 5.94 + 0.62) * 0.29 + Math.sin(u * 8.21) * 0.11 + u * 0.17;
    const pinch = Math.exp(-Math.pow((u - 0.41) / 0.1, 2));
    x += pinch * (-0.33) + pinch * Math.sin(u * 19.7) * 0.07;
    z += pinch * 0.14 + pinch * Math.cos(u * 23) * 0.05;
    x += Math.sin(u * 17.4) * 0.055 * (0.25 + u * 0.75);
    z += Math.sin(u * 13.8 + 0.9) * 0.04;
    x += Math.sin(u * 24.1 + 0.4) * dMax * 0.62;
    y += Math.cos(u * 21.3) * dMax * 0.38;
    z += Math.sin(u * 26.9 + 0.7) * dMax * 0.58;
    if (mode === "elevated") {
      const cl = progression * 0.88;
      x += Math.sin(u * 31.2 + progression * 4.2) * dMax * cl * 0.85;
      y += Math.cos(u * 27.4) * dMax * 0.42 * cl;
      z += Math.sin(u * 29.1) * dMax * cl * 0.72;
    }
    pts.push(new THREE.Vector3(x, y, z));
  }
  return pts;
}

function localStrandThickness(u: number, mode: BiomarkerMode, progression: number): number {
  const base = 0.031;
  const stretchCompact = 0.42 + 0.58 * Math.pow(Math.sin(u * Math.PI * 3.9), 2);
  const compact = 1 + 0.38 * Math.exp(-Math.pow((u - 0.37) / 0.11, 2));
  const agg =
    mode === "elevated"
      ? 1 + progression * 0.32 * Math.exp(-Math.pow((u - 0.58) / 0.13, 2))
      : 1;
  return base * stretchCompact * compact * agg;
}

function filamentFrame(curve: THREE.CatmullRomCurve3, t: number) {
  const p = curve.getPointAt(t);
  const tan = curve.getTangentAt(t).normalize();
  let up = new THREE.Vector3(0, 1, 0);
  if (Math.abs(tan.dot(up)) > 0.93) up = new THREE.Vector3(1, 0, 0);
  const binorm = new THREE.Vector3().crossVectors(tan, up).normalize();
  const norm = new THREE.Vector3().crossVectors(binorm, tan).normalize();
  return { p, tan, norm, binorm };
}

/** Blue-violet → soft yellow → orange → restrained red (no neon). */
function colorFromSignal(a: number, mode: BiomarkerMode): THREE.Color {
  const c = new THREE.Color();
  const deep = new THREE.Color(0.11, 0.13, 0.34);
  const violet = new THREE.Color(0.24, 0.19, 0.48);
  const yellow = new THREE.Color(0.68, 0.58, 0.3);
  const orange = new THREE.Color(0.68, 0.36, 0.16);
  const red = new THREE.Color(0.52, 0.17, 0.15);
  if (mode === "healthy") {
    return c.copy(deep).lerp(violet, Math.min(0.48, a * 0.82 + 0.07));
  }
  if (a < 0.34) return c.copy(deep).lerp(yellow, a / 0.34);
  if (a < 0.66) return c.copy(yellow).lerp(orange, (a - 0.34) / 0.32);
  return c.copy(orange).lerp(red, Math.min(1, (a - 0.66) / 0.34));
}

const baseStrandColor = new THREE.Color(0.14, 0.16, 0.36);
const tempCol = new THREE.Color();
const tempMatrix4 = new THREE.Matrix4();

type StrandInstancedProps = {
  curve: THREE.CatmullRomCurve3;
  mode: BiomarkerMode;
  progression: number;
  count: number;
};

function StrandInstancedMesh({ curve, mode, progression, count }: StrandInstancedProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const samples = 148;
  const perSample = Math.max(4, Math.ceil(count / samples));

  const { matrices, colors } = useMemo(() => {
    const matrices = new Float32Array(count * 16);
    const colorsArr = new Float32Array(count * 3);
    let idx = 0;
    const mat = new THREE.Matrix4();
    for (let i = 0; i < samples && idx < count; i++) {
      const t = samples > 1 ? i / (samples - 1) : 0;
      const { p, tan, norm, binorm } = filamentFrame(curve, t);
      const rad = localStrandThickness(t, mode, progression);
      for (let j = 0; j < perSample && idx < count; j++) {
        const a = rnd(i, j, 1) * Math.PI * 2;
        const rr = rad * (0.42 + rnd(i, j, 2) * 0.52);
        const ox = norm.x * Math.cos(a) * rr + binorm.x * Math.sin(a) * rr;
        const oy = norm.y * Math.cos(a) * rr + binorm.y * Math.sin(a) * rr;
        const oz = norm.z * Math.cos(a) * rr + binorm.z * Math.sin(a) * rr;
        const jitter = rad * 0.28 * (rnd(i, j, 3) - 0.5);
        const px = p.x + ox + tan.x * jitter;
        const py = p.y + oy + tan.y * jitter;
        const pz = p.z + oz + tan.z * jitter;
        const s = rad * (0.2 + rnd(i, j, 4) * 0.42);
        mat.compose(
          new THREE.Vector3(px, py, pz),
          new THREE.Quaternion(),
          new THREE.Vector3(s, s * (0.88 + rnd(i, j, 5) * 0.2), s)
        );
        mat.toArray(matrices, idx * 16);
        const cv = rnd(i, j, 6);
        tempCol.copy(baseStrandColor);
        tempCol.r += (cv - 0.5) * 0.06;
        tempCol.g += (rnd(i, j, 7) - 0.5) * 0.05;
        tempCol.b += (rnd(i, j, 8) - 0.5) * 0.07;
        colorsArr[idx * 3] = tempCol.r;
        colorsArr[idx * 3 + 1] = tempCol.g;
        colorsArr[idx * 3 + 2] = tempCol.b;
        idx++;
      }
    }
    while (idx < count) {
      const t = rnd(idx, 0, 9);
      const { p, tan, norm, binorm } = filamentFrame(curve, t);
      const rad = localStrandThickness(t, mode, progression) * 0.9;
      const ox = (rnd(idx, 1, 10) - 0.5) * rad;
      const oy = (rnd(idx, 2, 11) - 0.5) * rad;
      const oz = (rnd(idx, 3, 12) - 0.5) * rad;
      const px = p.x + norm.x * ox + binorm.x * oy + tan.x * oz * 0.3;
      const py = p.y + norm.y * ox + binorm.y * oy + tan.y * oz * 0.3;
      const pz = p.z + norm.z * ox + binorm.z * oy + tan.z * oz * 0.3;
      const s = rad * 0.35;
      mat.compose(
        new THREE.Vector3(px, py, pz),
        new THREE.Quaternion(),
        new THREE.Vector3(s, s * 0.95, s)
      );
      mat.toArray(matrices, idx * 16);
      colorsArr[idx * 3] = baseStrandColor.r;
      colorsArr[idx * 3 + 1] = baseStrandColor.g;
      colorsArr[idx * 3 + 2] = baseStrandColor.b;
      idx++;
    }
    return { matrices, colors: colorsArr };
  }, [curve, mode, progression, count, samples, perSample]);

  const geometry = useMemo(() => new THREE.SphereGeometry(1, 9, 9), []);
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        roughness: 0.78,
        metalness: 0.04,
        envMapIntensity: 0.35,
      }),
    []
  );

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      tempMatrix4.fromArray(matrices, i * 16);
      mesh.setMatrixAt(i, tempMatrix4);
      c.setRGB(colors[i * 3], colors[i * 3 + 1], colors[i * 3 + 2]);
      mesh.setColorAt(i, c);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [matrices, colors, count]);

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, count]}
      castShadow
      receiveShadow
    />
  );
}

function PhosphoCluster({
  site,
  mode,
  progression,
  curve,
  selected,
  onSelectSite,
  onHoverSite,
}: {
  site: (typeof PHOSPHO_SITES)[number];
  mode: BiomarkerMode;
  progression: number;
  curve: THREE.CatmullRomCurve3;
  selected: boolean;
  onSelectSite: (id: PhosphoSiteId | null) => void;
  onHoverSite: (payload: null | { id: PhosphoSiteId; clientX: number; clientY: number }) => void;
}) {
  const a = siteAbnormalityScalar(mode, progression, site.tier);
  const col = useMemo(() => colorFromSignal(a, mode), [a, mode]);
  const t = site.curveT;
  const rad = localStrandThickness(t, mode, progression);

  const clusterMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: col,
        emissive: col,
        roughness: 0.64,
        metalness: 0.05,
        toneMapped: true,
      }),
    [col]
  );

  useEffect(() => {
    return () => {
      clusterMaterial.dispose();
    };
  }, [clusterMaterial]);

  const { center, clusterOffsets, hitRadius, sphereRadii } = useMemo(() => {
    const { p, tan, norm, binorm } = filamentFrame(curve, t);
    const outward = norm.clone().multiplyScalar(rad * 0.82).add(binorm.clone().multiplyScalar(rad * 0.12));
    const center = p.clone().add(outward);
    const n = 6;
    const offs: THREE.Vector3[] = [];
    const radii: number[] = [];
    const seed = t * 1000;
    for (let k = 0; k < n; k++) {
      const ox = (rnd(seed, k, 20) - 0.5) * rad * 0.55;
      const oy = (rnd(seed, k, 21) - 0.5) * rad * 0.5;
      const oz = (rnd(seed, k, 22) - 0.5) * rad * 0.45;
      offs.push(
        new THREE.Vector3()
          .addScaledVector(norm, ox)
          .addScaledVector(binorm, oy)
          .addScaledVector(tan, oz * 0.35)
      );
      radii.push(rad * (0.2 + rnd(seed, k, 30) * 0.2));
    }
    return { center, clusterOffsets: offs, hitRadius: rad * 1.35, sphereRadii: radii };
  }, [curve, t, rad]);

  const baseEmissive =
    mode === "healthy"
      ? 0.055 + progression * 0.09
      : 0.09 + progression * 0.52 * (0.42 + a * 0.58);

  useFrame((state) => {
    const breath =
      mode === "elevated" && a > 0.32 ? 1 + Math.sin(state.clock.elapsedTime * 1.65) * 0.035 : 1;
    clusterMaterial.emissiveIntensity = Math.min(
      1.05,
      (baseEmissive + (selected ? 0.12 : 0)) * breath
    );
  });

  return (
    <group position={[center.x, center.y, center.z]}>
      <mesh
        onPointerOver={(e) => {
          e.stopPropagation();
          onHoverSite({ id: site.id, clientX: e.clientX, clientY: e.clientY });
          document.body.style.cursor = "pointer";
        }}
        onPointerMove={(e) => {
          onHoverSite({ id: site.id, clientX: e.clientX, clientY: e.clientY });
        }}
        onPointerOut={() => {
          onHoverSite(null);
          document.body.style.cursor = "auto";
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSelectSite(selected ? null : site.id);
        }}
        visible={false}
      >
        <sphereGeometry args={[hitRadius, 12, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {clusterOffsets.map((off, k) => (
        <mesh key={k} position={[off.x, off.y, off.z]} castShadow material={clusterMaterial}>
          <sphereGeometry args={[sphereRadii[k] ?? rad * 0.28, 10, 10]} />
        </mesh>
      ))}
    </group>
  );
}

function ProteinFilament(props: Props) {
  const rootRef = useRef<THREE.Group>(null);
  const { mode, progression, selectedSiteId, onSelectSite, onHoverSite } = props;

  const activeSet = useMemo(() => sitesActiveForPresentation(mode, progression), [mode, progression]);

  const curve = useMemo(() => {
    const points = createFilamentBackbone(mode, progression);
    return new THREE.CatmullRomCurve3(points);
  }, [mode, progression]);

  const instanceCount = mode === "healthy" ? 520 : 780;

  useFrame((state, delta) => {
    if (rootRef.current) {
      const t = state.clock.elapsedTime;
      rootRef.current.rotation.y += delta * 0.07;
      rootRef.current.rotation.z = Math.sin(t * 0.17) * 0.045;
      rootRef.current.rotation.x = Math.sin(t * 0.11) * 0.035;
      const idle = Math.sin(t * 0.38) * 0.008;
      rootRef.current.position.y = idle;
    }
  });

  return (
    <group ref={rootRef}>
      <StrandInstancedMesh curve={curve} mode={mode} progression={progression} count={instanceCount} />
      {PHOSPHO_SITES.map((site) => {
        if (!activeSet.has(site.id)) return null;
        const selected = selectedSiteId === site.id;
        return (
          <PhosphoCluster
            key={site.id}
            site={site}
            mode={mode}
            progression={progression}
            curve={curve}
            selected={selected}
            onSelectSite={onSelectSite}
            onHoverSite={onHoverSite}
          />
        );
      })}
    </group>
  );
}

function SceneRig(props: Props) {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0.06, 0.14, 3.1]} fov={35} />
      <OrbitControls
        enableZoom
        enablePan={false}
        enableRotate
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.75}
        minPolarAngle={Math.PI * 0.12}
        maxPolarAngle={Math.PI * 0.88}
        minDistance={1.45}
        maxDistance={7.5}
        zoomSpeed={0.85}
        target={[0, 0.05, 0]}
      />
      <color attach="background" args={[CLEAR]} />
      <ambientLight intensity={0.34} />
      <directionalLight position={[3.4, 5.2, 3.6]} intensity={0.88} />
      <directionalLight position={[-3.2, 1.6, -2.2]} intensity={0.26} color="#a4b4dc" />
      <pointLight position={[0, -1.05, 1.55]} intensity={0.34} color="#5869a8" distance={7.5} />
      <ProteinFilament {...props} />
    </>
  );
}

export function PTauProteinCanvas(props: Props) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      className="h-full w-full cursor-grab select-none active:cursor-grabbing"
      onPointerMissed={() => props.onSelectSite(null)}
    >
      <Suspense fallback={null}>
        <SceneRig {...props} />
      </Suspense>
    </Canvas>
  );
}
