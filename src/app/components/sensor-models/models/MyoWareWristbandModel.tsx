"use client";

/**
 * MyoWare 2.0 assembly — geometry guided by product photos (not textured):
 *  1) Triangular red Muscle Sensor with 3 electrode snaps
 *  2) Rectangular red Wireless / Link board (ESP32 shield, LiPo, USB-C, …)
 */

import { useMemo } from "react";
import * as THREE from "three";
import { useSensorViewer } from "../SensorViewerContext";
import { InteractivePart, MBox, MCyl, usePartMat } from "./InteractivePart";
import { mats } from "./materials";

const T = 0.028; // PCB thickness

/** Equilateral triangle: tip-to-tip ≈ 52 mm → scene units */
const TRI_R = 0.58; // centroid → vertex
const SNAP_R = 0.095;

/** Wireless board ≈ 70×36 mm */
const WB_W = 1.4;
const WB_D = 0.72;
const WB_HALF_W = WB_W / 2;
const WB_HALF_D = WB_D / 2;

function roundedRectShape(w: number, d: number, r: number) {
  const shape = new THREE.Shape();
  const hw = w / 2 - r;
  const hd = d / 2 - r;
  shape.moveTo(-hw, -d / 2);
  shape.lineTo(hw, -d / 2);
  shape.quadraticCurveTo(w / 2, -d / 2, w / 2, -hd);
  shape.lineTo(w / 2, hd);
  shape.quadraticCurveTo(w / 2, d / 2, hw, d / 2);
  shape.lineTo(-hw, d / 2);
  shape.quadraticCurveTo(-w / 2, d / 2, -w / 2, hd);
  shape.lineTo(-w / 2, -hd);
  shape.quadraticCurveTo(-w / 2, -d / 2, -hw, -d / 2);
  return shape;
}

function useTrianglePcbGeo() {
  return useMemo(() => {
    const shape = new THREE.Shape();
    const r = 0.11;
    const verts: [number, number][] = [
      [0, TRI_R],
      [TRI_R * Math.sin((2 * Math.PI) / 3), TRI_R * Math.cos((2 * Math.PI) / 3)],
      [TRI_R * Math.sin((4 * Math.PI) / 3), TRI_R * Math.cos((4 * Math.PI) / 3)],
    ];
    // Rounded equilateral triangle via arcs near each vertex
    const inset = (i: number) => {
      const [x0, y0] = verts[i];
      const [x1, y1] = verts[(i + 1) % 3];
      const [x2, y2] = verts[(i + 2) % 3];
      const toPrev = new THREE.Vector2(x2 - x0, y2 - y0).normalize();
      const toNext = new THREE.Vector2(x1 - x0, y1 - y0).normalize();
      return {
        a: new THREE.Vector2(x0 + toPrev.x * r, y0 + toPrev.y * r),
        b: new THREE.Vector2(x0 + toNext.x * r, y0 + toNext.y * r),
        c: new THREE.Vector2(x0, y0),
      };
    };
    const c0 = inset(0);
    const c1 = inset(1);
    const c2 = inset(2);
    shape.moveTo(c0.b.x, c0.b.y);
    shape.lineTo(c1.a.x, c1.a.y);
    shape.quadraticCurveTo(c1.c.x, c1.c.y, c1.b.x, c1.b.y);
    shape.lineTo(c2.a.x, c2.a.y);
    shape.quadraticCurveTo(c2.c.x, c2.c.y, c2.b.x, c2.b.y);
    shape.lineTo(c0.a.x, c0.a.y);
    shape.quadraticCurveTo(c0.c.x, c0.c.y, c0.b.x, c0.b.y);

    // Snap clearance holes (Shape XY — Z flips after rotateX)
    for (const [hx, hy] of snapPositionsShape()) {
      const hole = new THREE.Path();
      hole.absarc(hx, hy, 0.042, 0, Math.PI * 2, true);
      shape.holes.push(hole);
    }

    const g = new THREE.ExtrudeGeometry(shape, {
      depth: T,
      bevelEnabled: true,
      bevelThickness: 0.003,
      bevelSize: 0.003,
      bevelSegments: 1,
      curveSegments: 24,
    });
    g.rotateX(-Math.PI / 2);
    g.translate(0, T / 2, 0);
    g.computeVertexNormals();
    return g;
  }, []);
}

