import { NextResponse } from "next/server";
import { SENSOR_CONFIG } from "@/app/config/sensor-config";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ipParam = searchParams.get("ip");
    const portParam = searchParams.get("port");

    const host = ipParam || process.env.PI_HOST || SENSOR_CONFIG.RASPBERRY_PI_IP;
    const port = portParam || process.env.PI_PORT || String(SENSOR_CONFIG.HTTP_PORT);

    const url = `http://${host}:${port}/thermal-data`;
    const res = await fetch(url, { cache: "no-store" });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Upstream error`, status: res.status },
        { status: 502 }
      );
    }

    const data = await res.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Proxy request failed" },
      { status: 500 }
    );
  }
}


