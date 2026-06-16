import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { user_id, delta, description } = await req.json();
  if (!user_id || delta === undefined) {
    return NextResponse.json({ error: "Faltan campos." }, { status: 400 });
  }

  const admin = supabaseAdmin();

  await admin.rpc("deduct_points", {
    p_user_id: user_id,
    p_delta: delta,
    p_booking_id: null,
    p_description: description ?? "Ajuste manual",
  });

  const { data: profile } = await admin
    .from("profiles")
    .select("aco_points")
    .eq("id", user_id)
    .single();

  return NextResponse.json({ ok: true, aco_points: profile?.aco_points });
}
