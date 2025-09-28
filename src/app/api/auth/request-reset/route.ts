import { NextResponse } from "next/server";
import crypto from "crypto";

function base64url(input: Buffer | string): string {
  const b = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return b.toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function getSecret(): string {
  return process.env.RESET_TOKEN_SECRET || "dev-insecure-reset-secret-change-me";
}

function createResetToken(email: string, ttlMs = 15 * 60 * 1000): string {
  const payload = { e: email, exp: Date.now() + ttlMs };
  const json = JSON.stringify(payload);
  const sig = crypto.createHmac("sha256", getSecret()).update(json).digest();
  return `${base64url(json)}.${base64url(sig)}`;
}

function getAppUrl(req: Request): string {
  const env = process.env.NEXT_PUBLIC_APP_URL;
  if (env) return env;
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
  const proto = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ ok: true });
    }

    const token = createResetToken(email.trim().toLowerCase());
    const url = `${getAppUrl(req)}/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;

    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
      // Lazy import only when API key is present; guard to avoid build/runtime failures when module isn't installed
      try {
        // Use require to further avoid type-resolution during build where module may be absent
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { Resend } = require("resend");
        const resend = new Resend(apiKey as string);
        await resend.emails.send({
          from: "Cognitive Care <no-reply@cognitivecare.local>",
          to: email,
          subject: "Reset your password",
          html: `<p>Click the link to reset your password (expires in 15 minutes):</p><p><a href="${url}">${url}</a></p>`,
        });
      } catch {
        // Ignore errors (missing module, network, etc.)
      }
      return NextResponse.json({ ok: true });
    }

    // Dev fallback: return URL in response for manual copy
    return NextResponse.json({ ok: true, resetUrl: url });
  } catch {
    return NextResponse.json({ ok: true });
  }
}



