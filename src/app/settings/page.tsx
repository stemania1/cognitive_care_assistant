"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { SENSOR_CONFIG, type ConnectionMode } from "@/app/config/sensor-config";

const CONNECTION_MODE_KEY = "thermal-connection-mode";
const EMG_CONNECTION_MODE_KEY = "emg-connection-mode";
const TEMP_UNIT_KEY = "cca-temp-unit";

type EmgConnectionMode = "wifi" | "usb_serial";

type PortInfo = {
  path: string;
  manufacturer: string | null;
  serialNumber: string | null;
  friendlyName: string | null;
};

type WifiProvisionStatus = "idle" | "sending" | "success" | "error";

export default function SettingsPage() {
  return (
    <main className="min-h-screen px-4 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-3xl space-y-8">
        <header>
          <h1 className="text-2xl font-bold sm:text-3xl">Settings</h1>
          <p className="mt-1 text-sm opacity-70">
            Configure sensors, display preferences, and device WiFi.
          </p>
        </header>

        <DisplayPreferencesSection />
        <SensorConfigSection />
        <EmgConfigSection />
        <WifiProvisioningSection />

        <div className="pt-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200/80 bg-white/80 px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-white dark:border-white/15 dark:bg-white/10 dark:hover:bg-white/15"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
              <path fillRule="evenodd" d="M9.293 2.293a1 1 0 0 1 1.414 0l7 7A1 1 0 0 1 17 11h-1v6a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-6H3a1 1 0 0 1-.707-1.707l7-7Z" clipRule="evenodd" />
            </svg>
            Back to Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}

/* ------------------------------------------------------------------ */
/*  Display Preferences                                                */
/* ------------------------------------------------------------------ */

function DisplayPreferencesSection() {
  const [tempUnit, setTempUnit] = useState<"C" | "F">("C");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(TEMP_UNIT_KEY);
      if (stored === "F") setTempUnit("F");
    } catch {}
  }, []);

  function handleTempUnit(unit: "C" | "F") {
    setTempUnit(unit);
    SENSOR_CONFIG.TEMPERATURE_UNIT = unit;
    try {
      localStorage.setItem(TEMP_UNIT_KEY, unit);
    } catch {}
  }

  return (
    <Section title="Display Preferences" icon={<SunIcon />}>
      <SettingRow label="Temperature unit">
        <SegmentedControl
          options={[
            { value: "C", label: "°C" },
            { value: "F", label: "°F" },
          ]}
          value={tempUnit}
          onChange={(v) => handleTempUnit(v as "C" | "F")}
        />
      </SettingRow>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/*  Sensor Configuration                                               */
/* ------------------------------------------------------------------ */

function SensorConfigSection() {
  const [connectionMode, setConnectionMode] = useState<ConnectionMode>("wifi");
  const [ports, setPorts] = useState<PortInfo[]>([]);
  const [portsLoading, setPortsLoading] = useState(false);
  const [portsError, setPortsError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CONNECTION_MODE_KEY) as ConnectionMode | null;
      if (stored === "wifi" || stored === "usb_serial") {
        setConnectionMode(stored);
      } else if (stored === "bluetooth" || stored === "usb") {
        setConnectionMode("usb_serial");
        localStorage.setItem(CONNECTION_MODE_KEY, "usb_serial");
      } else {
        setConnectionMode(SENSOR_CONFIG.CONNECTION_MODE);
      }
    } catch {
      setConnectionMode(SENSOR_CONFIG.CONNECTION_MODE);
    }
  }, []);

  function changeMode(mode: ConnectionMode) {
    setConnectionMode(mode);
    SENSOR_CONFIG.CONNECTION_MODE = mode;
    setTestResult(null);
    try {
      localStorage.setItem(CONNECTION_MODE_KEY, mode);
    } catch {}
  }

  async function fetchPorts() {
    setPortsLoading(true);
    setPortsError(null);
    try {
      const res = await fetch("/api/thermal/ports");
      const json = await res.json();
      if (json.ports) {
        setPorts(json.ports);
      } else {
        setPortsError(json.error || "No ports returned");
      }
    } catch (e: unknown) {
      setPortsError(e instanceof Error ? e.message : "Failed to fetch ports");
    } finally {
      setPortsLoading(false);
    }
  }

  async function testConnection() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/thermal");
      const json = await res.json();
      const connected = json && (json.thermal_data || json.data) && !json.error;
      setTestResult({
        ok: connected,
        msg: connected
          ? connectionMode === "usb_serial"
            ? "Bridge data detected — thermal frames arriving."
            : "Connected — receiving thermal data from Pi."
          : connectionMode === "usb_serial"
            ? "No bridge data yet. Make sure the Pi is plugged in via USB and npm run dev is running."
            : "Cannot reach Raspberry Pi. Check that the Pi is on WiFi and the thermal server is running.",
      });
    } catch (e: unknown) {
      setTestResult({
        ok: false,
        msg: e instanceof Error ? e.message : "Connection test failed",
      });
    } finally {
      setTesting(false);
    }
  }

  const isBridgeMode = connectionMode === "usb_serial";

  return (
    <Section title="Thermal Sensor (AMG8833)" icon={<CpuIcon />}>
      <SettingRow label="Thermal connection mode">
        <SegmentedControl
          options={[
            { value: "wifi", label: "Wi-Fi" },
            { value: "usb_serial", label: "USB" },
          ]}
          value={connectionMode}
          onChange={(v) => changeMode(v as ConnectionMode)}
        />
      </SettingRow>

      <div className="rounded-lg border border-slate-200/60 bg-slate-50/60 px-3 py-2.5 text-xs leading-relaxed text-slate-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-400">
        {connectionMode === "wifi" && (
          <p>Connects to Raspberry Pi over WiFi (HTTP + WebSocket). The Pi must be running the thermal server on the same network.</p>
        )}
        {connectionMode === "usb_serial" && (
          <p>Data arrives from the USB serial bridge script (<code className="text-[11px]">usb-serial-thermal-receiver.js</code>). The bridge auto-detects COM ports and POSTs frames to <code className="text-[11px]">/api/thermal/bt</code>.</p>
        )}
      </div>

      {isBridgeMode && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Detected serial ports</span>
            <button
              type="button"
              onClick={fetchPorts}
              disabled={portsLoading}
              className="rounded-md border border-slate-200/80 bg-white/80 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-white disabled:opacity-50 dark:border-white/15 dark:bg-white/10 dark:hover:bg-white/15"
            >
              {portsLoading ? "Scanning..." : "Scan Ports"}
            </button>
          </div>

          {portsError && (
            <p className="text-xs text-red-500 dark:text-red-400">{portsError}</p>
          )}

          {ports.length > 0 && (
            <div className="overflow-hidden rounded-lg border border-slate-200/60 dark:border-white/10">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200/60 bg-slate-100/60 dark:border-white/10 dark:bg-white/[0.04]">
                    <th className="px-3 py-2 text-left font-medium">Port</th>
                    <th className="px-3 py-2 text-left font-medium">Manufacturer</th>
                    <th className="px-3 py-2 text-left font-medium">Name</th>
                  </tr>
                </thead>
                <tbody>
                  {ports.map((p) => (
                    <tr key={p.path} className="border-b border-slate-200/40 last:border-0 dark:border-white/5">
                      <td className="px-3 py-2 font-mono">{p.path}</td>
                      <td className="px-3 py-2">{p.manufacturer || "—"}</td>
                      <td className="px-3 py-2">{p.friendlyName || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {ports.length === 0 && !portsLoading && !portsError && (
            <p className="text-xs opacity-60">Click &quot;Scan Ports&quot; to detect connected devices.</p>
          )}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={testConnection}
          disabled={testing}
          className="rounded-lg border border-slate-200/80 bg-white/80 px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-white disabled:opacity-50 dark:border-white/15 dark:bg-white/10 dark:hover:bg-white/15"
        >
          {testing ? "Testing..." : "Test Connection"}
        </button>
        {testResult && (
          <span className={`text-xs font-medium ${testResult.ok ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
            {testResult.ok ? "Connected" : "Not connected"}
          </span>
        )}
      </div>
      {testResult && (
        <p className={`text-xs ${testResult.ok ? "text-emerald-600/80 dark:text-emerald-400/80" : "text-red-500/80 dark:text-red-400/80"}`}>
          {testResult.msg}
        </p>
      )}
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/*  EMG Sensor Configuration                                           */
/* ------------------------------------------------------------------ */

function EmgConfigSection() {
  const [emgMode, setEmgMode] = useState<EmgConnectionMode>("wifi");
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(EMG_CONNECTION_MODE_KEY) as EmgConnectionMode | null;
      if (stored === "wifi" || stored === "usb_serial") {
        setEmgMode(stored);
      } else if (stored === "bluetooth") {
        setEmgMode("usb_serial");
        localStorage.setItem(EMG_CONNECTION_MODE_KEY, "usb_serial");
      }
    } catch {}
  }, []);

  function changeMode(mode: EmgConnectionMode) {
    setEmgMode(mode);
    setTestResult(null);
    try {
      localStorage.setItem(EMG_CONNECTION_MODE_KEY, mode);
    } catch {}
  }

  async function testEmgConnection() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/emg/data");
      const json = await res.json();
      const hasData = json && json.dataCount > 0 && json.isConnected;
      setTestResult({
        ok: hasData,
        msg: hasData
          ? `EMG data flowing — ${json.dataCount} samples received.`
          : emgMode === "usb_serial"
            ? "No EMG data yet. Make sure the ESP32 is plugged in and npm run dev is running."
            : "No EMG data. Check that the ESP32 is connected to WiFi and sending data to the emg-server.",
      });
    } catch (e: unknown) {
      setTestResult({
        ok: false,
        msg: e instanceof Error ? e.message : "Connection test failed",
      });
    } finally {
      setTesting(false);
    }
  }

  return (
    <Section title="EMG Sensor (MyoWare)" icon={<BoltIcon />}>
      <SettingRow label="EMG connection mode">
        <SegmentedControl
          options={[
            { value: "wifi", label: "Wi-Fi" },
            { value: "usb_serial", label: "USB" },
          ]}
          value={emgMode}
          onChange={(v) => changeMode(v as EmgConnectionMode)}
        />
      </SettingRow>

      <div className="rounded-lg border border-slate-200/60 bg-slate-50/60 px-3 py-2.5 text-xs leading-relaxed text-slate-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-400">
        {emgMode === "wifi" && (
          <p>ESP32 connects to WiFi and POSTs data to <code className="text-[11px]">emg-server.js</code> (port 3001). Run <code className="text-[11px]">npm run emg-server</code> or <code className="text-[11px]">npm run dev:all</code>.</p>
        )}
        {emgMode === "usb_serial" && (
          <p>ESP32 plugged in via USB. The bridge starts automatically with <code className="text-[11px]">npm run dev</code> and forwards data to <code className="text-[11px]">/api/emg/ws</code>.</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={testEmgConnection}
          disabled={testing}
          className="rounded-lg border border-slate-200/80 bg-white/80 px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-white disabled:opacity-50 dark:border-white/15 dark:bg-white/10 dark:hover:bg-white/15"
        >
          {testing ? "Testing..." : "Test EMG Connection"}
        </button>
        {testResult && (
          <span className={`text-xs font-medium ${testResult.ok ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
            {testResult.ok ? "Connected" : "Not connected"}
          </span>
        )}
      </div>
      {testResult && (
        <p className={`text-xs ${testResult.ok ? "text-emerald-600/80 dark:text-emerald-400/80" : "text-red-500/80 dark:text-red-400/80"}`}>
          {testResult.msg}
        </p>
      )}
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/*  WiFi Provisioning                                                  */
/* ------------------------------------------------------------------ */

function WifiProvisioningSection() {
  const [device, setDevice] = useState<"pi" | "esp32">("pi");
  const [ssid, setSsid] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<WifiProvisionStatus>("idle");
  const [statusMsg, setStatusMsg] = useState("");
  const [detectedPort, setDetectedPort] = useState<string | null>(null);
  const [portsScanned, setPortsScanned] = useState(false);
  const [isLocalhost, setIsLocalhost] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setIsLocalhost(
      window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    );
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isLocalhost || portsScanned) return;
    setPortsScanned(true);
    fetch("/api/thermal/ports")
      .then((r) => r.json())
      .then((json) => {
        const ports: PortInfo[] = json.ports || [];
        const piPort = ports.find(
          (p) => p.manufacturer?.toLowerCase().includes("linux") || p.path === "COM3"
        );
        const espPort = ports.find((p) =>
          /cp210|ch340|ftdi|silicon|esp|wch/i.test(p.manufacturer || "")
        );
        if (device === "pi" && piPort) setDetectedPort(piPort.path);
        else if (device === "esp32" && espPort) setDetectedPort(espPort.path);
        else if (ports.length > 0) setDetectedPort(ports[0].path);
      })
      .catch(() => {});
  }, [isLocalhost, portsScanned, device]);

  async function sendWifiConfig() {
    if (!ssid.trim()) return;

    if (!isLocalhost) {
      setStatus("error");
      setStatusMsg(
        "WiFi provisioning requires the app to be running locally (localhost). " +
        "Browsers block HTTP requests from HTTPS pages to local IP addresses. " +
        "Run the app with `npm run dev` on the machine where the device is connected via USB."
      );
      timeoutRef.current = setTimeout(() => setStatus("idle"), 15000);
      return;
    }

    if (!detectedPort) {
      setStatus("error");
      setStatusMsg("No serial port detected. Plug in the device via USB and reload the page.");
      timeoutRef.current = setTimeout(() => setStatus("idle"), 10000);
      return;
    }

    setStatus("sending");
    setStatusMsg(`Sending WiFi config to ${detectedPort}...`);

    try {
      const res = await fetch("/api/wifi-provision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          port: detectedPort,
          ssid: ssid.trim(),
          password,
          baud: 115200,
        }),
      });
      const json = await res.json();
      if (json.ok) {
        setStatus("success");
        setStatusMsg(json.msg || `WiFi credentials sent to ${device === "pi" ? "Raspberry Pi" : "ESP32"} on ${detectedPort}.`);
      } else {
        setStatus("error");
        setStatusMsg(json.msg || json.error || "Device did not confirm WiFi configuration.");
      }
    } catch (e: unknown) {
      setStatus("error");
      setStatusMsg(e instanceof Error ? e.message : "Failed to send WiFi config.");
    }

    timeoutRef.current = setTimeout(() => setStatus("idle"), 15000);
  }

  return (
    <Section title="WiFi Provisioning" icon={<WifiIcon />}>
      <p className="text-xs leading-relaxed opacity-70">
        Configure your sensor device&apos;s WiFi credentials over USB so it can connect to the local network wirelessly.
      </p>

      {!isLocalhost && (
        <div className="rounded-lg border border-amber-200/60 bg-amber-50/60 px-3 py-2.5 text-xs leading-relaxed text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
          WiFi provisioning requires a localhost connection. Run <code className="text-[11px]">npm run dev</code> on the machine with the USB-connected device, then open <code className="text-[11px]">localhost:3000/settings</code>.
        </div>
      )}

      <SettingRow label="Target device">
        <SegmentedControl
          options={[
            { value: "pi", label: "Raspberry Pi" },
            { value: "esp32", label: "ESP32" },
          ]}
          value={device}
          onChange={(v) => {
            setDevice(v as "pi" | "esp32");
            setStatus("idle");
            setStatusMsg("");
          }}
        />
      </SettingRow>

      <div className="space-y-3">
        <div>
          <label htmlFor="wifi-ssid" className="mb-1 block text-xs font-medium opacity-80">
            WiFi Network (SSID)
          </label>
          <input
            id="wifi-ssid"
            type="text"
            value={ssid}
            onChange={(e) => setSsid(e.target.value)}
            placeholder="Enter your WiFi network name"
            className="w-full rounded-lg border border-slate-200/80 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 dark:border-white/15 dark:bg-white/10 dark:text-white dark:placeholder-white/40"
          />
        </div>

        <div>
          <label htmlFor="wifi-password" className="mb-1 block text-xs font-medium opacity-80">
            WiFi Password
          </label>
          <div className="relative">
            <input
              id="wifi-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your WiFi password"
              className="w-full rounded-lg border border-slate-200/80 bg-white px-3 py-2 pr-16 text-sm text-slate-900 placeholder-slate-400 dark:border-white/15 dark:bg-white/10 dark:text-white dark:placeholder-white/40"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-xs font-medium opacity-60 hover:opacity-100"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        {detectedPort && isLocalhost && (
          <p className="text-xs opacity-60">
            Detected device on <span className="font-mono font-medium">{detectedPort}</span>
          </p>
        )}

        <button
          type="button"
          onClick={sendWifiConfig}
          disabled={!ssid.trim() || status === "sending"}
          className="rounded-lg border border-violet-300/80 bg-violet-500/90 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-violet-500 disabled:opacity-50 dark:border-violet-500/40"
        >
          {status === "sending" ? "Sending..." : `Send to ${device === "pi" ? "Raspberry Pi" : "ESP32"}${detectedPort ? ` (${detectedPort})` : ""}`}
        </button>

        {statusMsg && (
          <div
            className={`rounded-lg border px-3 py-2.5 text-xs leading-relaxed ${
              status === "success"
                ? "border-emerald-200/60 bg-emerald-50/60 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
                : "border-red-200/60 bg-red-50/60 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300"
            }`}
          >
            {statusMsg}
          </div>
        )}
      </div>

      <div className="rounded-lg border border-slate-200/60 bg-slate-50/60 px-3 py-2.5 text-xs leading-relaxed text-slate-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-400">
        {device === "pi" ? (
          <p>
            The Pi must be connected via USB and running <code className="text-[11px]">serial-wifi-listener.py</code>.
            Credentials are sent over the USB serial port ({detectedPort || "auto-detected"}).
            Once WiFi is configured, the Pi will connect wirelessly and you can unplug USB.
          </p>
        ) : (
          <p>
            The ESP32 must be connected via USB. Credentials are sent over the serial connection.
            The firmware must support the <code className="text-[11px]">wifi_config</code> serial command.
          </p>
        )}
        <p className="mt-1.5">
          You can also use the standalone setup tool: <code className="text-[11px]">python scripts/sensor-setup.py</code>
        </p>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/*  Shared UI primitives                                               */
/* ------------------------------------------------------------------ */

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white/70 p-5 shadow-sm backdrop-blur dark:border-white/15 dark:bg-white/5 dark:shadow-none sm:p-6">
      <h2 className="mb-4 flex items-center gap-2 text-base font-semibold sm:text-lg">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100/80 text-slate-600 dark:bg-white/10 dark:text-slate-300">
          {icon}
        </span>
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function SettingRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </div>
  );
}

function SegmentedControl({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-slate-200/80 bg-slate-100/60 p-0.5 dark:border-white/15 dark:bg-white/5">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            value === opt.value
              ? "bg-white text-slate-900 shadow-sm dark:bg-white/20 dark:text-white"
              : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Icons (inline SVG)                                                 */
/* ------------------------------------------------------------------ */

function SunIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
      <path d="M10 2a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 2ZM10 15a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 15ZM10 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM15.657 5.404a.75.75 0 1 0-1.06-1.06l-1.061 1.06a.75.75 0 0 0 1.06 1.061l1.06-1.06ZM6.464 14.596a.75.75 0 1 0-1.06-1.06l-1.06 1.06a.75.75 0 0 0 1.06 1.06l1.06-1.06ZM18 10a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 18 10ZM5 10a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 5 10ZM14.596 15.657a.75.75 0 0 0 1.06-1.06l-1.06-1.061a.75.75 0 1 0-1.06 1.06l1.06 1.06ZM5.404 6.464a.75.75 0 0 0 1.06-1.06l-1.06-1.06a.75.75 0 1 0-1.06 1.06l1.06 1.06Z" />
    </svg>
  );
}

function CpuIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
      <path d="M14 6H6v8h8V6Z" />
      <path fillRule="evenodd" d="M9.25 3V1.75a.75.75 0 0 1 1.5 0V3h1.5V1.75a.75.75 0 0 1 1.5 0V3h.5A2.75 2.75 0 0 1 17 5.75v.5h1.25a.75.75 0 0 1 0 1.5H17v1.5h1.25a.75.75 0 0 1 0 1.5H17v1.5h1.25a.75.75 0 0 1 0 1.5H17v.5A2.75 2.75 0 0 1 14.25 17h-.5v1.25a.75.75 0 0 1-1.5 0V17h-1.5v1.25a.75.75 0 0 1-1.5 0V17h-1.5v1.25a.75.75 0 0 1-1.5 0V17h-.5A2.75 2.75 0 0 1 3 14.25v-.5H1.75a.75.75 0 0 1 0-1.5H3v-1.5H1.75a.75.75 0 0 1 0-1.5H3v-1.5H1.75a.75.75 0 0 1 0-1.5H3v-.5A2.75 2.75 0 0 1 5.75 3h.5V1.75a.75.75 0 0 1 1.5 0V3h1.5ZM4.5 5.75c0-.69.56-1.25 1.25-1.25h8.5c.69 0 1.25.56 1.25 1.25v8.5c0 .69-.56 1.25-1.25 1.25h-8.5c-.69 0-1.25-.56-1.25-1.25v-8.5Z" clipRule="evenodd" />
    </svg>
  );
}

function WifiIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
      <path fillRule="evenodd" d="M.676 6.941A12.964 12.964 0 0 1 10 3.5c3.58 0 6.86 1.318 9.324 3.441a.75.75 0 0 1-.948 1.16A11.464 11.464 0 0 0 10 5a11.464 11.464 0 0 0-8.376 3.101.75.75 0 0 1-.948-1.16ZM3.545 10.03A9.462 9.462 0 0 1 10 7.5a9.462 9.462 0 0 1 6.455 2.53.75.75 0 1 1-1.01 1.11A7.962 7.962 0 0 0 10 9a7.962 7.962 0 0 0-5.445 2.14.75.75 0 0 1-1.01-1.11ZM6.413 13.12A5.96 5.96 0 0 1 10 11.5c1.378 0 2.644.476 3.587 1.62a.75.75 0 1 1-1.174.93A4.46 4.46 0 0 0 10 13a4.46 4.46 0 0 0-2.413 1.05.75.75 0 1 1-1.174-.93ZM10 14.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z" clipRule="evenodd" />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
      <path d="M11.983 1.907a.75.75 0 0 0-1.292-.657l-8.5 9.5A.75.75 0 0 0 2.75 12h6.572l-1.305 6.093a.75.75 0 0 0 1.292.657l8.5-9.5A.75.75 0 0 0 17.25 8h-6.572l1.305-6.093Z" />
    </svg>
  );
}
