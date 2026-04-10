/**
 * USB Serial Thermal Receiver — AMG8833 via MCU/I2C bridge → USB CDC → POST /api/thermal/bt → CCA UI
 *
 * Same pipeline as before: serial frames are normalized server-side and polled by the frontend in USB serial mode.
 *
 * Env (.env / .env.local):
 *   THERMAL_INPUT_MODE=usb | usb_serial   (aliases; default usb_serial)
 *   SERIAL_PORT=auto | COMx              (auto = scan, empty same as auto)
 *   BAUD_RATE=115200                     (manual run; auto-detect may override after probe)
 *   THERMAL_PROBE_BAUDS=115200,9600,57600
 *   THERMAL_PROBE_MS=6000                (longer if firmware is slow)
 *   DEBUG_THERMAL=1 | THERMAL_USB_DEBUG=1
 *   THERMAL_USB_LOG_RAW=1
 *   THERMAL_SERIAL_DELIMITER=lf|crlf|cr  (default lf = \n)
 *   NEXTJS_API_URL=http://127.0.0.1:3000/api/thermal/bt
 *   THERMAL_FALLBACK_SERIAL_PORT=COM3   If auto-detect finds no JSON/CSV frame, still open this port (use with THERMAL_USB_LOG_RAW=1)
 *
 * Root cause note: `npm run dev` also starts bluetooth-thermal-receiver.js, which opens COM ports.
 * For USB-only, prefer: `npm run dev:next` in one terminal + `npm run thermal:usb` in another,
 * or `npm run dev:thermal-usb` (Next + this script, no Bluetooth receiver).
 */

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });

const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");
const {
  parseThermalSerialLine,
  looksLikeThermalPayload,
} = require("../scripts/thermal-serial-line.cjs");
const { sortPortsUsbLikelyFirst, parseProbeBauds } = require("../scripts/thermal-usb-probe.cjs");

function isTruthyEnv(v) {
  if (v === undefined || v === null) return false;
  const s = String(v).trim().toLowerCase();
  return s === "1" || s === "true" || s === "yes";
}

const INPUT_MODE_RAW = (process.env.THERMAL_INPUT_MODE || "usb_serial").trim().toLowerCase();
const INPUT_MODE_OK = INPUT_MODE_RAW === "usb" || INPUT_MODE_RAW === "usb_serial";
if (!INPUT_MODE_OK) {
  console.warn(
    `[thermal-usb] THERMAL_INPUT_MODE="${process.env.THERMAL_INPUT_MODE}" — use "usb" or "usb_serial" for this script`
  );
}

function resolveThermalApiUrl() {
  const raw = process.env.NEXTJS_API_URL || "http://127.0.0.1:3000/api/thermal/bt";
  if (raw.includes("localhost")) {
    return raw.replace(/localhost/g, "127.0.0.1");
  }
  return raw;
}
const NEXTJS_API_URL = resolveThermalApiUrl();

let SERIAL_PORT = process.argv[2] || process.env.SERIAL_PORT || "";
{
  const sp = String(SERIAL_PORT).trim().toLowerCase();
  if (sp === "" || sp === "auto") SERIAL_PORT = "";
}

const argvBaud = process.argv[3] ? parseInt(process.argv[3], 10) : NaN;
const DEFAULT_BAUD =
  (Number.isFinite(argvBaud) && argvBaud > 0
    ? argvBaud
    : parseInt(process.env.BAUD_RATE || process.env.THERMAL_SERIAL_BAUD || "115200", 10)) || 115200;

const LOG_RAW = isTruthyEnv(process.env.THERMAL_USB_LOG_RAW);
const DEBUG = isTruthyEnv(process.env.DEBUG_THERMAL) || isTruthyEnv(process.env.THERMAL_USB_DEBUG);
const PROBE_MS = Math.max(1000, parseInt(process.env.THERMAL_PROBE_MS || "6000", 10) || 6000);
const RECONNECT_DELAY_MS = parseInt(process.env.THERMAL_RECONNECT_MS || "5000", 10) || 5000;
const PROBE_BAUDS = parseProbeBauds();

function getReadlineDelimiter() {
  const d = (process.env.THERMAL_SERIAL_DELIMITER || "lf").trim().toLowerCase();
  if (d === "crlf" || d === "rn" || d === "\\r\\n") return "\r\n";
  if (d === "cr" || d === "r" || d === "\\r") return "\r";
  return "\n";
}
const READLINE_DELIM = getReadlineDelimiter();

