import { NextRequest, NextResponse } from "next/server";
import { getOAuthClient } from "@/lib/google-calendar";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.json({ error: "No code" }, { status: 400 });
  }

  const oauth = getOAuthClient();
  const { tokens } = await oauth.getToken(code);

  // Show the refresh token so we can copy it into env vars
  return new NextResponse(
    `<html><body style="font-family:monospace;padding:2rem;background:#111;color:#eee">
      <h2 style="color:#fff">✅ Google Calendar autorizado</h2>
      <p>Copiá este refresh token y agregalo a tus variables de entorno como <code>GOOGLE_REFRESH_TOKEN</code>:</p>
      <pre style="background:#222;padding:1rem;border-radius:8px;word-break:break-all">${tokens.refresh_token ?? "(ya tenías uno guardado — no se regenera)"}</pre>
      <p style="color:#666;font-size:0.85rem">Una vez guardado en .env.local y en Vercel, podés cerrar esta página.</p>
    </body></html>`,
    { headers: { "Content-Type": "text/html" } }
  );
}
