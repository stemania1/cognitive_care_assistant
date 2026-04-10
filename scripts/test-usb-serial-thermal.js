#!/usr/bin/env node
/**
 * Standalone USB serial test for AMG8833 bridge firmware (no Next.js required).
 * Confirms: COM port opens, lines parse, thermal min/max look sane (hardware vs firmware vs baud).
 *
 * Usage:
 *   node scripts/test-usb-serial-thermal.js --list
 *   node scripts/test-usb-serial-thermal.js COM7
 *   node scripts/test-usb-serial-thermal.js COM7 115200
 *   node scripts/test-usb-serial-thermal.js --raw COM7 115200   (hex dump, no line parse — binary sniff)
 *
 * Env:
 *   SERIAL_PORT   BAUD_RATE   THERMAL_USB_DEBUG=1   DEBUG_THERMAL=1
 */

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });

const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");
const {
  parseThermalSerialLine,
  looksLikeThermalPayload,
} = require("./thermal-serial-line.cjs");

const DEBUG =
  process.env.THERMAL_USB_DEBUG === "1" ||
  process.env.DEBUG_THERMAL === "1" ||
  process.env.DEBUG_THERMAL === "true";

const argv = process.argv.slice(2);
const wantList = argv.includes("--list");
const wantRaw = argv.includes("--raw");
const pos = argv.filter((a) => a !== "--list" && a !== "--raw");
const portPath = pos[0] || process.env.SERIAL_PORT;
const baud = parseInt(pos[1] || process.env.BAUD_RATE || "115200", 10) || 115200;

async function listPorts() {
  const ports = await SerialPort.list();
  console.log("[test-usb-serial-thermal] serial ports:");
  if (ports.length === 0) console.log("  (none)");
  for (const p of ports) {
    console.log(
      `  ${p.path}  mfr=${p.manufacturer || "?"}  vid=${p.vendorId || "?"}  pid=${p.productId || "?"}  sn=${p.serialNumber || "?"}`
    );
  }
  return ports;
}

function statsFromPayload(obj) {
  let flat = null;
  if (Array.isArray(obj.pixels) && obj.pixels.length === 64) flat = obj.pixels.map(Number);
  else if (Array.isArray(obj.values) && obj.values.length === 64) flat = obj.values.map(Number);
  else if (Array.isArray(obj.thermal_data) && obj.thermal_data.length === 8) flat = obj.thermal_data.flat();
  if (!flat || flat.length < 64) return null;
  const nums = flat.slice(0, 64);
  return {
    min: Math.min(...nums),
    max: Math.max(...nums),
    avg: nums.reduce((a, b) => a + b, 0) / 64,
  };
}

async function main() {
  if (wantList && !portPath) {
    await listPorts();
    return;
  }

  if (!portPath) {
    console.error("Usage: node scripts/test-usb-serial-thermal.js <COMn> [baud]");
    console.error("       node scripts/test-usb-serial-thermal.js --list");
    console.error("Or set SERIAL_PORT in .env / .env.local");
    await listPorts();
    process.exit(1);
  }

  if (/^comx$/i.test(String(portPath).trim())) {
    console.error(
      '[test-usb-serial-thermal] Port name "COMx" is a documentation placeholder — use your real port (e.g. COM3 from --list).'
    );
    await listPorts();
    process.exit(1);
  }

  await listPorts();
  console.log("[test-usb-serial-thermal] opening", portPath, "@", baud);

  const port = new SerialPort({
    path: portPath,
    baudRate: baud,
    dataBits: 8,
    stopBits: 1,
    parity: "none",
    autoOpen: false,
  });

  if (wantRaw) {
    let bytes = 0;
    const maxBytes = parseInt(process.env.THERMAL_RAW_MAX_BYTES || "512", 10) || 512;
    port.on("data", (chunk) => {
      const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      bytes += buf.length;
      console.log("[raw-bytes]", buf.length, "bytes:", buf.toString("hex").slice(0, 256) + (buf.length > 128 ? "…" : ""));
      if (bytes >= maxBytes) {
        console.log("[test-usb-serial-thermal] raw cap reached (" + maxBytes + " bytes), exiting.");
        port.close(() => process.exit(0));
      }
    });
    port.on("error", (e) => console.error("[test-usb-serial-thermal] serial error:", e.message));
    await new Promise((resolve, reject) => {
      port.open((err) => (err ? reject(err) : resolve()));
    });
    console.log("[test-usb-serial-thermal] --raw mode (hex). Ctrl+C to stop.");
    return;
  }

  const parser = port.pipe(new ReadlineParser({ delimiter: "\n" }));

  let ok = 0;
  let bad = 0;
  let skipped = 0;

  parser.on("data", (line) => {
    const t = String(line).trim();
    if (!t) return;
    if (DEBUG || ok + bad < 5) {
      console.log("[raw]", t.length > 200 ? t.slice(0, 200) + "…" : t);
    }
    let obj = null;
    if (t.startsWith("{")) {
      try {
        obj = JSON.parse(t);
      } catch (e) {
        bad++;
        console.warn("[test-usb-serial-thermal] JSON error:", e.message);
        return;
      }
    } else {
      obj = parseThermalSerialLine(t);
    }
    if (!obj || !looksLikeThermalPayload(obj)) {
      skipped++;
      if (DEBUG && skipped % 20 === 1) console.log("[test-usb-serial-thermal] skipped (not thermal)");
      return;
    }
    ok++;
    const st = statsFromPayload(obj);
    if (st) {
      console.log("[test-usb-serial-thermal] OK frame", {
        n: ok,
        min: st.min.toFixed(2),
        max: st.max.toFixed(2),
        avg: st.avg.toFixed(2),
        sensor: obj.sensor,
      });
    } else {
      console.log("[test-usb-serial-thermal] OK (grid)", { n: ok, keys: Object.keys(obj) });
    }
  });

  port.on("error", (e) => console.error("[test-usb-serial-thermal] serial error:", e.message));

  await new Promise((resolve, reject) => {
    port.open((err) => (err ? reject(err) : resolve()));
  });
  console.log("[test-usb-serial-thermal] listening (Ctrl+C to stop).");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
