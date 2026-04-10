import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const CORS_HEADERS = { "Access-Control-Allow-Origin": "*" };

/**
 * POST /api/wifi-provision
 *
 * Sends WiFi credentials to a device over USB serial.
 * Only works on localhost where the native `serialport` module is available.
 *
 * Body: { "port": "COM3", "ssid": "MyNetwork", "password": "secret", "baud": 115200 }
 */
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400, headers: CORS_HEADERS });
  }

  const port = typeof body.port === "string" ? body.port.trim() : "";
  const ssid = typeof body.ssid === "string" ? body.ssid.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const baud = typeof body.baud === "number" ? body.baud : 115200;

  if (!port) {
    return NextResponse.json({ ok: false, error: "port is required" }, { status: 400, headers: CORS_HEADERS });
  }
  if (!ssid) {
    return NextResponse.json({ ok: false, error: "ssid is required" }, { status: 400, headers: CORS_HEADERS });
  }

  try {
    const { SerialPort } = await import("serialport");
    const { ReadlineParser } = await import("@serialport/parser-readline");

    const result = await new Promise<{ ok: boolean; msg: string }>((resolve) => {
      const timeout = setTimeout(() => {
        try { sp.close(); } catch {}
        resolve({ ok: false, msg: `No response from device on ${port} within 8s. Is the WiFi listener running?` });
      }, 8000);

      const sp = new SerialPort({ path: port, baudRate: baud, autoOpen: false });
      const parser = sp.pipe(new ReadlineParser({ delimiter: "\n" }));

      sp.on("error", (err) => {
        clearTimeout(timeout);
        resolve({ ok: false, msg: `Serial error: ${err.message}` });
      });

      parser.on("data", (line: string) => {
        try {
          const resp = JSON.parse(line.trim());
          if (resp.cmd === "wifi_config") {
            clearTimeout(timeout);
            try { sp.close(); } catch {}
            resolve({ ok: Boolean(resp.ok), msg: resp.msg || (resp.ok ? "WiFi configured" : "Device error") });
          }
        } catch {
          // not our response line, ignore
        }
      });

      sp.open((err) => {
        if (err) {
          clearTimeout(timeout);
          resolve({ ok: false, msg: `Cannot open ${port}: ${err.message}` });
          return;
        }
        const cmd = JSON.stringify({ cmd: "wifi_config", ssid, password }) + "\n";
        sp.write(cmd, (writeErr) => {
          if (writeErr) {
            clearTimeout(timeout);
            try { sp.close(); } catch {}
            resolve({ ok: false, msg: `Write error: ${writeErr.message}` });
          }
        });
      });
    });

    console.log("[API wifi-provision]", port, ssid, result.ok ? "OK" : "FAIL", result.msg);
    return NextResponse.json(result, { status: result.ok ? 200 : 502, headers: CORS_HEADERS });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    const isNativeUnavailable =
      message.includes("Cannot find module") ||
      message.includes("MODULE_NOT_FOUND") ||
      message.includes("No native build") ||
      message.includes("native build was found") ||
      message.includes("bindings-cpp");

    console.warn("[API wifi-provision]", isNativeUnavailable ? "native module unavailable:" : "error:", message);
    return NextResponse.json(
      {
        ok: false,
        error: isNativeUnavailable
          ? "The serialport native module failed to load. Run `npm rebuild @serialport/bindings-cpp` and restart the dev server."
          : message,
      },
      { status: 200, headers: CORS_HEADERS }
    );
  }
}
