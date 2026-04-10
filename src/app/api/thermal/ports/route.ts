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
    const isNativeUnavailable =
      message.includes("Cannot find module") ||
      message.includes("MODULE_NOT_FOUND") ||
      message.includes("No native build") ||
      message.includes("native build was found") ||
      message.includes("bindings-cpp");

    console.warn("[API thermal/ports]", isNativeUnavailable ? "native module unavailable:" : "error:", message);

    return NextResponse.json(
      {
        ports: [],
        info: isNativeUnavailable
          ? "Serial port scanning requires the native serialport module. Run `npm rebuild @serialport/bindings-cpp` and restart the dev server."
          : `Could not list serial ports: ${message}`,
      },
      { status: 200, headers: CORS_HEADERS }
    );
  }
}
