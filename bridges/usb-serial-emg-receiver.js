/**
 * USB Serial EMG Receiver — MyoWare/ESP32 via USB CDC → POST /api/emg/ws → CCA UI
 *
 * Reads EMG data from an ESP32 (or similar MCU) connected via USB serial,
 * parses JSON lines, and forwards them to the Next.js EMG API endpoint.
 *
 * Data format expected from ESP32 (one JSON object per line):
 *   {"type":"emg_data","timestamp":12345,"muscleActivity":1024,"voltage":0.82,"calibrated":false}
 *   {"type":"calibration_data","min":100,"max":3500,"range":3400,"timestamp":12345}
 *   {"type":"heartbeat","timestamp":12345}
 *
 * Env (.env / .env.local):
 *   EMG_SERIAL_PORT=auto | COMx         (auto = scan for ESP32/MCU USB, default auto)
 *   EMG_BAUD_RATE=115200                (default 115200)
 *   EMG_API_URL=http://127.0.0.1:3000/api/emg/ws
 *   DEBUG_EMG=1                         (verbose logging)
 *   EMG_PROBE_MS=6000                   (auto-detect timeout per port)
 *   EMG_RECONNECT_MS=5000              (delay before reconnecting on disconnect)
 */

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });

const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");

const TAG = "[emg-usb]";

function isTruthyEnv(v) {
  if (v === undefined || v === null) return false;
  const s = String(v).trim().toLowerCase();
  return s === "1" || s === "true" || s === "yes";
}

function resolveApiUrl() {
  const raw = process.env.EMG_API_URL || "http://127.0.0.1:3000/api/emg/ws";
  return raw.includes("localhost") ? raw.replace(/localhost/g, "127.0.0.1") : raw;
}

const API_URL = resolveApiUrl();

let SERIAL_PORT = process.argv[2] || process.env.EMG_SERIAL_PORT || "";
{
  const sp = String(SERIAL_PORT).trim().toLowerCase();
  if (sp === "" || sp === "auto") SERIAL_PORT = "";
}

const DEFAULT_BAUD =
  parseInt(process.argv[3] || process.env.EMG_BAUD_RATE || "115200", 10) || 115200;

const DEBUG = isTruthyEnv(process.env.DEBUG_EMG);
const PROBE_MS = Math.max(1000, parseInt(process.env.EMG_PROBE_MS || "6000", 10) || 6000);
const RECONNECT_MS = parseInt(process.env.EMG_RECONNECT_MS || "5000", 10) || 5000;

const stats = { posted: 0, failures: 0, parseErrors: 0, skipped: 0 };
let logSummaryInterval = null;

// Known ESP32/MCU USB identifiers
const MCU_PATTERNS = [
  /cp210/i, /ch340/i, /ch341/i, /ftdi/i, /silicon.lab/i,
  /esp/i, /wch/i, /arduino/i, /teensy/i,
];

function isMcuPort(port) {
  const desc = [
    port.manufacturer || "",
    port.pnpId || "",
    port.friendlyName || "",
  ].join(" ");
  if (port.vendorId && !/^0*$/.test(port.vendorId)) return true;
  return MCU_PATTERNS.some((re) => re.test(desc));
}

function isBluetoothPort(port) {
  const desc = [
    port.manufacturer || "",
    port.pnpId || "",
    port.friendlyName || "",
  ].join(" ").toLowerCase();
  return desc.includes("bluetooth") || desc.includes("bthenum");
}

function isRaspberryPiPort(port) {
  return (
    (port.vendorId === "0525" && port.productId === "A4A7") ||
    /raspberry/i.test(port.friendlyName || "")
  );
}

function looksLikeEmgPayload(line) {
  try {
    const obj = JSON.parse(line.trim());
    return (
      obj.type === "emg_data" ||
      obj.type === "calibration_data" ||
      obj.type === "heartbeat" ||
      obj.type === "test" ||
      typeof obj.muscleActivity === "number" ||
      typeof obj.voltage === "number"
    );
  } catch {
    return false;
  }
}

async function sortPortsMcuFirst(ports) {
  const mcu = [];
  const other = [];
  for (const p of ports) {
    if (isBluetoothPort(p) || isRaspberryPiPort(p)) continue;
    if (isMcuPort(p)) mcu.push(p);
    else other.push(p);
  }
  return [...mcu, ...other];
}

function probePort(portPath, baud, timeoutMs) {
  return new Promise((resolve) => {
    let found = false;
    const timer = setTimeout(() => {
      if (!found) {
        found = true;
        try { sp.close(); } catch {}
        resolve(false);
      }
    }, timeoutMs);

    let sp;
    try {
      sp = new SerialPort({ path: portPath, baudRate: baud, autoOpen: false });
    } catch {
      clearTimeout(timer);
      resolve(false);
      return;
    }

    const parser = sp.pipe(new ReadlineParser({ delimiter: "\n" }));

    parser.on("data", (line) => {
      if (!found && looksLikeEmgPayload(line)) {
        found = true;
        clearTimeout(timer);
        try { sp.close(); } catch {}
        resolve(true);
      }
    });

    sp.on("error", () => {
      if (!found) {
        found = true;
        clearTimeout(timer);
        resolve(false);
      }
    });

    sp.open((err) => {
      if (err) {
        if (!found) {
          found = true;
          clearTimeout(timer);
          resolve(false);
        }
      }
    });
  });
}

