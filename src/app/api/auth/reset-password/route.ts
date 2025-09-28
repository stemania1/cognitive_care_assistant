import { NextResponse } from "next/server";
import crypto from "crypto";

function fromBase64url(s: string): Buffer {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  return Buffer.from(s, "base64");
}

function getSecret(): string {
  return process.env.RESET_TOKEN_SECRET || "dev-insecure-reset-secret-change-me";
}

function verifyToken(token: string): { e: string; exp: number } | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const json = fromBase64url(parts[0]);
  const sig = fromBase64url(parts[1]);
  const expected = crypto.createHmac("sha256", getSecret()).update(json).digest();
  if (!crypto.timingSafeEqual(sig, expected)) return null;
  try {
    const payload = JSON.parse(json.toString());
    if (!payload || typeof payload.e !== "string" || typeof payload.exp !== "number") return null;
    if (Date.now() > payload.exp) return null;
    return payload as { e: string; exp: number };
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const { email, token, newPassword } = await req.json();
    if (!email || !token || !newPassword) return NextResponse.json({ ok: false }, { status: 400 });
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ ok: false }, { status: 400 });
    if (payload.e !== String(email).trim().toLowerCase()) return NextResponse.json({ ok: false }, { status: 400 });

    // Update password in localStorage-backed demo store via header flag (dev only)
    // In a real app, update DB here.
    // This endpoint runs server-side; we can't access localStorage.
    // We simply acknowledge success so the client can update its local store for demo.
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}