function logDebug(...args) {
  if (DEBUG) console.log("[thermal-usb:debug]", ...args);
}

function serialOpts(pathName, baud) {
  return {
    path: pathName,
    baudRate: baud || DEFAULT_BAUD,
    dataBits: 8,
    stopBits: 1,
    parity: "none",
    rtscts: false,
    xon: false,
    xoff: false,
    autoOpen: false,
  };
}

function looksLikeThermalJson(obj) {
  return looksLikeThermalPayload(obj);
}

function formatPortLine(p) {
  return {
    path: p.path,
    manufacturer: p.manufacturer ?? null,
    serialNumber: p.serialNumber ?? null,
    vendorId: p.vendorId ?? null,
    productId: p.productId ?? null,
    pnpId: p.pnpId ?? null,
    friendlyName: p.friendlyName ?? null,
  };
}

async function printDetailedPorts() {
  const ports = await SerialPort.list();
  console.log("[thermal-usb] detected serial ports (" + ports.length + "):");
  for (const p of ports) {
    console.log("  ", JSON.stringify(formatPortLine(p)));
  }
  console.log(
    "[thermal-usb] probe order: USB-like ports first (vendorId / known adapter names), then others.\n" +
      "[thermal-usb] if another app (e.g. bluetooth-thermal-receiver from `npm run dev`) holds a COM port, close it or use `npm run dev:next` + `npm run thermal:usb`.\n"
  );
  return ports;
}

async function testPort(portName, baud, delimOverride) {
  const delim = delimOverride !== undefined ? delimOverride : READLINE_DELIM;
  return new Promise((resolve) => {
    const probePort = new SerialPort({ ...serialOpts(portName, baud), autoOpen: false });
    const parser = probePort.pipe(new ReadlineParser({ delimiter: delim }));
    let finished = false;
    let timeout;

    const done = (result) => {
      if (finished) return;
      finished = true;
      clearTimeout(timeout);
      try {
        probePort.close(() => resolve(result));
      } catch (_) {
        resolve(result);
      }
    };

    parser.on("data", (line) => {
      const trimmed = String(line).trim();
      if (!trimmed) return;
      let data = null;
      try {
        if (trimmed.startsWith("{")) data = JSON.parse(trimmed);
      } catch (_) {
        return;
      }
      if (!data) {
        const parsed = parseThermalSerialLine(trimmed);
        if (parsed && looksLikeThermalJson(parsed)) data = parsed;
      }
      if (data && looksLikeThermalJson(data)) {
        logDebug(`probe hit thermal frame on ${portName} @ ${baud}`);
        done(true);
      }
    });

    probePort.on("error", (err) => {
      logDebug(`probe error ${portName} @ ${baud}:`, err.message);
      done(false);
    });

    probePort.on("open", () => {
      timeout = setTimeout(() => {
        logDebug(`probe timeout ${portName} @ ${baud} delim=${JSON.stringify(delim)} (${PROBE_MS}ms, no valid frame)`);
        done(false);
      }, PROBE_MS);
    });

    probePort.open((err) => {
      if (err) {
        logDebug(`probe cannot open ${portName} @ ${baud}:`, err.message);
        done(false);
      }
    });
  });
}

/**
 * Raw listen (no line parser) — see if *anything* arrives (binary vs silent).
 * @returns {Promise<{ byteLength: number; hex: string; ascii: string }>}
 */
async function sniffRawBytes(portName, baud, ms) {
  return new Promise((resolve) => {
    let buf = Buffer.alloc(0);
    const sp = new SerialPort({ ...serialOpts(portName, baud), autoOpen: false });
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      const hex = buf.slice(0, 128).toString("hex");
      let ascii = "";
      try {
        ascii = buf.slice(0, 200).toString("utf8").replace(/\r/g, "\\r").replace(/\n/g, "\\n");
      } catch (_) {
        ascii = "(binary)";
      }
      const out = {
        byteLength: buf.length,
        hex: hex + (buf.length > 64 ? "…" : ""),
        ascii: ascii.length > 120 ? ascii.slice(0, 120) + "…" : ascii,
      };
      if (sp.isOpen) {
        sp.close(() => resolve(out));
      } else {
        resolve(out);
      }
    };
    sp.on("data", (chunk) => {
      const c = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      buf = Buffer.concat([buf, c]);
    });
    sp.on("error", () => finish());
    sp.open((err) => {
      if (err) {
        if (!done) {
          done = true;
          resolve({ byteLength: -1, hex: "", ascii: err.message || "open failed" });
        }
        return;
      }
      setTimeout(finish, ms);
    });
  });
}

