/**
 * Normalize thermal payloads from USB serial / Bluetooth / Pi into the app's canonical shape.
 * Supports `thermal_data` (8×8), `pixels` or `values` (64 floats row-major), and `data` (8×8) alias.
 * Line-oriented CSV is parsed in scripts/thermal-serial-line.cjs before POST.
 */

export const THERMAL_GRID = { width: 8, height: 8 } as const;
const CELL_COUNT = THERMAL_GRID.width * THERMAL_GRID.height;

export interface CanonicalThermalPayload {
  type: string;
  timestamp: number;
  thermal_data: number[][];
  sensor_info: Record<string, unknown>;
  grid_size: { width: number; height: number };
  status?: string;
  min?: number;
  max?: number;
}

function isFiniteNumber(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

/** Row-major flat 64 → 8×8 (matches AMG8833 Adafruit row order). */
export function pixelsToGrid(pixels: number[]): number[][] {
  const grid: number[][] = [];
  for (let row = 0; row < THERMAL_GRID.height; row++) {
    const line: number[] = [];
    for (let col = 0; col < THERMAL_GRID.width; col++) {
      line.push(pixels[row * THERMAL_GRID.width + col]);
    }
    grid.push(line);
  }
  return grid;
}

function validateGrid(grid: unknown): grid is number[][] {
  if (!Array.isArray(grid) || grid.length !== THERMAL_GRID.height) return false;
  for (const row of grid) {
    if (!Array.isArray(row) || row.length !== THERMAL_GRID.width) return false;
    for (const v of row) {
      if (!isFiniteNumber(v)) return false;
    }
  }
  return true;
}

export function normalizeIncomingThermalPayload(body: Record<string, unknown>): {
  ok: true;
  data: CanonicalThermalPayload;
} | { ok: false; error: string } {
  let thermal_data: number[][] | null = null;

  if (body.thermal_data !== undefined) {
    const g = body.thermal_data;
    if (validateGrid(g)) {
      thermal_data = g.map((row) => [...row]);
    } else {
      return { ok: false, error: "thermal_data must be an 8×8 array of finite numbers" };
    }
  } else if (body.data !== undefined && body.thermal_data === undefined) {
    const g = body.data;
    if (validateGrid(g)) {
      thermal_data = g.map((row) => [...row]);
    }
  }

  if (!thermal_data && body.pixels !== undefined) {
    const px = body.pixels;
    if (!Array.isArray(px) || px.length !== CELL_COUNT) {
      return { ok: false, error: `pixels must be an array of length ${CELL_COUNT}` };
    }
    const nums: number[] = [];
    for (let i = 0; i < px.length; i++) {
      const v = px[i];
      const n = typeof v === "number" ? v : typeof v === "string" ? parseFloat(v) : NaN;
      if (!Number.isFinite(n)) {
        return { ok: false, error: `pixels[${i}] is not a finite number` };
      }
      nums.push(n);
    }
    thermal_data = pixelsToGrid(nums);
  }

  if (!thermal_data && body.values !== undefined) {
    const px = body.values;
    if (!Array.isArray(px) || px.length !== CELL_COUNT) {
      return { ok: false, error: `values must be an array of length ${CELL_COUNT}` };
    }
    const nums: number[] = [];
    for (let i = 0; i < px.length; i++) {
      const v = px[i];
      const n = typeof v === "number" ? v : typeof v === "string" ? parseFloat(v) : NaN;
      if (!Number.isFinite(n)) {
        return { ok: false, error: `values[${i}] is not a finite number` };
      }
      nums.push(n);
    }
    thermal_data = pixelsToGrid(nums);
  }

  if (!thermal_data) {
    return { ok: false, error: "Missing valid thermal_data, data (8×8), pixels (64), or values (64)" };
  }

  const flat = thermal_data.flat();
  const computedMin = Math.min(...flat);
  const computedMax = Math.max(...flat);

  let ts: number;
  if (body.timestamp === undefined || body.timestamp === null) {
    ts = Date.now();
  } else if (typeof body.timestamp === "string") {
    ts = new Date(body.timestamp).getTime();
    if (!Number.isFinite(ts)) ts = Date.now();
  } else if (typeof body.timestamp === "number" && Number.isFinite(body.timestamp)) {
    ts = body.timestamp < 1e12 ? body.timestamp * 1000 : body.timestamp;
  } else {
    ts = Date.now();
  }

  const sensorName =
    typeof body.sensor === "string" ? body.sensor : undefined;
  const baseInfo =
    body.sensor_info && typeof body.sensor_info === "object" && body.sensor_info !== null
      ? { ...(body.sensor_info as Record<string, unknown>) }
      : {};

  if (sensorName && !baseInfo.model) {
    baseInfo.model = sensorName;
  }
  if (!baseInfo.model) {
    baseInfo.model = "AMG8833";
  }
  baseInfo.temperature_unit = baseInfo.temperature_unit ?? "C";
  baseInfo.data_source = baseInfo.data_source ?? "usb_serial";

  const outMin = isFiniteNumber(body.min) ? body.min : computedMin;
  const outMax = isFiniteNumber(body.max) ? body.max : computedMax;

  const data: CanonicalThermalPayload = {
    type: typeof body.type === "string" ? body.type : "thermal_data",
    timestamp: ts,
    thermal_data,
    sensor_info: baseInfo,
    grid_size:
      body.grid_size &&
      typeof body.grid_size === "object" &&
      body.grid_size !== null &&
      "width" in body.grid_size &&
      "height" in body.grid_size
        ? {
            width: Number((body.grid_size as { width: unknown }).width) || THERMAL_GRID.width,
            height: Number((body.grid_size as { height: unknown }).height) || THERMAL_GRID.height,
          }
        : { ...THERMAL_GRID },
    status: typeof body.status === "string" ? body.status : "active",
    min: outMin,
    max: outMax,
  };

  return { ok: true, data };
}

/** Optional integrity check: min/max vs grid (tolerance for float noise). */
export function validateMinMaxAgainstGrid(
  grid: number[][],
  minVal: number | undefined,
  maxVal: number | undefined,
  tolerance = 0.5
): boolean {
  if (minVal === undefined || maxVal === undefined) return true;
  const flat = grid.flat();
  const cmin = Math.min(...flat);
  const cmax = Math.max(...flat);
  return (
    Math.abs(cmin - minVal) <= tolerance && Math.abs(cmax - maxVal) <= tolerance
  );
}