function useWirelessPcbGeo() {
  return useMemo(() => {
    const shape = roundedRectShape(WB_W, WB_D, 0.05);
    for (const [hx, hz] of [
      [0.05, 0.18],
      [-0.38, -0.22],
    ] as const) {
      const hole = new THREE.Path();
      hole.absarc(hx, hz, 0.04, 0, Math.PI * 2, true);
      shape.holes.push(hole);
    }
    const g = new THREE.ExtrudeGeometry(shape, {
      depth: T,
      bevelEnabled: true,
      bevelThickness: 0.003,
      bevelSize: 0.003,
      bevelSegments: 1,
      curveSegments: 12,
    });
    g.rotateX(-Math.PI / 2);
    g.translate(0, T / 2, 0);
    g.computeVertexNormals();
    return g;
  }, []);
}

/**
 * Snap centers in Shape XY (used for PCB holes).
 * After ExtrudeGeometry + rotateX(-π/2), shape (x, y) → world (x, ·, -y).
 */
function snapPositionsShape(): [number, number][] {
  const k = 0.72;
  return [
    [0, TRI_R * k],
    [TRI_R * k * Math.sin((2 * Math.PI) / 3), TRI_R * k * Math.cos((2 * Math.PI) / 3)],
    [TRI_R * k * Math.sin((4 * Math.PI) / 3), TRI_R * k * Math.cos((4 * Math.PI) / 3)],
  ];
}

/** World XZ for snaps — Z flipped to match post-rotation hole locations. */
function snapPositionsWorld(): [number, number, number][] {
  return snapPositionsShape().map(([x, y]) => [x, T * 0.5, -y]);
}

function ElectrodeSnap({
  partId,
  name,
}: {
  partId: string;
  name: string;
}) {
  return (
    <group name={name}>
      {/* Ring on top of PCB */}
      <MCyl partId={partId} args={[SNAP_R, SNAP_R, 0.014, 32]} position={[0, 0.012, 0]} material={mats.stainless()} />
      <MCyl
        partId={partId}
        args={[SNAP_R * 0.62, SNAP_R * 0.62, 0.02, 28]}
        position={[0, 0.022, 0]}
        material={mats.chrome()}
      />
      <MCyl
        partId={partId}
        args={[SNAP_R * 0.38, SNAP_R * 0.38, 0.01, 20]}
        position={[0, 0.03, 0]}
        material={mats.stainless()}
      />
      {/* Through-hole barrel + underside flange */}
      <MCyl
        partId={partId}
        args={[0.038, 0.038, T + 0.01, 16]}
        position={[0, 0, 0]}
        material={mats.chrome()}
      />
      <MCyl
        partId={partId}
        args={[SNAP_R * 1.05, SNAP_R * 1.05, 0.01, 24]}
        position={[0, -0.016, 0]}
        material={mats.stainless()}
      />
    </group>
  );
}

function SilkMark({
  partId,
  position,
  size,
}: {
  partId: string;
  position: [number, number, number];
  size: [number, number, number];
}) {
  return <MBox partId={partId} args={size} position={position} material={mats.silk()} />;
}

