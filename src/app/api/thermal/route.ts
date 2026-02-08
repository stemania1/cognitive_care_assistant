import { NextResponse } from "next/server";
import { SENSOR_CONFIG, getPiHost } from "@/app/config/sensor-config";
import { getThermalData } from "@/lib/thermal-data-store";

export const runtime = "nodejs";

export async function GET(request: Request) {
  // First, check if we have Bluetooth data (more recent than 30 seconds)
  const btData = getThermalData();
  if (btData.data && btData.isConnected) {
    // Convert timestamp to number if it's a string
    const timestamp = typeof btData.data.timestamp === 'string'
      ? new Date(btData.data.timestamp).getTime()
      : btData.data.timestamp;
    
    return NextResponse.json({
      ...btData.data,
      timestamp: timestamp
    }, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
  
  // Client requests "Bluetooth only" by not sending ip/port — never fall back to Pi (server doesn't know client's connection mode)
  const { searchParams } = new URL(request.url);
  const ipParam = searchParams.get("ip");
  const portParam = searchParams.get("port");
  const wantsBluetoothOnly = ipParam == null && portParam == null;

  if (wantsBluetoothOnly) {
    return NextResponse.json({
      status: 'no_data',
      isConnected: false,
      data: null,
      timeSinceLastUpdate: btData.timeSinceLastUpdate
    }, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  // Fallback to WiFi/USB HTTP connection to Raspberry Pi (only when client sent ip/port)
  const port = portParam ?? process.env.PI_PORT ?? String(SENSOR_CONFIG.HTTP_PORT);
  const primaryHost = ipParam ?? process.env.PI_HOST ?? getPiHost();
  const backupHost = SENSOR_CONFIG.RASPBERRY_PI_IP_BACKUP?.trim() || null;
  const hostsToTry = backupHost && backupHost !== primaryHost ? [primaryHost, backupHost] : [primaryHost];

  for (let i = 0; i < hostsToTry.length; i++) {
    const host = hostsToTry[i];
    const isBackup = i === 1;
    const url = `http://${host}:${port}/thermal-data`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      try {
        const res = await fetch(url, { cache: "no-store", signal: controller.signal });
        clearTimeout(timeoutId);

        if (!res.ok) {
          if (isBackup) {
            console.error(`[API Thermal] Backup ${host} returned ${res.status}, giving up.`);
          }
          console.error(`[API Thermal] Upstream error: ${res.status} ${res.statusText} from ${url}`);
          return NextResponse.json(
            { error: `Upstream error: ${res.status} ${res.statusText}`, status: res.status },
            { status: 502 }
          );
        }

        const data = await res.json();
        if (isBackup) {
          console.log(`[API Thermal] Primary unreachable; using backup Pi at ${host}`);
        }
        return NextResponse.json({
          ...data,
          _connection: { host, isBackup },
        }, { status: 200 });
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (isBackup) {
          console.error(`[API Thermal] Backup ${host} failed:`, fetchError?.message);
          throw fetchError;
        }
        if (hostsToTry.length > 1) {
          console.log(`[API Thermal] Primary ${host} failed, trying backup ${backupHost}...`);
        } else {
          throw fetchError;
        }
      }
    } catch (error: any) {
      if (i < hostsToTry.length - 1) continue;

      console.error(`[API Thermal] Proxy request failed:`, {
        message: error?.message,
        code: error?.code,
        host,
      });

      const errorMessage = error?.message || "Proxy request failed";
      const errorCode = error?.code || error?.cause?.code;

      if (errorCode === 'ECONNREFUSED') {
        return NextResponse.json(
          {
            error: `Connection refused: Raspberry Pi at ${host}:${port} is not reachable. Is the service running?`,
            details: 'The service may not be running on the Raspberry Pi. Check with: sudo systemctl status amg883-headless.service'
          },
          { status: 503 }
        );
      }
      if (errorCode === 'AbortError' || errorCode === 'ETIMEDOUT' || errorCode === 'EHOSTUNREACH' || errorCode === 'ENETUNREACH') {
        return NextResponse.json(
          {
            error: `Network error: Cannot reach Raspberry Pi at ${host}:${port}. Check network connection.`,
            details: `Try: ping ${host} or curl http://${host}:${port}/thermal-data`
          },
          { status: 503 }
        );
      }
      if (errorCode === 'ENOTFOUND' || errorCode === 'EAI_AGAIN') {
        return NextResponse.json(
          { error: `DNS/Hostname error: Cannot resolve ${host}`, details: 'Check if the IP address is correct' },
          { status: 503 }
        );
      }

      return NextResponse.json(
        { error: errorMessage, code: errorCode || 'UNKNOWN', details: `Troubleshooting: curl http://${host}:${port}/thermal-data` },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ error: 'No Pi host to try' }, { status: 500 });
}


