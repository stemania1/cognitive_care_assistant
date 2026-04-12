import * as THREE from "three";

const SIZE = 512;

function at(h: Float32Array, x: number, y: number): number {
  const xi = ((x % SIZE) + SIZE) % SIZE;
  const yi = ((y % SIZE) + SIZE) % SIZE;
  return h[yi * SIZE + xi];
}

/**
 * Procedural cortical micro-detail: height → tangent-space normal + roughness.
 */
export function createBrainSurfaceTextures(): {
  normalMap: THREE.DataTexture;
  roughnessMap: THREE.DataTexture;
  dispose: () => void;
} {
  const hData = new Float32Array(SIZE * SIZE);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const u = x / SIZE;
      const v = y / SIZE;
      const nx = u * Math.PI * 6;
      const ny = v * Math.PI * 6;
      let h = 0;
      h += Math.sin(nx * 1.1) * Math.cos(ny * 1.05) * 0.45;
      h += Math.sin(nx * 3.2 + ny) * 0.22;
      h += Math.sin(ny * 4.1) * Math.cos(nx * 2.4) * 0.14;
      h += Math.sin((nx + ny) * 5.7) * 0.08;
      h = h * 0.5 + 0.5;
      hData[y * SIZE + x] = h;
    }
  }

  const nPixels = new Uint8Array(SIZE * SIZE * 4);
  const rPixels = new Uint8Array(SIZE * SIZE * 4);
  const s = 1.35;

  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const i = y * SIZE + x;
      const hl = at(hData, x - 1, y);
      const hr = at(hData, x + 1, y);
      const hu = at(hData, x, y - 1);
      const hd = at(hData, x, y + 1);
      const dx = (hr - hl) * s;
      const dy = (hd - hu) * s;
      const nz = 1.0;
      const len = Math.sqrt(dx * dx + dy * dy + nz * nz);
      const nx = -dx / len;
      const ny = -dy / len;
      const nz2 = nz / len;
      const o = i * 4;
      nPixels[o] = Math.floor((nx * 0.5 + 0.5) * 255);
      nPixels[o + 1] = Math.floor((ny * 0.5 + 0.5) * 255);
      nPixels[o + 2] = Math.floor((nz2 * 0.5 + 0.5) * 255);
      nPixels[o + 3] = 255;

      const rough = 0.36 + hData[i] * 0.44;
      const ro = Math.floor(rough * 255);
      rPixels[o] = ro;
      rPixels[o + 1] = ro;
      rPixels[o + 2] = ro;
      rPixels[o + 3] = 255;
    }
  }

  const normalMap = new THREE.DataTexture(nPixels, SIZE, SIZE);
  normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping;
  normalMap.colorSpace = THREE.NoColorSpace;
  normalMap.needsUpdate = true;

  const roughnessMap = new THREE.DataTexture(rPixels, SIZE, SIZE);
  roughnessMap.wrapS = roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.colorSpace = THREE.NoColorSpace;
  roughnessMap.needsUpdate = true;

  return {
    normalMap,
    roughnessMap,
    dispose: () => {
      normalMap.dispose();
      roughnessMap.dispose();
    },
  };
}
