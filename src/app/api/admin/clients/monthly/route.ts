import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { user_id, monthly_points } = await req.json();
  if (!user_id || monthly_points === undefined) {
    return NextResponse.json({ error: "Faltan campos." }, { status: 400 });
  }
  const admin = supabaseAdmin();
  await admin.from("profiles").update({ monthly_points }).eq("id", user_id);
  return NextResponse.json({ ok: true });
}
