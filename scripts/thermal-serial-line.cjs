/**
 * Shared line parser for AMG8833 USB-serial bridges (Node scripts).
 * Keep behavior aligned with src/lib/thermal-payload-normalize.ts (pixels / thermal_data).
 *
 * Supported per line:
 * - Single JSON object (newline-delimited), e.g. { "pixels": [...64], "sensor": "AMG8833" }
 * - 64 comma-, semicolon-, or whitespace-separated floats (row-major 8×8)
 * - Optional prefix "THERMAL:" stripped before parsing
 */

const CELL_COUNT = 64;

/**
 * @param {string} line
 * @returns {Record<string, unknown> | null} Payload suitable for POST /api/thermal/bt (after JSON.stringify)
 */
function parseThermalSerialLine(line) {
  const t = String(line).replace(/^\uFEFF/, "").trim();
  if (!t) return null;

  let s = t;
  const thermalPrefix = s.match(/^\s*THERMAL\s*:\s*/i);
  if (thermalPrefix) s = s.slice(thermalPrefix[0].length).trim();

  if (s.startsWith("{")) {
    try {
      const o = JSON.parse(s);
      return typeof o === "object" && o !== null && !Array.isArray(o) ? o : null;
    } catch {
      return null;
    }
  }

  const sep = s.includes(";") && !s.includes(",") ? ";" : s.includes(",") ? "," : null;
  let parts;
  if (sep) {
    parts = s.split(sep).map((x) => x.trim()).filter((x) => x.length > 0);
  } else {
    parts = s.split(/\s+/).filter((x) => x.length > 0);
  }

  if (parts.length === CELL_COUNT) {
    const nums = parts.map((p) => parseFloat(p));
    if (nums.every((n) => Number.isFinite(n))) {
      return {
        sensor: "AMG8833",
        pixels: nums,
        timestamp: Date.now(),
      };
    }
  }

  return null;
}

/**
 * @param {unknown} obj
 */
function looksLikeThermalPayload(obj) {
  if (!obj || typeof obj !== "object") return false;
  const o = obj;
  if (o.type === "thermal_data") return true;
  if (Array.isArray(o.pixels) && o.pixels.length === CELL_COUNT) return true;
  if (Array.isArray(o.values) && o.values.length === CELL_COUNT) return true;
  if (Array.isArray(o.thermal_data) && o.thermal_data.length === 8) return true;
  return false;
}

module.exports = {
  parseThermalSerialLine,
  looksLikeThermalPayload,
  CELL_COUNT,
};
