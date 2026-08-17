"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { Html, OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { Suspense, useEffect, useMemo } from "react";
import * as THREE from "three";
import type { HotspotId, PathologyHotspot, PathologyKind } from "./pathologyContent";

const CLEAR = "#000000";
const HELIX = "#e019a8";
const HELIX_EM = "#6b0848";
const SHEET = "#f0c400";
const SHEET_EM = "#7a6200";
const LOOP_WHITE = "#dce3ee";
const LOOP_CYAN = "#5ec8f0";
const ACCENT_BLUE = "#1d4ed8";

type Props = {
  kind: PathologyKind;
  hotspots: PathologyHotspot[];
  activeHotspot: HotspotId | null;
  hoveredHotspot: HotspotId | null;
  onHoverHotspot: (id: HotspotId | null) => void;
  onSelectHotspot: (id: HotspotId) => void;
};

/** True alpha-helix ribbon path along a straight axis — clean, readable coils. */
function makeHelix(
  origin: [number, number, number],
  axis: [number, number, number],
  length: number,
  radius: number,
  turns: number
): THREE.CatmullRomCurve3 {
  const o = new THREE.Vector3(...origin);
  const ax = new THREE.Vector3(...axis).normalize();
  let up = new THREE.Vector3(0, 1, 0);
  if (Math.abs(ax.dot(up)) > 0.9) up = new THREE.Vector3(1, 0, 0);
  const side = new THREE.Vector3().crossVectors(ax, up).normalize();
  const bin = new THREE.Vector3().crossVectors(ax, side).normalize();
  const n = Math.max(40, Math.floor(turns * 20));
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const ang = t * turns * Math.PI * 2;
    pts.push(
      o
        .clone()
        .addScaledVector(ax, t * length)
        .addScaledVector(side, Math.cos(ang) * radius)
        .addScaledVector(bin, Math.sin(ang) * radius)
    );
  }
  return new THREE.CatmullRomCurve3(pts);
}

/** Flat beta-strand ribbon with arrow tip — structural clarity over detail. */
function makeSheet(
  start: [number, number, number],
  end: [number, number, number],
  width: number
): THREE.BufferGeometry {
  const a = new THREE.Vector3(...start);
  const b = new THREE.Vector3(...end);
  const d = b.clone().sub(a);
  const len = d.length();
  d.normalize();
  let up = new THREE.Vector3(0, 0, 1);
  if (Math.abs(d.dot(up)) > 0.85) up = new THREE.Vector3(0, 1, 0);
  const side = new THREE.Vector3().crossVectors(d, up).normalize();
  const normal = new THREE.Vector3().crossVectors(side, d).normalize();
  const segs = 12;
  const positions: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const bodyEnd = 0.82;
    const taper = t > bodyEnd ? Math.max(0.05, 1 - (t - bodyEnd) / (1 - bodyEnd)) : 1;
    const center = a.clone().addScaledVector(d, t * len).addScaledVector(normal, Math.sin(t * Math.PI) * 0.02);
    const half = (width * taper) / 2;
    const p0 = center.clone().addScaledVector(side, -half);
    const p1 = center.clone().addScaledVector(side, half);
    positions.push(p0.x, p0.y, p0.z, p1.x, p1.y, p1.z);
    if (i < segs) {
      const base = i * 2;
      indices.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
    }
  }
  const tip = a.clone().addScaledVector(d, len * 1.06);
  const tipIdx = positions.length / 3;
  positions.push(tip.x, tip.y, tip.z);
  const last = segs * 2;
  indices.push(last, last + 1, tipIdx);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function makeLoop(points: [number, number, number][]): THREE.CatmullRomCurve3 {
  return new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
}

/**
 * Original educational fold: parallel helix bundle + lateral beta sheet + sparse loops.
 * Designed for structural clarity — not random density.
 */
