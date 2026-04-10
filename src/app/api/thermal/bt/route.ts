import { NextRequest, NextResponse } from "next/server";
import { storeThermalData, getThermalData } from "@/lib/thermal-data-store";
import {
  normalizeIncomingThermalPayload,
  validateMinMaxAgainstGrid,
} from "@/lib/thermal-payload-normalize";

export const runtime = "nodejs";

const API_DEBUG =
  process.env.THERMAL_API_DEBUG === "1" || process.env.THERMAL_API_DEBUG === "true";

/**
 * POST endpoint to receive thermal data from Bluetooth or USB serial bridge (MCU → PC → here).
 * Raspberry Pi I2C path does not use this route; it uses GET /api/thermal?ip=... to proxy the Pi.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;

    if (API_DEBUG) {
      const keys = Object.keys(body);
      const preview =
        typeof body.pixels === "object" && Array.isArray(body.pixels)
          ? `[pixels:${(body.pixels as unknown[]).length}]`
          : typeof body.thermal_data === "object"
            ? `[thermal_data rows:${(body.thermal_data as unknown[]).length}]`
            : "";
      console.log("[API thermal/bt] POST received", { keys, preview });
    }

    const normalized = normalizeIncomingThermalPayload(body);
    if (!normalized.ok) {
      console.warn("[API thermal/bt] normalize failed:", normalized.error, {
        keys: Object.keys(body),
      });
      return NextResponse.json({ error: normalized.error }, { status: 400 });
    }

    const thermalData = normalized.data;
    if (
      thermalData.min !== undefined &&
      thermalData.max !== undefined &&
      !validateMinMaxAgainstGrid(thermalData.thermal_data, thermalData.min, thermalData.max)
    ) {
      console.warn("[API thermal/bt] min/max mismatch vs grid (accepted frame)", {
        reportedMin: thermalData.min,
        reportedMax: thermalData.max,
      });
    }

    storeThermalData(thermalData);

    const stored = getThermalData();

    const flat = thermalData.thermal_data.flat();
    const avgTemp = flat.reduce((a, b) => a + b, 0) / flat.length;
    console.log("[API thermal/bt] frame stored", {
      source: "POST",
      gridOk: true,
      avgTemp,
      min: Math.min(...flat),
      max: Math.max(...flat),
      isConnected: stored.isConnected,
      ...(API_DEBUG ? { sensor_info: thermalData.sensor_info } : {}),
    });

    return NextResponse.json(
      {
        status: "received",
        timestamp: Date.now(),
        isConnected: stored.isConnected,
      },
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[API thermal/bt] Error processing thermal data:", message);
    return NextResponse.json(
      {
        error: "Invalid JSON or data format",
        details: message,
      },
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
}

/**
 * GET endpoint to retrieve latest thermal data
 */
export async function GET(_request: NextRequest) {
  try {
    const data = getThermalData();

    if (!data.data) {
      return NextResponse.json(
        {
          status: "no_data",
          isConnected: false,
          data: null,
          timeSinceLastUpdate: Infinity,
        },
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    return NextResponse.json(
      {
        status: "success",
        ...data.data,
        isConnected: data.isConnected,
        timeSinceLastUpdate: data.timeSinceLastUpdate,
        lastUpdateTime: data.lastUpdateTime,
      },
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[API thermal/bt] GET error:", message);
    return NextResponse.json(
      { error: "Failed to get thermal data", details: message },
      { status: 500 }
    );
  }
}