function MuscleSensorBoard() {
  const geo = useTrianglePcbGeo();
  const { transparentEnclosure } = useSensorViewer();
  const mat = usePartMat(transparentEnclosure ? mats.fr4RedClear() : mats.fr4Red(), "mw-sensor-pcb");
  const snaps = snapPositionsWorld();
  const yTop = T + 0.002;

  return (
    <group name="MuscleSensor" position={[0, 0.12, -0.85]}>
      <InteractivePart partId="mw-sensor-pcb">
        <mesh name="SensorPCB" geometry={geo} castShadow receiveShadow>
          <primitive object={mat} attach="material" />
        </mesh>
        {/* Center logo plate + flexing-arm mark */}
        <MBox
          partId="mw-sensor-pcb"
          args={[0.22, 0.004, 0.22]}
          position={[0, yTop, 0.02]}
          material={mats.silk()}
        />
        <MBox
          partId="mw-sensor-pcb"
          args={[0.08, 0.005, 0.12]}
          position={[0, yTop + 0.003, 0.02]}
          material={mats.fr4Red()}
        />
        <SilkMark
          partId="mw-sensor-pcb"
          position={[0, yTop, 0.12]}
          size={[0.28, 0.003, 0.028]}
        />
        <SilkMark
          partId="mw-sensor-pcb"
          position={[0, yTop, 0.16]}
          size={[0.22, 0.003, 0.018]}
        />
        {/* Flat-edge gold pads (VIN GND ENV RAW …) — tip is −Z after rotateX */}
        {[-0.16, -0.08, 0, 0.08, 0.16].map((x, i) => (
          <MBox
            key={i}
            partId="mw-sensor-pcb"
            args={[0.05, 0.004, 0.07]}
            position={[x, yTop, 0.38]}
            material={mats.enig()}
          />
        ))}
        {/* Side test points RECT / RAW */}
        <MBox
          partId="mw-sensor-pcb"
          args={[0.035, 0.004, 0.035]}
          position={[-0.32, yTop, 0.05]}
          material={mats.enig()}
        />
        <MBox
          partId="mw-sensor-pcb"
          args={[0.035, 0.004, 0.035]}
          position={[-0.32, yTop, -0.05]}
          material={mats.enig()}
        />
        <SilkMark partId="mw-sensor-pcb" position={[0, yTop, -0.42]} size={[0.06, 0.003, 0.016]} />
      </InteractivePart>

      {/* Positions on InteractivePart so explode lerps from the hole centers */}
      <InteractivePart partId="mw-snap-ref" position={snaps[0]}>
        <ElectrodeSnap partId="mw-snap-ref" name="SnapREF" />
      </InteractivePart>
      <InteractivePart partId="mw-snap-end" position={snaps[1]}>
        <ElectrodeSnap partId="mw-snap-end" name="SnapEND" />
      </InteractivePart>
      <InteractivePart partId="mw-snap-mid" position={snaps[2]}>
        <ElectrodeSnap partId="mw-snap-mid" name="SnapMID" />
      </InteractivePart>
    </group>
  );
}

function HeaderRow({
  partId,
  z,
  count,
  pitch = 0.05,
}: {
  partId: string;
  z: number;
  count: number;
  pitch?: number;
}) {
  const start = -((count - 1) * pitch) / 2;
  return (
    <group>
      {Array.from({ length: count }, (_, i) => (
        <MCyl
          key={i}
          partId={partId}
          args={[0.012, 0.012, 0.006, 10]}
          position={[start + i * pitch, T + 0.002, z]}
          material={mats.enig()}
        />
      ))}
    </group>
  );
}