function ProteinModel({
  kind,
  highlightId,
}: {
  kind: PathologyKind;
  highlightId: HotspotId | null;
}) {
  const helices = useMemo(
    () => [
      // Central parallel bundle (readable core)
      { curve: makeHelix([-0.35, -1.15, 0.05], [0.08, 1, 0.04], 2.25, 0.13, 6.5), id: 2 as HotspotId | null },
      { curve: makeHelix([-0.08, -1.1, -0.12], [0.02, 1, 0.06], 2.15, 0.125, 6.2), id: 3 as HotspotId | null },
      { curve: makeHelix([0.2, -1.05, 0.1], [-0.05, 1, -0.02], 2.05, 0.12, 5.9), id: null },
      // Long descending helix (classic APP-like silhouette cue)
      { curve: makeHelix([0.15, -0.15, 0.05], [0.35, -0.85, 0.12], 1.55, 0.115, 4.6), id: 4 as HotspotId | null },
      // Shorter satellite helix
      { curve: makeHelix([0.85, -0.55, -0.15], [0.15, 0.75, 0.2], 0.95, 0.1, 3.2), id: null },
      // Upper short helix
      { curve: makeHelix([-0.55, 0.55, -0.2], [0.55, 0.35, 0.25], 0.85, 0.095, 2.8), id: null },
    ],
    []
  );

  const sheets = useMemo(
    () => [
      makeSheet([0.15, 0.35, 0.45], [0.75, 0.65, -0.05], 0.32),
      makeSheet([0.12, 0.12, 0.5], [0.72, 0.38, 0.05], 0.3),
      makeSheet([0.1, -0.1, 0.48], [0.7, 0.15, 0.1], 0.28),
      makeSheet([0.18, 0.55, 0.3], [0.7, 0.8, -0.15], 0.26),
    ],
    []
  );

  // Sparse, intentional backbone connectors — each path links real termini.
  const loops = useMemo(
    () => [
      {
        curve: makeLoop([
          [-0.35, 1.1, 0.15],
          [-0.7, 1.35, 0.4],
          [-0.2, 1.55, 0.75],
          [0.55, 1.4, 0.55],
          [0.85, 1.05, 0.2],
        ]),
        color: LOOP_WHITE,
        rad: 0.016,
        hotspot: 1 as HotspotId,
      },
      {
        curve: makeLoop([
          [-0.35, 1.05, 0.05],
          [-0.55, 0.85, -0.25],
          [-0.25, 0.7, -0.35],
          [0.1, 0.95, -0.15],
        ]),
        color: LOOP_CYAN,
        rad: 0.014,
        hotspot: null,
      },
      {
        curve: makeLoop([
          [0.2, 1.0, 0.1],
          [0.45, 0.75, 0.35],
          [0.35, 0.4, 0.4],
        ]),
        color: LOOP_CYAN,
        rad: 0.014,
        hotspot: null,
      },
      {
        curve: makeLoop([
          [0.95, 0.45, -0.15],
          [1.15, 0.15, -0.35],
          [0.95, -0.25, -0.2],
          [0.9, -0.45, -0.05],
        ]),
        color: LOOP_WHITE,
        rad: 0.015,
        hotspot: 5 as HotspotId,
      },
      {
        curve: makeLoop([
          [-0.08, -1.1, -0.12],
          [-0.45, -1.25, 0.15],
          [-0.7, -0.85, 0.35],
          [-0.55, -0.35, 0.25],
          [-0.35, -0.05, 0.1],
        ]),
        color: LOOP_WHITE,
        rad: 0.015,
        hotspot: null,
      },
      {
        curve: makeLoop([
          [0.55, -1.45, 0.25],
          [0.75, -1.15, 0.45],
          [0.55, -0.75, 0.35],
          [0.35, -0.45, 0.2],
        ]),
        color: LOOP_CYAN,
        rad: 0.013,
        hotspot: null,
      },
      {
        curve: makeLoop([
          [-0.55, 0.9, 0.05],
          [-0.95, 0.45, -0.15],
          [-0.85, -0.15, 0.1],
          [-0.5, -0.55, 0.2],
        ]),
        color: LOOP_WHITE,
        rad: 0.014,
        hotspot: null,
      },
      {
        curve: makeLoop([
          [0.2, -0.15, 0.05],
          [0.05, 0.15, 0.25],
          [0.3, 0.2, 0.38],
        ]),
        color: LOOP_CYAN,
        rad: 0.013,
        hotspot: null,
      },
    ],
    []
  );

  const tauExtra =
    kind === "tau" || kind === "both"
      ? makeHelix([0.55, -0.2, 0.35], [-0.2, 0.9, -0.15], 1.1, 0.08, 5.5)
      : null;

  const helixMat = (id: HotspotId | null) => {
    const lit = highlightId !== null && id === highlightId;
    return (
      <meshPhysicalMaterial
        color={HELIX}
        emissive={HELIX_EM}
        emissiveIntensity={lit ? 0.75 : 0.28}
        roughness={0.28}
        metalness={0.22}
        clearcoat={0.5}
        clearcoatRoughness={0.3}
      />
    );
  };

  return (
    <group>
      {helices.map((h, i) => (
        <mesh key={`h-${i}`}>
          <tubeGeometry args={[h.curve, 96, 0.055, 12, false]} />
          {helixMat(h.id)}
        </mesh>
      ))}

      {/* Blue accent patch on upper central helix (reference cue) */}
      <mesh position={[-0.28, 0.85, 0.12]}>
        <sphereGeometry args={[0.07, 14, 14]} />
        <meshStandardMaterial
          color={ACCENT_BLUE}
          emissive={ACCENT_BLUE}
          emissiveIntensity={highlightId === 2 ? 0.85 : 0.45}
        />
      </mesh>

      {sheets.map((geo, i) => (
        <mesh key={`s-${i}`} geometry={geo}>
          <meshPhysicalMaterial
            color={SHEET}
            emissive={SHEET_EM}
            emissiveIntensity={highlightId === 2 ? 0.55 : 0.3}
            roughness={0.38}
            metalness={0.12}
            side={THREE.DoubleSide}
            flatShading
          />
        </mesh>
      ))}

      {loops.map((loop, i) => {
        const lit = highlightId !== null && loop.hotspot === highlightId;
        return (
          <mesh key={`l-${i}`}>
            <tubeGeometry args={[loop.curve, 48, loop.rad * (lit ? 1.35 : 1), 6, false]} />
            <meshStandardMaterial
              color={loop.color}
              emissive={loop.color === LOOP_CYAN ? "#0e7490" : "#334155"}
              emissiveIntensity={lit ? 0.55 : 0.12}
              roughness={0.5}
              metalness={0.05}
            />
          </mesh>
        );
      })}

      {tauExtra ? (
        <mesh>
          <tubeGeometry args={[tauExtra, 80, 0.045, 10, false]} />
          <meshPhysicalMaterial
            color="#8b5cf6"
            emissive="#4c1d95"
            emissiveIntensity={0.4}
            roughness={0.35}
            metalness={0.2}
          />
        </mesh>
      ) : null}
    </group>
  );
}