async function autoDetectPort() {
  console.log(`${TAG} auto-detect: scanning for ESP32/MCU with EMG data...\n`);

  const allPorts = await SerialPort.list();
  console.log(`${TAG} detected serial ports (${allPorts.length}):`);
  for (const p of allPorts) {
    console.log(`   ${p.path} - ${p.friendlyName || p.manufacturer || "unknown"} ${p.vendorId ? `(VID:${p.vendorId})` : ""}`);
  }

  const sorted = await sortPortsMcuFirst(allPorts);
  if (sorted.length === 0) {
    console.error(`${TAG} no non-Bluetooth, non-Pi serial ports found.`);
    return null;
  }

  console.log(`${TAG} probe order (MCU-like first, Bluetooth/Pi excluded):`);
  sorted.forEach((p) => console.log(`   ${p.path}`));
  console.log();

  for (const portInfo of sorted) {
    console.log(`${TAG} probing ${portInfo.path} @ ${DEFAULT_BAUD} (${PROBE_MS}ms)...`);
    const ok = await probePort(portInfo.path, DEFAULT_BAUD, PROBE_MS);
    if (ok) {
      console.log(`${TAG} EMG data detected on ${portInfo.path} @ ${DEFAULT_BAUD}\n`);
      return portInfo.path;
    }
    console.log(`${TAG}    no EMG data on ${portInfo.path}`);
  }

  console.error(`\n${TAG} no EMG stream found on any port.`);
  return null;
}

async function forwardToApi(payload) {
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      stats.posted++;
    } else {
      stats.failures++;
      if (DEBUG) console.error(`${TAG} API ${res.status}: ${res.statusText}`);
    }
  } catch (err) {
    stats.failures++;
    if (stats.failures <= 3 || stats.failures % 50 === 0) {
      console.error(`${TAG} API error: ${err.message} (failures: ${stats.failures})`);
    }
  }
}

function logSummary() {
  const { posted, failures, parseErrors, skipped } = stats;
  if (posted > 0 || failures > 0) {
    console.log(`${TAG} forward summary { posted: ${posted}, failures: ${failures}, parseErrors: ${parseErrors}, skipped: ${skipped} }`);
  }
}

async function connectAndStream(portPath, baud) {
  console.log(`${TAG} opening ${portPath} @ ${baud}...`);

  const sp = new SerialPort({ path: portPath, baudRate: baud, autoOpen: false });
  const parser = sp.pipe(new ReadlineParser({ delimiter: "\n" }));

  let firstFrame = true;

  parser.on("data", (line) => {
    const trimmed = line.trim();
    if (!trimmed || !trimmed.startsWith("{")) {
      stats.skipped++;
      return;
    }

    let obj;
    try {
      obj = JSON.parse(trimmed);
    } catch {
      stats.parseErrors++;
      if (DEBUG) console.warn(`${TAG} parse error: ${trimmed.substring(0, 100)}`);
      return;
    }

    if (!obj.type) {
      if (typeof obj.muscleActivity === "number" || typeof obj.voltage === "number") {
        obj.type = "emg_data";
      } else {
        stats.skipped++;
        return;
      }
    }

    if (firstFrame) {
      firstFrame = false;
      console.log(`${TAG} first EMG frame received:`, {
        type: obj.type,
        muscleActivity: obj.muscleActivity,
        voltage: obj.voltage,
        calibrated: obj.calibrated,
      });
    }

    forwardToApi(obj);
  });

  sp.on("close", () => {
    console.warn(`${TAG} serial port closed. Reconnecting in ${RECONNECT_MS}ms...`);
    clearInterval(logSummaryInterval);
    setTimeout(() => main(), RECONNECT_MS);
  });

  sp.on("error", (err) => {
    console.error(`${TAG} serial error: ${err.message}`);
  });

  return new Promise((resolve, reject) => {
    sp.open((err) => {
      if (err) {
        reject(err);
        return;
      }
      console.log(`${TAG} connected to ${portPath} @ ${baud}`);
      console.log(`${TAG} forwarding EMG data → ${API_URL}`);
      console.log(`${TAG} debug: ${DEBUG ? "on" : "off"}\n`);

      logSummaryInterval = setInterval(logSummary, 10000);
      resolve();
    });
  });
}

async function waitForNextJs(url, maxRetries = 10) {
  const healthUrl = url.replace(/\/api\/emg\/ws$/, "");
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(healthUrl, { method: "HEAD" });
      if (res.ok || res.status === 404 || res.status === 405) {
        console.log(`${TAG} Next.js reachable at ${healthUrl}`);
        return true;
      }
    } catch {}
    if (i === 0) console.log(`${TAG} waiting for Next.js at ${healthUrl}...`);
    await new Promise((r) => setTimeout(r, 2000));
  }
  console.warn(`${TAG} Next.js not reachable — will forward anyway (may fail initially)`);
  return false;
}

async function main() {
  let portPath = SERIAL_PORT;

  if (!portPath) {
    portPath = await autoDetectPort();
    if (!portPath) {
      console.error(`\n${TAG} Could not find an ESP32/MCU with EMG data.`);
      console.error(`${TAG} Troubleshooting:`);
      console.error(`${TAG}   1. Make sure the ESP32 is plugged in via USB`);
      console.error(`${TAG}   2. Check Device Manager → Ports for the COM port`);
      console.error(`${TAG}   3. Make sure the ESP32 firmware is running and sending data`);
      console.error(`${TAG}   4. Try specifying the port: node bridges/usb-serial-emg-receiver.js COM4`);
      console.error(`${TAG}   5. Set EMG_SERIAL_PORT=COMx in .env.local`);
      process.exit(1);
    }
  }

  await waitForNextJs(API_URL);

  try {
    await connectAndStream(portPath, DEFAULT_BAUD);
  } catch (err) {
    console.error(`${TAG} failed to open ${portPath}: ${err.message}`);
    console.error(`${TAG} retrying in ${RECONNECT_MS}ms...`);
    setTimeout(() => main(), RECONNECT_MS);
  }
}

main();
