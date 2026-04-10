import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Lists USB/serial ports (MCU USB CDC bridge for AMG8833 thermal).
 * Used by tooling and optional UI; requires `serialport` on the server.
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
    return NextResponse.json(
      { ports: list },
      {
        status: 200,
        headers: { "Access-Control-Allow-Origin": "*" },
      }
    );
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[API thermal/ports] failed:", message);
    return NextResponse.json(
      { error: "Could not list serial ports", details: message, ports: [] },
      { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }
}
