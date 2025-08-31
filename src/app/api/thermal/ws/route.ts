import { NextResponse } from "next/server";
import { SENSOR_CONFIG } from "@/app/config/sensor-config";

export const runtime = "nodejs";

// Note: Next.js edge runtime doesn't support raw TCP sockets; we expose the WS URL
export async function GET() {
  const host = process.env.PI_HOST || SENSOR_CONFIG.RASPBERRY_PI_IP;
  const port = process.env.PI_WS_PORT || String(SENSOR_CONFIG.WEBSOCKET_PORT);
  return NextResponse.json({ ws: `ws://${host}:${port}` });
}


