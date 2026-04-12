import * as THREE from "three";

const MAX_REGIONS = 16;

export const brainVertexShader = /* glsl */ `
attribute vec4 tangent;
varying vec3 vNormalWorld;
varying vec3 vPosModel;
varying vec3 vColor;
varying vec2 vUv;
varying vec3 vTangentW;
varying vec3 vBitangentW;

void main() {
  vec3 Nw = normalize(mat3(modelMatrix) * normal);
  vec3 Tw = normalize(mat3(modelMatrix) * tangent.xyz);
  Tw = normalize(Tw - dot(Tw, Nw) * Nw);
  vec3 Bw = cross(Nw, Tw) * tangent.w;

  vNormalWorld = Nw;
  vTangentW = Tw;
  vBitangentW = Bw;
  vPosModel = position;
  vColor = color;
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const brainFragmentShader = /* glsl */ `
varying vec3 vNormalWorld;
varying vec3 vPosModel;
varying vec3 vColor;
varying vec2 vUv;
varying vec3 vTangentW;
varying vec3 vBitangentW;

uniform vec3 uAmbient;
uniform vec3 uLightDirWorld;
uniform vec3 uLightColor;
uniform vec3 uRimColor;
uniform float uRimStrength;
uniform vec3 uViewDirWorld;
uniform sampler2D uNormalMap;
uniform sampler2D uRoughnessMap;
uniform float uNormalScale;
uniform float uFissureStrength;
uniform float uRegionSpread;
uniform float uTime;
uniform float uSubsurface;
uniform float uDiffuseGain;
uniform vec3 uAmbientLift;
uniform vec3 uRegionPos[${MAX_REGIONS}];
uniform float uRegionInt[${MAX_REGIONS}];
uniform vec3 uRegionCol[${MAX_REGIONS}];

float regionWeight(vec3 p, vec3 c, float spread) {
  float d = distance(p, c);
  float core = pow(max(0.0, 1.0 - d / (spread * 0.4)), 2.9);
  float halo = pow(max(0.0, 1.0 - d / spread), 1.75);
  return clamp(core * 0.68 + halo * 0.48, 0.0, 1.0);
}

vec3 perturbNormal(vec3 N, vec3 T, vec3 B, vec2 uv) {
  vec3 map = texture2D(uNormalMap, uv).xyz * 2.0 - 1.0;
  map.xy *= uNormalScale;
  mat3 TBN = mat3(T, B, N);
  return normalize(TBN * map);
}

void main() {
  vec3 N0 = normalize(vNormalWorld);
  vec3 T = normalize(vTangentW);
  vec3 B = normalize(vBitangentW);
  vec3 N = uNormalScale > 0.001 ? perturbNormal(N0, T, B, vUv) : N0;

  vec3 L = normalize(uLightDirWorld);
  float rough = texture2D(uRoughnessMap, vUv).r;
  float ndl = max(dot(N, L), 0.0);
  vec3 base = vColor * 1.06;
  vec3 diffuse = base * (uAmbient + uLightColor * ndl) * uDiffuseGain + uAmbientLift;

  vec3 V = normalize(uViewDirWorld);
  vec3 H = normalize(L + V);
  float specPow = mix(48.0, 6.0, rough);
  float spec = pow(max(dot(N, H), 0.0), specPow) * (0.32 + 0.36 * (1.0 - rough));
  vec3 specular = uLightColor * spec * 0.42;

  float rim = pow(1.0 - max(dot(N, V), 0.0), 2.0);
  vec3 rimLight = uRimColor * rim * uRimStrength * 0.92;

  float fres = pow(1.0 - max(dot(N, V), 0.0), 2.1);
  vec3 sssTint = vec3(0.48, 0.22, 0.36);
  vec3 subsurface = sssTint * uSubsurface * fres * 0.38;
  diffuse += subsurface;

  float fiss = smoothstep(0.065, 0.0, abs(vPosModel.x));
  diffuse *= mix(1.0, mix(0.68, 1.0, fiss), uFissureStrength);

  vec3 emit = vec3(0.0);
  for (int i = 0; i < ${MAX_REGIONS}; i++) {
    float w = uRegionInt[i];
    float f = regionWeight(vPosModel, uRegionPos[i], uRegionSpread);
    emit += uRegionCol[i] * w * f;
  }

  float emitPre = length(emit);
  float pulse = 0.94 + 0.06 * sin(uTime * 1.85);
  emit *= pulse * (0.88 + 0.12 * clamp(emitPre, 0.0, 1.0));

  float emitMag = length(emit);
  vec3 innerGlow = vec3(0.1, 0.34, 0.52) * smoothstep(0.04, 0.62, emitMag) * 0.24;

  vec3 col = diffuse + specular + rimLight + emit + innerGlow;
  gl_FragColor = vec4(col, 1.0);
}
`;

export function createClinicalBrainMaterial(
  normalMap: THREE.Texture,
  roughnessMap: THREE.Texture,
  opts?: {
    fissureStrength?: number;
    regionSpread?: number;
    normalScale?: number;
  }
): THREE.ShaderMaterial {
  const empty = new Array(MAX_REGIONS).fill(0).map(() => new THREE.Vector3(0, 0, 0));
  const emptyI = new Float32Array(MAX_REGIONS);
  const emptyC = new Array(MAX_REGIONS).fill(0).map(() => new THREE.Vector3(0.2, 0.4, 0.9));

  normalMap.anisotropy = 4;
  roughnessMap.anisotropy = 4;

  return new THREE.ShaderMaterial({
    uniforms: {
      uAmbient: { value: new THREE.Color(0.1, 0.12, 0.15) },
      uLightDirWorld: { value: new THREE.Vector3(0.38, 0.88, 0.42).normalize() },
      uLightColor: { value: new THREE.Color(0.62, 0.78, 0.96) },
      uRimColor: { value: new THREE.Color(0.26, 0.55, 0.75) },
      uRimStrength: { value: 0.28 },
      uViewDirWorld: { value: new THREE.Vector3(0, 0, 1) },
      uNormalMap: { value: normalMap },
      uRoughnessMap: { value: roughnessMap },
      uNormalScale: { value: opts?.normalScale ?? 0.85 },
      uFissureStrength: { value: opts?.fissureStrength ?? 1 },
      uRegionSpread: { value: opts?.regionSpread ?? 0.4 },
      uTime: { value: 0 },
      uSubsurface: { value: 0.48 },
      uDiffuseGain: { value: 1.2 },
      uAmbientLift: { value: new THREE.Vector3(0.02, 0.028, 0.034) },
      uRegionPos: { value: empty },
      uRegionInt: { value: emptyI },
      uRegionCol: { value: emptyC },
    },
    vertexShader: brainVertexShader,
    fragmentShader: brainFragmentShader,
    vertexColors: true,
    toneMapped: true,
  });
}

export { MAX_REGIONS };