function WirelessBoard() {
  const geo = useWirelessPcbGeo();
  const { transparentEnclosure } = useSensorViewer();
  const mat = usePartMat(transparentEnclosure ? mats.fr4RedClear() : mats.fr4Red(), "mw-link-pcb");
  const yTop = T + 0.002;

  return (
    <group name="WirelessBoard" position={[0, 0, 0.55]}>
      <InteractivePart partId="mw-link-pcb">
        <mesh name="LinkPCB" geometry={geo} castShadow receiveShadow>
          <primitive object={mat} attach="material" />
        </mesh>
        <HeaderRow partId="mw-link-pcb" z={WB_HALF_D - 0.06} count={14} pitch={0.08} />
        <HeaderRow partId="mw-link-pcb" z={-(WB_HALF_D - 0.06)} count={14} pitch={0.08} />
        {/* Mate snaps / pads on link board */}
        <MCyl
          partId="mw-link-pcb"
          args={[0.09, 0.09, 0.01, 28]}
          position={[0.05, yTop, 0.18]}
          material={mats.stainless()}
        />
        <MCyl
          partId="mw-link-pcb"
          args={[0.09, 0.09, 0.01, 28]}
          position={[-0.38, yTop, -0.22]}
          material={mats.stainless()}
        />
        <SilkMark partId="mw-link-pcb" position={[-0.15, yTop, 0.05]} size={[0.2, 0.003, 0.02]} />
        <SilkMark partId="mw-link-pcb" position={[0.2, yTop, -0.28]} size={[0.16, 0.003, 0.016]} />
        {/* Small power ICs near USB side */}
        <MBox
          partId="mw-link-pcb"
          args={[0.08, 0.02, 0.06]}
          position={[-0.45, T + 0.012, 0.05]}
          material={mats.epoxy()}
        />
        <MBox
          partId="mw-link-pcb"
          args={[0.06, 0.016, 0.045]}
          position={[-0.45, T + 0.01, -0.08]}
          material={mats.epoxy()}
        />
      </InteractivePart>

      <InteractivePart partId="mw-esp32" position={[0.32, T + 0.02, 0.02]}>
        <group name="ESP32Module">
          {/* Module substrate */}
          <MBox partId="mw-esp32" args={[0.52, 0.02, 0.42]} material={mats.fr4()} />
          {/* RF shield can */}
          <MBox
            partId="mw-esp32"
            args={[0.48, 0.055, 0.38]}
            position={[0, 0.035, 0]}
            material={mats.shieldCan()}
          />
          {/* Antenna keepout strip */}
          <MBox
            partId="mw-esp32"
            args={[0.48, 0.008, 0.06]}
            position={[0, 0.012, -0.22]}
            material={mats.ceramic()}
          />
        </group>
      </InteractivePart>

      <InteractivePart partId="mw-battery" position={[0.28, T + 0.035, -0.22]}>
        <group name="LiPo">
          <MBox partId="mw-battery" args={[0.42, 0.06, 0.22]} material={mats.lipoFoil()} />
          <MBox
            partId="mw-battery"
            args={[0.08, 0.062, 0.22]}
            position={[-0.18, 0, 0]}
            material={mats.kapton()}
          />
          <MBox
            partId="mw-battery"
            args={[0.08, 0.062, 0.22]}
            position={[0.18, 0, 0]}
            material={mats.kapton()}
          />
          {/* Twisted leads → JST */}
          <MBox
            partId="mw-battery"
            args={[0.22, 0.012, 0.012]}
            position={[-0.32, 0, 0.04]}
            material={mats.cableRed()}
          />
          <MBox
            partId="mw-battery"
            args={[0.22, 0.012, 0.012]}
            position={[-0.32, 0, -0.02]}
            material={mats.cable()}
          />
          <MBox
            partId="mw-battery"
            args={[0.06, 0.035, 0.05]}
            position={[-0.48, 0, 0.01]}
            material={mats.qwiicWhite()}
          />
        </group>
      </InteractivePart>

      <InteractivePart partId="mw-usbc" position={[-WB_HALF_W + 0.02, T + 0.015, 0]}>
        <group name="USBC">
          <MBox partId="mw-usbc" args={[0.08, 0.035, 0.12]} material={mats.metal()} />
          <MBox
            partId="mw-usbc"
            args={[0.04, 0.02, 0.09]}
            position={[-0.03, 0, 0]}
            material={mats.port()}
          />
        </group>
      </InteractivePart>

      <InteractivePart partId="mw-switches" position={[-0.35, T + 0.02, 0.22]}>
        <group name="Switches">
          {/* POWER SOURCE slide */}
          <MBox partId="mw-switches" args={[0.1, 0.028, 0.06]} material={mats.headerBlack()} />
          <MBox
            partId="mw-switches"
            args={[0.035, 0.02, 0.035]}
            position={[0.02, 0.012, 0]}
            material={mats.epoxy()}
          />
          {/* Edge power switch */}
          <MBox
            partId="mw-switches"
            args={[0.05, 0.03, 0.08]}
            position={[-0.28, 0, -0.15]}
            material={mats.headerBlack()}
          />
          <MBox
            partId="mw-switches"
            args={[0.02, 0.018, 0.035]}
            position={[-0.3, 0.01, -0.15]}
            material={mats.epoxy()}
          />
          {/* BOOT / RST tactiles */}
          <MBox
            partId="mw-switches"
            args={[0.05, 0.025, 0.05]}
            position={[0.15, 0, -0.35]}
            material={mats.headerBlack()}
          />
          <MBox
            partId="mw-switches"
            args={[0.05, 0.025, 0.05]}
            position={[0.28, 0, -0.35]}
            material={mats.headerBlack()}
          />
        </group>
      </InteractivePart>

      <InteractivePart partId="mw-qwiic" position={[-WB_HALF_W + 0.04, T + 0.018, 0.28]}>
        <group name="Qwiic">
          <MBox partId="mw-qwiic" args={[0.1, 0.035, 0.08]} material={mats.qwiicWhite()} />
          <MBox
            partId="mw-qwiic"
            args={[0.1, 0.035, 0.08]}
            position={[WB_W - 0.08, 0, -0.08]}
            material={mats.qwiicWhite()}
          />
        </group>
      </InteractivePart>
    </group>
  );
}

/** MyoWare 2.0 Muscle Sensor + Wireless board (board-only visualization). */
export function MyoWareWristbandModel() {
  return (
    <group name="MyoWareAssembly">
      <MuscleSensorBoard />
      <WirelessBoard />
    </group>
  );
}