function HotspotMarkers({
  hotspots,
  activeHotspot,
  hoveredHotspot,
  onHoverHotspot,
  onSelectHotspot,
}: {
  hotspots: PathologyHotspot[];
  activeHotspot: HotspotId | null;
  hoveredHotspot: HotspotId | null;
  onHoverHotspot: (id: HotspotId | null) => void;
  onSelectHotspot: (id: HotspotId) => void;
}) {
  return (
    <>
      {hotspots.map((h) => {
        const lit = activeHotspot === h.id || hoveredHotspot === h.id;
        return (
          <Html key={h.id} position={h.position} center style={{ pointerEvents: "auto" }}>
            <button
              type="button"
              aria-label={`Hotspot ${h.id}`}
              onMouseEnter={() => onHoverHotspot(h.id)}
              onMouseLeave={() => onHoverHotspot(null)}
              onClick={(e) => {
                e.stopPropagation();
                onSelectHotspot(h.id);
              }}
              className={`flex h-7 w-7 items-center justify-center rounded-full border text-[11px] font-semibold transition-colors ${
                lit
                  ? "scale-110 border-white bg-white text-black shadow-[0_0_12px_rgba(255,255,255,0.45)]"
                  : "border-white/80 bg-black/50 text-white hover:bg-white/90 hover:text-black"
              }`}
            >
              {h.id}
            </button>
          </Html>
        );
      })}
    </>
  );
}

function Scene(props: Props) {
  const highlightId = props.hoveredHotspot ?? props.activeHotspot;
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => {
    invalidate();
  }, [highlightId, props.kind, invalidate]);

  return (
    <>
      {/* Fixed framing camera — never animated */}
      <PerspectiveCamera makeDefault position={[0.05, 0.15, 4.1]} fov={34} near={0.01} far={80} />
      <OrbitControls
        makeDefault
        enablePan
        enableZoom
        enableRotate
        /** Critical: no auto-orbit, no inertia after release */
        autoRotate={false}
        enableDamping={false}
        target={[0, 0.05, 0]}
        minDistance={2.2}
        maxDistance={7}
        rotateSpeed={0.65}
        zoomSpeed={0.75}
        panSpeed={0.55}
      />
      <color attach="background" args={[CLEAR]} />
      <ambientLight intensity={0.42} />
      <directionalLight position={[-2.2, 3.5, 2.5]} intensity={1.45} color="#ffffff" />
      <directionalLight position={[2.5, 0.5, -1.5]} intensity={0.35} color="#c4b5fd" />
      <pointLight position={[1.2, 1.5, 1.8]} intensity={0.55} color="#f9a8d4" />

      <Suspense fallback={null}>
        <ProteinModel kind={props.kind} highlightId={highlightId} />
        <HotspotMarkers
          hotspots={props.hotspots}
          activeHotspot={props.activeHotspot}
          hoveredHotspot={props.hoveredHotspot}
          onHoverHotspot={props.onHoverHotspot}
          onSelectHotspot={props.onSelectHotspot}
        />
      </Suspense>
    </>
  );
}

export function AmyloidMolecularCanvas(props: Props) {
  return (
    <div className="h-full w-full bg-black" style={{ backgroundColor: CLEAR }}>
      <Canvas
        className="!block h-full w-full touch-none"
        dpr={[1, 1.75]}
        /** Idle frames do not animate geometry; controls still respond to drag */
        frameloop="demand"
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        onCreated={({ gl, invalidate }) => {
          gl.setClearColor(new THREE.Color(CLEAR), 1);
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.1;
          invalidate();
        }}
      >
        <Scene {...props} />
      </Canvas>
    </div>
  );
}

export default AmyloidMolecularCanvas;
