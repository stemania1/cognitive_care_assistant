import { NextResponse } from "next/server";
import { SENSOR_CONFIG } from "@/app/config/sensor-config";

export const runtime = "nodejs";

export async function GET(request: Request) {
  // Define these with fallbacks so they're accessible in catch block
  let host = SENSOR_CONFIG.RASPBERRY_PI_IP;
  let port = String(SENSOR_CONFIG.HTTP_PORT);
  
  try {
    const { searchParams } = new URL(request.url);
    const ipParam = searchParams.get("ip");
    const portParam = searchParams.get("port");
    
    host = ipParam || process.env.PI_HOST || SENSOR_CONFIG.RASPBERRY_PI_IP;
    port = portParam || process.env.PI_PORT || String(SENSOR_CONFIG.HTTP_PORT);
    const url = `http://${host}:${port}/thermal-data`;
    
    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    try {
      const res = await fetch(url, { 
        cache: "no-store",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        console.error(`[API Thermal] Upstream error: ${res.status} ${res.statusText} from ${url}`);
        return NextResponse.json(
          { error: `Upstream error: ${res.status} ${res.statusText}`, status: res.status },
          { status: 502 }
        );
      }

      const data = await res.json();
      return NextResponse.json(data, { status: 200 });
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.error(`[API Thermal] Request timeout to ${url}`);
        return NextResponse.json(
          { error: `Request timeout: Raspberry Pi at ${host}:${port} did not respond within 5 seconds` },
          { status: 504 }
        );
      }
      throw fetchError; // Re-throw to be caught by outer catch
    }
  } catch (error: any) {
    // Log full error details for debugging
    console.error(`[API Thermal] Proxy request failed:`, {
      message: error?.message,
      code: error?.code,
      cause: error?.cause,
      errno: error?.errno,
      syscall: error?.syscall,
      address: error?.address,
      port: error?.port,
      stack: error?.stack,
    });
    
    const errorMessage = error?.message || "Proxy request failed";
    const errorCode = error?.code || error?.cause?.code;
    
    // Provide more helpful error messages based on error codes
    if (errorCode === 'ECONNREFUSED') {
      return NextResponse.json(
        { 
          error: `Connection refused: Raspberry Pi at ${host}:${port} is not reachable. Is the service running?`,
          details: 'The service may not be running on the Raspberry Pi. Check with: sudo systemctl status amg883-headless.service'
        },
        { status: 503 }
      );
    }
    if (errorCode === 'ETIMEDOUT' || errorCode === 'EHOSTUNREACH' || errorCode === 'ENETUNREACH') {
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
        { 
          error: `DNS/Hostname error: Cannot resolve ${host}`,
          details: 'Check if the IP address is correct'
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        code: errorCode || 'UNKNOWN',
        details: `Troubleshooting: 1) Check service status on Pi: sudo systemctl status amg883-headless.service 2) Test connection: curl http://${host}:${port}/thermal-data 3) Verify Pi is on network: ping ${host}`
      },
      { status: 500 }
    );
  }
}


