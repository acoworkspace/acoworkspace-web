import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { user_id, status } = await req.json();
  if (!user_id || !["approved", "rejected"].includes(status)) {
    return NextResponse.json({ error: "Parámetros inválidos." }, { status: 400 });
  }

  const admin = supabaseAdmin();
  await admin.from("profiles").update({ status }).eq("id", user_id);

  return NextResponse.json({ ok: true });
}