/** @returns {Promise<{ path: string, baud: number, delim: string } | null>} */
async function autoDetectPort() {
  console.log("[thermal-usb] auto-detect: scanning for valid thermal lines (JSON or 64-value CSV)…\n");
  const ports = await printDetailedPorts();
  if (ports.length === 0) {
    console.error("[thermal-usb] no serial ports found.");
    return null;
  }
  const isEsp32Adapter = (p) => {
    const desc = [p.manufacturer || "", p.friendlyName || "", p.pnpId || ""].join(" ").toLowerCase();
    return /ch340|ch341|cp210|ftdi|silicon.lab|esp32|wch/i.test(desc) && !(p.vendorId === "0525" && p.productId === "A4A7");
  };
  const sorted = sortPortsUsbLikelyFirst(ports).filter((p) => !isEsp32Adapter(p));

  const tryProbe = async (p, baud, delim, label) => {
    console.log(`[thermal-usb] probing ${p.path} @ ${baud} (${PROBE_MS}ms, ${label}, delim=${JSON.stringify(delim)})…`);
    const ok = await testPort(p.path, baud, delim);
    if (ok) {
      console.log(`[thermal-usb] auto-detected thermal stream on ${p.path} @ ${baud} (${label})\n`);
      return { path: p.path, baud, delim };
    }
    return null;
  };

  for (const p of sorted) {
    for (const baud of PROBE_BAUDS) {
      const r = await tryProbe(p, baud, READLINE_DELIM, "primary line ending");
      if (r) return r;
    }
  }

  const altDelims = ["\r\n", "\r"].filter((d) => d !== READLINE_DELIM);
  if (altDelims.length > 0) {
    console.log(
      "[thermal-usb] no frame with primary delimiter; retrying USB (vendorId) ports with \\r\\n and \\r…\n"
    );
    const usbPorts = sorted.filter((p) => p.vendorId);
    for (const p of usbPorts) {
      for (const baud of PROBE_BAUDS) {
        for (const d of altDelims) {
          const r = await tryProbe(p, baud, d, "alt line ending");
          if (r) return r;
        }
      }
    }
  }

  return null;
}

async function printRawSniffHints(ports) {
  const usbPorts = sortPortsUsbLikelyFirst(ports).filter((p) => p.vendorId);
  if (usbPorts.length === 0) return;
  const sniffMs = Math.min(4000, Math.max(1500, parseInt(process.env.THERMAL_SNIFF_MS || "2500", 10) || 2500));
  console.log(
    `\n[thermal-usb] Raw byte sniff (${sniffMs}ms each, first USB CDC port @ ${PROBE_BAUDS[0]}) — ` +
      "if bytes > 0 but auto-detect failed, firmware may use binary or odd framing.\n"
  );
  const p = usbPorts[0];
  const baud = PROBE_BAUDS[0];
  const s = await sniffRawBytes(p.path, baud, sniffMs);
  if (s.byteLength < 0) {
    console.log(`[thermal-usb] sniff ${p.path}: could not open (${s.ascii})`);
    return;
  }
  console.log(`[thermal-usb] sniff ${p.path} @ ${baud}: ${s.byteLength} bytes`);
  if (s.byteLength > 0) {
    console.log(`[thermal-usb]   hex (first 64 bytes): ${s.hex}`);
    console.log(`[thermal-usb]   utf8 preview: ${s.ascii}`);
  } else {
    console.log("[thermal-usb]   (no bytes — wrong port, baud, or device not transmitting)");
  }
}

async function waitForApi() {
  const baseUrl = NEXTJS_API_URL.replace(/\/api\/thermal\/bt.*$/, "") || "http://127.0.0.1:3000";
  const maxWait = 45000;
  const interval = 500;
  const start = Date.now();
  while (Date.now() - start < maxWait) {
    try {
      const c = new AbortController();
      const t = setTimeout(() => c.abort(), 3000);
      const r = await fetch(baseUrl, { method: "GET", signal: c.signal });
      clearTimeout(t);
      if (r.status < 500) {
        console.log("[thermal-usb] Next.js reachable at", baseUrl);
        return;
      }
    } catch (e) {
      const code = e && e.cause && e.cause.code;
      if (Date.now() - start > 5000 && Date.now() - start < 5200) {
        console.warn("[thermal-usb] still waiting for Next.js…", baseUrl, code || e.message || e);
      }
    }
    await new Promise((r) => setTimeout(r, interval));
  }
  console.warn(
    "[thermal-usb] Next.js not reachable at",
    baseUrl,
    "— POSTs will fail until the dev server is up (e.g. npm run dev:next)."
  );
}

