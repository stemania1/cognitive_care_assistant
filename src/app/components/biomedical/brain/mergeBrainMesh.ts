import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/**
 * Flattens a GLTF scene into one centered, unit-scaled BufferGeometry for clinical shading.
 * Disposes intermediate geometries after merge (caller owns merged geometry lifecycle).
 */
export function buildMergedBrainGeometry(root: THREE.Object3D): {
  geometry: THREE.BufferGeometry;
  hasTangent: boolean;
} {
  const geoms: THREE.BufferGeometry[] = [];
  root.updateWorldMatrix(true, true);
  root.traverse((obj) => {
    if (obj instanceof THREE.Mesh && obj.geometry) {
      const g = obj.geometry.clone();
      const m = new THREE.Matrix4();
      m.copy(obj.matrixWorld);
      g.applyMatrix4(m);
      geoms.push(g);
    }
  });

  if (geoms.length === 0) {
    const empty = new THREE.BufferGeometry();
    return { geometry: empty, hasTangent: false };
  }

  const mergedResult = mergeGeometries(geoms, false);
  let merged: THREE.BufferGeometry;
  if (mergedResult) {
    merged = mergedResult;
  } else {
    merged = geoms[0].clone();
  }
  geoms.forEach((g) => g.dispose());

  merged.computeBoundingBox();
  const box = merged.boundingBox;
  if (!box) {
    return { geometry: merged, hasTangent: false };
  }

  const center = new THREE.Vector3();
  box.getCenter(center);
  const size = new THREE.Vector3();
  box.getSize(size);
  const maxDim = Math.max(size.x, size.y, size.z, 1e-6);
  merged.translate(-center.x, -center.y, -center.z);
  const inv = 1 / maxDim;
  merged.scale(inv, inv, inv);

  const pos = merged.attributes.position;
  const count = pos.count;
  if (!merged.attributes.color) {
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      colors[i * 3] = 0.56;
      colors[i * 3 + 1] = 0.51;
      colors[i * 3 + 2] = 0.53;
    }
    merged.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  }

  if (!merged.attributes.uv) {
    const uv = new Float32Array(count * 2);
    for (let i = 0; i < count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const u = 0.5 + Math.atan2(z, x) / (2 * Math.PI);
      const v = 0.5 - Math.asin(Math.max(-1, Math.min(1, y))) / Math.PI;
      uv[i * 2] = u;
      uv[i * 2 + 1] = v;
    }
    merged.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  }

  merged.computeVertexNormals();

  let hasTangent = false;
  try {
    merged.computeTangents();
    hasTangent = !!merged.attributes.tangent;
  } catch {
    hasTangent = false;
  }

  return { geometry: merged, hasTangent };
}
