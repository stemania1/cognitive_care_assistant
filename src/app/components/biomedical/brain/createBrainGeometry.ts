import * as THREE from "three";

function gyriNoise(x: number, y: number, z: number): number {
  const sx = x * 5.2;
  const sy = y * 5.2;
  const sz = z * 5.2;
  let n = 0;
  n += Math.sin(sx + sy * 1.38) * Math.cos(sz * 1.15);
  n += 0.5 * Math.sin(sx * 2.2) * Math.sin(sy * 2.45);
  n += 0.28 * Math.cos((sx + sy + sz) * 1.85);
  n += 0.16 * Math.sin(sx * 5.5 + sz * 3.2);
  n += 0.1 * Math.sin(sy * 6.8);
  return Math.tanh(n * 0.9);
}

function lobeTint(x: number, y: number, z: number): THREE.Color {
  const frontal = Math.max(0, y - 0.02) * 0.38;
  const occip = Math.max(0, -z - 0.12) * 0.52;
  const temporal = Math.max(0, Math.abs(x) - 0.18) * 0.28 * Math.max(0, 0.35 - Math.abs(y * 1.2));
  const parietal = Math.max(0, y) * Math.max(0, z - 0.02) * 0.22;
  const r = 0.68 + frontal * 0.12 - occip * 0.08 + temporal * 0.06 + parietal * 0.05;
  const g = 0.54 + occip * 0.1 - frontal * 0.04 + temporal * 0.04;
  const b = 0.62 + occip * 0.12 - temporal * 0.06;
  return new THREE.Color(r, g, b);
}

/**
 * Single high-resolution ellipsoid (clinical MRI-like proportions) with cortical folding,
 * vertex-colored lobe zones, and tangents for normal mapping.
 */
export function createBrainGeometry(): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(1, 320, 256);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const nor = geo.attributes.normal as THREE.BufferAttribute;
  const colors = new Float32Array(pos.count * 3);

  const v = new THREE.Vector3();
  const n = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    n.fromBufferAttribute(nor, i);

    const g = gyriNoise(v.x, v.y, v.z);
    const sag = Math.min(1, Math.abs(v.x) * 4.2);
    const sulcus = Math.exp(-((Math.abs(v.x) - 0.03) ** 2) * 62) * 0.48;
    const temporalSulcus =
      Math.exp(-((Math.abs(v.x) - 0.42) ** 2) * 28) *
      Math.exp(-((v.y + 0.05) ** 2) * 12) *
      0.22;
    const disp =
      (0.052 * g + 0.015 * Math.sin(v.y * 13)) * (0.28 + 0.72 * sag) -
      sulcus * 0.026 -
      temporalSulcus;

    v.addScaledVector(n, disp);
    pos.setXYZ(i, v.x, v.y, v.z);

    const tint = lobeTint(v.x, v.y, v.z);
    colors[i * 3] = tint.r;
    colors[i * 3 + 1] = tint.g;
    colors[i * 3 + 2] = tint.b;
  }

  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  geo.computeTangents();

  return geo;
}