function formatFetchError(e) {
  const parts = [e && e.message];
  if (e && e.cause) {
    const c = e.cause;
    parts.push(c.code || c.message || String(c));
  }
  if (e && e.code) parts.push(e.code);
  return parts.filter(Boolean).join(" | ");
}

function lineToPayload(trimmed, stats) {
  if (!trimmed) return null;
  let obj = null;
  if (trimmed.startsWith("{")) {
    try {
      obj = JSON.parse(trimmed);
    } catch (e) {
      stats.parseErrors++;
      if (DEBUG || stats.parseErrors % 25 === 1) {
        console.warn("[thermal-usb] JSON parse error (skipped line):", e.message);
      }
      return null;
    }
  } else {
    obj = parseThermalSerialLine(trimmed);
  }
  if (obj && looksLikeThermalJson(obj)) return obj;
  return null;
}

function main() {
  console.log(
    "[thermal-usb] Tip: default `npm run dev` starts bluetooth-thermal-receiver.js and may compete for COM ports.\n" +
      "            Use `npm run dev:next` + `npm run thermal:usb`, or `npm run dev:thermal-usb`.\n"
  );

  (async () => {
    let connectBaud = DEFAULT_BAUD;
    let connectDelim = READLINE_DELIM;

    if (!SERIAL_PORT) {
      const found = await autoDetectPort();
      const fallback = (process.env.THERMAL_FALLBACK_SERIAL_PORT || "").trim();
      if (!found && fallback) {
        console.warn(
          "[thermal-usb] auto-detect did not see a valid JSON/CSV thermal frame; opening THERMAL_FALLBACK_SERIAL_PORT=" +
            fallback +
            " anyway.\n" +
            "            Set THERMAL_USB_LOG_RAW=1 to print every line. Fix baud/delimiter/firmware format if needed.\n"
        );
        SERIAL_PORT = fallback;
        connectBaud = DEFAULT_BAUD;
        connectDelim = READLINE_DELIM;
      } else if (!found) {
        const ports = await SerialPort.list();
        await printRawSniffHints(ports);
        console.error(
          "\n[thermal-usb] Auto-detect failed.\n" +
            "  • \"COMx\" in docs means YOUR port number — use COM3 (or whatever Device Manager shows), not the letters COMx.\n" +
            "  • Manual:   node usb-serial-thermal-receiver.js COM3\n" +
            "  • Or .env: THERMAL_FALLBACK_SERIAL_PORT=COM3  and  THERMAL_USB_LOG_RAW=1\n" +
            "  • Wrong baud / \\r vs \\n / firmware not JSON or 64-float CSV / port held by bluetooth-thermal-receiver.\n"
        );
        process.exit(1);
      } else {
        SERIAL_PORT = found.path;
        connectBaud = found.baud;
        connectDelim = found.delim;
      }
    } else {
      console.log("[thermal-usb] manual SERIAL_PORT:", SERIAL_PORT, "baud:", DEFAULT_BAUD);
    }

    console.log("[thermal-usb] chosen port:", SERIAL_PORT, "| connect baud:", connectBaud);
    console.log("[thermal-usb] line delimiter:", JSON.stringify(connectDelim), "| POST →", NEXTJS_API_URL);
    console.log("[thermal-usb] debug:", DEBUG ? "on (DEBUG_THERMAL / THERMAL_USB_DEBUG)" : "off", "\n");

    try {
      await waitForApi();
    } catch (_) {}

    let port;
    let exiting = false;
    let forwardStats = { success: 0, failures: 0, parseErrors: 0, skipped: 0 };
    let lastSummaryLog = 0;
    let lineCount = 0;

    const POST_TIMEOUT_MS = 8000;
    let pendingPayload = null;
    let flushRunning = false;

    async function flushPostQueue() {
      if (flushRunning) return;
      flushRunning = true;
      try {
        while (pendingPayload !== null) {
          const obj = pendingPayload;
          pendingPayload = null;
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), POST_TIMEOUT_MS);
          try {
            const res = await fetch(NEXTJS_API_URL, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(obj),
              signal: controller.signal,
            });
            clearTimeout(timeoutId);
            if (res.ok) {
              forwardStats.success++;
              const now = Date.now();
              if (DEBUG || now - lastSummaryLog > 5000) {
                console.log("[thermal-usb] forward OK (summary)", {
                  posted: forwardStats.success,
                  failures: forwardStats.failures,
                  parseErrors: forwardStats.parseErrors,
                  skipped: forwardStats.skipped,
                });
                lastSummaryLog = now;
              }
            } else {
              forwardStats.failures++;
              const text = await res.text().catch(() => "");
              console.error("[thermal-usb] API HTTP", res.status, res.statusText, text.slice(0, 200));
            }
          } catch (e) {
            clearTimeout(timeoutId);
            forwardStats.failures++;
            if (e.name === "AbortError") {
              if (forwardStats.failures % 30 === 1) {
                console.error("[thermal-usb] POST timed out — is Next.js running?", NEXTJS_API_URL);
              }
            } else if (forwardStats.failures % 15 === 1) {
              console.error("[thermal-usb] POST failed:", formatFetchError(e));
            }
          }
        }
      } finally {
        flushRunning = false;
        if (pendingPayload !== null) {
          setImmediate(() => flushPostQueue());
        }
      }
    }

    function postPayload(obj) {
      if (DEBUG) {
        const flat = obj.pixels || (obj.thermal_data && obj.thermal_data.flat?.());
        const preview =
          Array.isArray(flat) && flat.length >= 64
            ? { min: Math.min(...flat.slice(0, 64)), max: Math.max(...flat.slice(0, 64)) }
            : { keys: Object.keys(obj) };
        logDebug("enqueue POST", preview);
      }
      pendingPayload = obj;
      flushPostQueue();
    }

    function handleLine(line) {
      const trimmed = String(line).trim();
      if (!trimmed) return;
      lineCount++;
      if (LOG_RAW || (DEBUG && lineCount % 20 === 1)) {
        const preview = trimmed.length > 200 ? trimmed.slice(0, 200) + "…" : trimmed;
        console.log("[thermal-usb] raw line:", preview);
      }
      const data = lineToPayload(trimmed, forwardStats);
      if (!data) {
        forwardStats.skipped++;
        if (DEBUG && forwardStats.skipped % 50 === 1) {
          console.log("[thermal-usb] skipped line (not a thermal frame)", { lineCount });
        }
        return;
      }
      if (lineCount % 30 === 0 || lineCount < 3) {
        console.log("[thermal-usb] parse OK → forwarding", {
          keys: Object.keys(data),
          hasPixels: Array.isArray(data.pixels),
          hasThermalData: Array.isArray(data.thermal_data),
        });
      }
      postPayload(data);
    }

    function connect(baudToTry) {
      const b = baudToTry ?? connectBaud;
      const opts = serialOpts(SERIAL_PORT, b);
      opts.autoOpen = true;
      port = new SerialPort(opts);
      const parser = port.pipe(new ReadlineParser({ delimiter: connectDelim }));

      port.on("open", () => {
        console.log("[thermal-usb] serial open on", SERIAL_PORT, "@", b, "; waiting for frames…\n");
      });

      port.on("error", (err) => {
        const is31 = /error code 31|Error 31|GEN_FAILURE/i.test(err.message);
        if (is31 && b === connectBaud && connectBaud !== 9600) {
          console.error("[thermal-usb] serial error 31 @", b, "→ retry 9600");
          if (port?.isOpen) port.close(() => connect(9600));
          else setTimeout(() => connect(9600), 300);
          return;
        }
        console.error("[thermal-usb] serial error:", err.message);
      });

      port.on("close", () => {
        if (exiting) return;
        console.log("[thermal-usb] disconnected; reconnect in", RECONNECT_DELAY_MS, "ms");
        setTimeout(() => connect(connectBaud), RECONNECT_DELAY_MS);
      });

      parser.on("data", handleLine);
    }

    connect(connectBaud);

    process.on("SIGINT", () => {
      exiting = true;
      console.log("\n[thermal-usb] stats:", forwardStats);
      if (port?.isOpen) port.close(() => process.exit(0));
      else process.exit(0);
    });
  })().catch((e) => {
    console.error("[thermal-usb] fatal:", e);
    process.exit(1);
  });
}

main();
