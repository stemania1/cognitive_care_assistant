"use client";

import { useSensorViewer } from "../SensorViewerContext";
import { InteractivePart, MBox, MCyl, usePartMat } from "./InteractivePart";
import { mats } from "./materials";
import { CAD_PATHS, CadAsset } from "./CadAsset";
import { Suspense } from "react";

function ShellBox({
  partId,
  args,
  position,
}: {
  partId: string;
  args: [number, number, number];
  position?: [number, number, number];
}) {
  const { transparentEnclosure } = useSensorViewer();
  const mat = usePartMat(transparentEnclosure ? mats.enclosureClear() : mats.enclosure(), partId);
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={args} />
      <primitive object={mat} attach="material" />
    </mesh>
  );
}

/** Photo-guided CAD placeholder for Pi + AMG8833 enclosure (swap for GLB via MODEL_PATHS). */
export function RaspberryPiEnclosureModel() {
  const piY = 0.02;

  return (
    <group>
      <InteractivePart partId="th-base" position={[0, -0.42, 0]}>
        <MBox partId="th-base" args={[2.35, 0.1, 1.85]} material={mats.enclosure()} />
        <MBox
          partId="th-base"
          args={[2.4, 0.03, 1.9]}
          position={[0, 0.06, 0]}
          material={mats.accent()}
        />
      </InteractivePart>

      <InteractivePart partId="th-enclosure" position={[0, -0.05, 0]}>
        <ShellBox partId="th-enclosure" args={[2.4, 0.55, 0.08]} position={[0, 0.2, -0.9]} />
        <ShellBox partId="th-enclosure" args={[2.4, 0.55, 0.08]} position={[0, 0.2, 0.9]} />
        <ShellBox partId="th-enclosure" args={[0.08, 0.55, 1.72]} position={[-1.16, 0.2, 0]} />
        <ShellBox partId="th-enclosure" args={[0.08, 0.55, 1.72]} position={[1.16, 0.2, 0]} />
      </InteractivePart>

      <InteractivePart partId="th-vents" position={[1.18, 0.15, 0]}>
        {[-0.45, -0.22, 0, 0.22, 0.45].map((z, i) => (
          <MBox
            key={i}
            partId="th-vents"
            args={[0.05, 0.32, 0.1]}
            position={[0, 0.05, z]}
            material={mats.metal()}
          />
        ))}
      </InteractivePart>

      <InteractivePart partId="th-lid" position={[0, 0.52, 0]}>
        <ShellBox partId="th-lid" args={[2.42, 0.09, 1.92]} />
        <MBox
          partId="th-lid"
          args={[0.55, 0.04, 0.55]}
          position={[0.32, 0.06, 0.38]}
          material={mats.accent()}
        />
        <MBox
          partId="th-lid"
          args={[0.4, 0.05, 0.4]}
          position={[0.32, 0.04, 0.38]}
          material={mats.port()}
        />
        <MCyl
          partId="th-lid"
          args={[0.035, 0.035, 0.025, 16]}
          position={[0.95, 0.06, -0.7]}
          material={mats.accent()}
        />
        {[
          [-1.05, -0.75],
          [1.05, -0.75],
          [-1.05, 0.75],
          [1.05, 0.75],
        ].map(([x, z], i) => (
          <MCyl
            key={i}
            partId="th-lid"
            args={[0.03, 0.03, 0.02, 10]}
            position={[x, 0.06, z]}
            material={mats.metal()}
          />
        ))}
      </InteractivePart>

      <InteractivePart partId="th-standoffs" position={[0, -0.2, -0.1]}>
        {[
          [-0.7, -0.45],
          [0.7, -0.45],
          [-0.7, 0.4],
          [0.7, 0.4],
        ].map(([x, z], i) => (
          <group key={i} position={[x, 0, z]}>
            <MCyl partId="th-standoffs" args={[0.045, 0.045, 0.22, 12]} material={mats.metal()} />
            <MCyl
              partId="th-standoffs"
              args={[0.03, 0.03, 0.04, 10]}
              position={[0, 0.12, 0]}
              material={mats.chrome()}
            />
          </group>
        ))}
      </InteractivePart>

      <InteractivePart partId="th-pi" position={[0, piY, -0.1]}>
        <Suspense fallback={null}>
          <CadAsset url={CAD_PATHS.raspberryPi} partId="th-pi" />
        </Suspense>
      </InteractivePart>

      <InteractivePart partId="th-mount" position={[0.55, 0.35, 0.55]}>
        <MBox partId="th-mount" args={[0.55, 0.04, 0.45]} material={mats.metal()} />
        {[
          [-0.2, -0.16],
          [0.2, -0.16],
          [-0.2, 0.16],
          [0.2, 0.16],
        ].map(([x, z], i) => (
          <MCyl
            key={i}
            partId="th-mount"
            args={[0.025, 0.025, 0.12, 10]}
            position={[x, 0.07, z]}
            material={mats.chrome()}
          />
        ))}
      </InteractivePart>

      <InteractivePart partId="th-amg" position={[0.55, 0.42, 0.55]}>
        <MBox partId="th-amg" args={[0.48, 0.03, 0.4]} material={mats.pcbBlue()} />
        {[-0.14, -0.07, 0, 0.07, 0.14].map((z, i) => (
          <MCyl
            key={i}
            partId="th-amg"
            args={[0.015, 0.015, 0.025, 8]}
            position={[-0.2, 0.025, z]}
            material={mats.gold()}
          />
        ))}
        <Suspense fallback={null}>
          <CadAsset url={CAD_PATHS.amg8833} partId="th-amg" position={[0.02, 0.015, 0]} />
        </Suspense>
      </InteractivePart>

      <InteractivePart partId="th-wiring" position={[0.15, 0.28, 0.15]}>
        <MCyl
          partId="th-wiring"
          args={[0.016, 0.016, 0.7, 8]}
          rotation={[0.35, 0, Math.PI / 3.5]}
          material={mats.cableRed()}
        />
        <MCyl
          partId="th-wiring"
          args={[0.016, 0.016, 0.7, 8]}
          position={[0.04, 0, 0.03]}
          rotation={[0.35, 0, Math.PI / 3.5]}
          material={mats.cable()}
        />
        <MCyl
          partId="th-wiring"
          args={[0.016, 0.016, 0.65, 8]}
          position={[0.08, 0.02, 0.06]}
          rotation={[0.3, 0, Math.PI / 3.8]}
          material={mats.cableYel()}
        />
        <MCyl
          partId="th-wiring"
          args={[0.016, 0.016, 0.65, 8]}
          position={[0.12, 0.03, 0.08]}
          rotation={[0.28, 0, Math.PI / 4]}
          material={mats.cableBlu()}
        />
      </InteractivePart>
    </group>
  );
}
