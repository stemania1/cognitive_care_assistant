"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { Suspense, useMemo } from "react";
import * as THREE from "three";
import type { MagnificationLevel, PathologyKind } from "./pathologyContent";

const CLEAR = "#030712";

type Props = {
  level: MagnificationLevel;
  kind: PathologyKind;
};

function rnd(i: number, j: number, salt = 0): number {
  const x = Math.sin(i * 12.9898 + j * 78.233 + salt * 19.1) * 43758.5453;
  return x - Math.floor(x);
}

function NeuronField({ showTau }: { showTau: boolean }) {
  const neurons = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => ({
      pos: new THREE.Vector3(
        (rnd(i, 1) - 0.5) * 1.8,
        (rnd(i, 2) - 0.5) * 1.4,
        (rnd(i, 3) - 0.5) * 1.2
      ),
      scale: 0.12 + rnd(i, 4) * 0.08,
      seed: i,
    }));
  }, []);

  return (
    <group>
      {neurons.map((n) => (
        <group key={n.seed} position={n.pos}>
          <mesh>
            <sphereGeometry args={[n.scale, 20, 20]} />
            <meshStandardMaterial
              color="#6b7dff"
              emissive="#312e81"
              emissiveIntensity={0.55}
              roughness={0.4}
            />
          </mesh>
          {Array.from({ length: 4 }).map((_, k) => {
            const ang = (k / 4) * Math.PI * 2 + n.seed;
            const len = n.scale * (2 + rnd(n.seed, k) * 1.5);
            const curve = new THREE.CatmullRomCurve3([
              new THREE.Vector3(0, 0, 0),
              new THREE.Vector3(Math.cos(ang) * len * 0.5, Math.sin(ang) * 0.2, Math.sin(ang) * len * 0.4),
              new THREE.Vector3(Math.cos(ang) * len, Math.sin(ang * 1.2) * 0.35, Math.sin(ang) * len * 0.7),
            ]);
            return (
              <mesh key={k}>
                <tubeGeometry args={[curve, 20, 0.012, 5, false]} />
                <meshStandardMaterial color="#818cf8" emissive="#3730a3" emissiveIntensity={0.35} />
              </mesh>
            );
          })}
          {showTau ? (
            <mesh>
              <torusKnotGeometry args={[n.scale * 0.55, n.scale * 0.12, 64, 8, 2, 3]} />
              <meshStandardMaterial color="#a78bfa" emissive="#5b21b6" emissiveIntensity={0.45} />
            </mesh>
          ) : null}
        </group>
      ))}
    </group>
  );
}

function AmyloidPlaqueCluster({ density }: { density: number }) {
  const fibrils = useMemo(() => {
    const list: THREE.CatmullRomCurve3[] = [];
    const count = Math.floor(14 + density * 16);
    for (let i = 0; i < count; i++) {
      const pts: THREE.Vector3[] = [];
      const base = new THREE.Vector3(
        (rnd(i, 10) - 0.5) * 0.5,
        (rnd(i, 11) - 0.5) * 0.4,
        (rnd(i, 12) - 0.5) * 0.35
      );
      for (let j = 0; j <= 14; j++) {
        const t = j / 14;
        pts.push(
          base
            .clone()
            .add(
              new THREE.Vector3(
                Math.sin(t * 8 + i) * 0.2 * t,
                (t - 0.5) * 0.65 + Math.cos(t * 5 + i) * 0.06,
                Math.cos(t * 7 + i * 0.7) * 0.18 * t
              )
            )
        );
      }
      list.push(new THREE.CatmullRomCurve3(pts));
    }
    return list;
  }, [density]);

  return (
    <group position={[0.05, -0.05, 0.1]}>
      {fibrils.map((curve, i) => (
        <mesh key={i}>
          <tubeGeometry args={[curve, 20, 0.016 + (i % 3) * 0.005, 5, false]} />
          <meshStandardMaterial
            color={i % 2 === 0 ? "#c4a06a" : "#d4b07a"}
            emissive="#8a6230"
            emissiveIntensity={0.28}
            roughness={0.82}
            flatShading
          />
        </mesh>
      ))}
    </group>
  );
}

function SimplifiedBrain() {
  return (
    <group>
      <mesh>
        <sphereGeometry args={[0.85, 48, 36]} />
        <meshStandardMaterial color="#c4b5a5" roughness={0.65} metalness={0.08} />
      </mesh>
      <mesh position={[0, -0.15, 0]} scale={[0.92, 0.78, 1.05]}>
        <sphereGeometry args={[0.85, 32, 24]} />
        <meshStandardMaterial color="#b8a898" roughness={0.7} transparent opacity={0.9} />
      </mesh>
      <mesh position={[0.35, 0.25, 0.55]}>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshBasicMaterial color="#67e8f9" transparent opacity={0.22} />
      </mesh>
    </group>
  );
}

function TissueScene({ level, kind }: Props) {
  const showNeurons = level === "neural_tissue" || level === "amyloid_plaque" || level === "amyloid_fibrils";
  const showPlaque =
    (kind === "amyloid" || kind === "both") &&
    (level === "amyloid_plaque" || level === "amyloid_fibrils" || level === "neural_tissue");
  const showTau = (kind === "tau" || kind === "both") && level !== "whole_brain";
  const plaqueDensity = level === "amyloid_fibrils" ? 1 : level === "amyloid_plaque" ? 0.75 : 0.35;
  const camZ = level === "whole_brain" ? 3.2 : level === "neural_tissue" ? 2.6 : 2.1;

  return (
    <>
      <PerspectiveCamera makeDefault position={[0.4, 0.25, camZ]} fov={40} />
      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        autoRotate={false}
        enableDamping={false}
        minDistance={1.2}
        maxDistance={6}
      />
      <color attach="background" args={[CLEAR]} />
      <ambientLight intensity={0.3} />
      <directionalLight position={[2.5, 3, 2]} intensity={1} />
      <pointLight position={[-1.5, 1, 1.5]} intensity={0.45} color="#93c5fd" />
      <Suspense fallback={null}>
        {level === "whole_brain" ? <SimplifiedBrain /> : null}
        {showNeurons ? <NeuronField showTau={showTau} /> : null}
        {showPlaque ? <AmyloidPlaqueCluster density={plaqueDensity} /> : null}
      </Suspense>
    </>
  );
}

export function PathologyTissueCanvas(props: Props) {
  return (
    <div className="h-full w-full bg-[#030712]">
      <Canvas
        className="!block h-full w-full touch-none"
        dpr={[1, 1.75]}
        frameloop="demand"
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      >
        <TissueScene {...props} />
      </Canvas>
    </div>
  );
}

export default PathologyTissueCanvas;
