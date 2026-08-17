import * as THREE from "three";

export const SCENE_CLEAR = "#020810";

const cache = new Map<string, THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial>();

function std(key: string, p: THREE.MeshStandardMaterialParameters) {
  const hit = cache.get(key);
  if (hit) return hit as THREE.MeshStandardMaterial;
  const m = new THREE.MeshStandardMaterial(p);
  cache.set(key, m);
  return m;
}

function phys(key: string, p: THREE.MeshPhysicalMaterialParameters) {
  const hit = cache.get(key);
  if (hit) return hit as THREE.MeshPhysicalMaterial;
  const m = new THREE.MeshPhysicalMaterial(p);
  cache.set(key, m);
  return m;
}

export const mats = {
  enclosure: () =>
    phys("enc", {
      color: "#1e293b",
      metalness: 0.25,
      roughness: 0.42,
      clearcoat: 0.35,
      clearcoatRoughness: 0.4,
    }),
  enclosureClear: () =>
    phys("encClear", {
      color: "#94a3b8",
      metalness: 0.1,
      roughness: 0.15,
      transmission: 0.55,
      thickness: 0.4,
      transparent: true,
      opacity: 0.35,
      clearcoat: 1,
    }),
  accent: () =>
    std("accent", {
      color: "#0ea5e9",
      metalness: 0.55,
      roughness: 0.3,
      emissive: "#0369a1",
      emissiveIntensity: 0.2,
    }),
  siliconeBlack: () =>
    phys("siliconeBlk", {
      color: "#1a1a1a",
      metalness: 0,
      roughness: 0.92,
      sheen: 0.35,
      sheenRoughness: 0.7,
      sheenColor: new THREE.Color("#444444"),
    }),
  fr4: () =>
    phys("fr4", {
      color: "#2f6b3a",
      metalness: 0.08,
      roughness: 0.72,
      clearcoat: 0.15,
      clearcoatRoughness: 0.55,
    }),
  /** MyoWare 2.0 cherry-red solder mask */
  fr4Red: () =>
    phys("fr4Red", {
      color: "#c41e3a",
      metalness: 0.12,
      roughness: 0.55,
      clearcoat: 0.35,
      clearcoatRoughness: 0.4,
    }),
  fr4Clear: () =>
    phys("fr4Clear", {
      color: "#86efac",
      metalness: 0.05,
      roughness: 0.2,
      transmission: 0.55,
      thickness: 0.25,
      transparent: true,
      opacity: 0.32,
      clearcoat: 0.8,
    }),
  fr4RedClear: () =>
    phys("fr4RedClear", {
      color: "#fb7185",
      metalness: 0.05,
      roughness: 0.18,
      transmission: 0.5,
      thickness: 0.25,
      transparent: true,
      opacity: 0.32,
      clearcoat: 0.8,
    }),
  lipoFoil: () =>
    phys("lipoFoil", {
      color: "#c5ccd6",
      metalness: 0.85,
      roughness: 0.35,
    }),
  kapton: () =>
    std("kapton", {
      color: "#eab308",
      metalness: 0.05,
      roughness: 0.65,
    }),
  shieldCan: () =>
    phys("shieldCan", {
      color: "#c8d0da",
      metalness: 0.92,
      roughness: 0.22,
      envMapIntensity: 1.05,
    }),
  qwiicWhite: () =>
    std("qwiic", {
      color: "#f1f5f9",
      metalness: 0.05,
      roughness: 0.55,
    }),
  silk: () =>
    std("silk", {
      color: "#f8fafc",
      metalness: 0.05,
      roughness: 0.85,
    }),
  enig: () =>
    phys("enig", {
      color: "#e8c547",
      metalness: 0.95,
      roughness: 0.18,
      envMapIntensity: 1.1,
    }),
  copper: () =>
    phys("copper", {
      color: "#b87333",
      metalness: 0.9,
      roughness: 0.28,
    }),
  epoxy: () =>
    phys("epoxy", {
      color: "#0a0a0a",
      metalness: 0.15,
      roughness: 0.55,
      clearcoat: 0.25,
      clearcoatRoughness: 0.4,
    }),
  stainless: () =>
    phys("stainless", {
      color: "#d5dbe3",
      metalness: 0.95,
      roughness: 0.28,
      clearcoat: 0.15,
    }),
  ledGreen: () =>
    phys("ledG", {
      color: "#22c55e",
      metalness: 0.1,
      roughness: 0.25,
      emissive: "#16a34a",
      emissiveIntensity: 0.85,
      transmission: 0.2,
      transparent: true,
      opacity: 0.9,
    }),
  ledRed: () =>
    phys("ledR", {
      color: "#ef4444",
      metalness: 0.1,
      roughness: 0.25,
      emissive: "#dc2626",
      emissiveIntensity: 0.85,
      transmission: 0.2,
      transparent: true,
      opacity: 0.9,
    }),
  ceramic: () =>
    std("ceramic", {
      color: "#f5f0e6",
      metalness: 0.05,
      roughness: 0.55,
    }),
  ferrite: () =>
    std("ferrite", {
      color: "#3f2a1d",
      metalness: 0.1,
      roughness: 0.7,
    }),
  headerBlack: () =>
    std("hdrBlk", {
      color: "#111827",
      metalness: 0.05,
      roughness: 0.65,
    }),
  silicone: () =>
    phys("silicone", {
      color: "#475569",
      metalness: 0,
      roughness: 0.88,
      sheen: 0.4,
      sheenRoughness: 0.6,
      sheenColor: new THREE.Color("#94a3b8"),
    }),
  pcbRed: () =>
    std("pcbRed", {
      color: "#9f1239",
      metalness: 0.2,
      roughness: 0.45,
    }),
  pcbGreen: () =>
    std("pcbGreen", {
      color: "#15803d",
      metalness: 0.22,
      roughness: 0.48,
    }),
  pcbBlue: () =>
    std("pcbBlue", {
      color: "#1e3a5f",
      metalness: 0.25,
      roughness: 0.48,
    }),
  chip: () =>
    std("chip", {
      color: "#0f172a",
      metalness: 0.45,
      roughness: 0.32,
    }),
  metal: () =>
    phys("metal", {
      color: "#c0c8d4",
      metalness: 0.92,
      roughness: 0.22,
      clearcoat: 0.2,
    }),
  chrome: () =>
    phys("chrome", {
      color: "#e8eef5",
      metalness: 1,
      roughness: 0.12,
      envMapIntensity: 1.2,
    }),
  gold: () =>
    std("gold", {
      color: "#d4a017",
      metalness: 0.92,
      roughness: 0.22,
    }),
  plastic: () =>
    std("plastic", {
      color: "#334155",
      metalness: 0.05,
      roughness: 0.7,
    }),
  cable: () => std("cable", { color: "#1e293b", metalness: 0.08, roughness: 0.72 }),
  cableRed: () => std("cRed", { color: "#b91c1c", metalness: 0.08, roughness: 0.68 }),
  cableYel: () => std("cYel", { color: "#ca8a04", metalness: 0.08, roughness: 0.68 }),
  cableBlu: () => std("cBlu", { color: "#2563eb", metalness: 0.08, roughness: 0.68 }),
  lens: () =>
    phys("lens", {
      color: "#0c4a6e",
      metalness: 0.15,
      roughness: 0.08,
      transmission: 0.35,
      transparent: true,
      opacity: 0.85,
      emissive: "#0369a1",
      emissiveIntensity: 0.2,
    }),
  skin: () =>
    phys("skin", {
      color: "#d4a574",
      metalness: 0,
      roughness: 0.75,
      sheen: 0.3,
      sheenColor: new THREE.Color("#f5d0b0"),
    }),
  gel: () =>
    phys("gel", {
      color: "#e2e8f0",
      metalness: 0.05,
      roughness: 0.35,
      transparent: true,
      opacity: 0.85,
    }),
  selected: () =>
    std("sel", {
      color: "#22d3ee",
      metalness: 0.4,
      roughness: 0.28,
      emissive: "#0891b2",
      emissiveIntensity: 0.55,
    }),
  dimmed: () =>
    std("dim", {
      color: "#1e293b",
      metalness: 0.1,
      roughness: 0.8,
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
    }),
  port: () => std("port", { color: "#0f172a", metalness: 0.65, roughness: 0.35 }),
  usbBlue: () => std("usbB", { color: "#1d4ed8", metalness: 0.3, roughness: 0.45 }),
};

export function disposeMaterialCache() {
  for (const m of cache.values()) m.dispose();
  cache.clear();
}
