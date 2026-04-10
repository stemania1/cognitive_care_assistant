import { NextResponse } from "next/server";

export const runtime = "nodejs";

const CORS_HEADERS = { "Access-Control-Allow-Origin": "*" };

/**
 * Lists USB/serial ports (MCU USB CDC bridge for AMG8833 thermal).
 * Only works on localhost where the native `serialport` addon is available.
 * On Vercel (production), returns an empty list with an explanation instead of a 500.
 */
export async function GET() {
  try {
    const { SerialPort } = await import("serialport");
    const ports = await SerialPort.list();
    const list = ports.map((p) => ({
      path: p.path,
      manufacturer: p.manufacturer ?? null,
      serialNumber: p.serialNumber ?? null,
      pnpId: p.pnpId ?? null,
      friendlyName: p.friendlyName ?? null,
    }));
    console.log("[API thermal/ports] detected", list.length, "port(s)");
    return NextResponse.json({ ports: list }, { status: 200, headers: CORS_HEADERS });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    const isModuleMissing =
      message.includes("Cannot find module") ||
      message.includes("not found") ||
      message.includes("MODULE_NOT_FOUND");

    if (isModuleMissing) {
      return NextResponse.json(
        {
          ports: [],
          info: "Serial port scanning is only available when the app runs locally (localhost). The serialport native module is not available in this environment.",
        },
        { status: 200, headers: CORS_HEADERS }
      );
    }

    console.error("[API thermal/ports] failed:", message);
    return NextResponse.json(
      { error: "Could not list serial ports", details: message, ports: [] },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
