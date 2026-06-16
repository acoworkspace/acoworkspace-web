import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { section, key, value } = await req.json();
  if (!section || !key) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const admin = supabaseAdmin();
  await admin.from("site_content").upsert({ section, key, value, updated_at: new Date().toISOString() });
  return NextResponse.json({ ok: true });
}
