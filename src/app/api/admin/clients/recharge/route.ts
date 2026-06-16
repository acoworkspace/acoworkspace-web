import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// POST: recharge points for one or all approved users
export async function POST(req: NextRequest) {
  const { user_ids, amount, use_monthly } = await req.json();
  // user_ids: string[] | null (null = all approved)
  // amount: number | null (null = use each user's monthly_points)
  // use_monthly: boolean

  const admin = supabaseAdmin();

  let query = admin.from("profiles").select("id, monthly_points").eq("status", "approved");
  if (user_ids?.length) query = query.in("id", user_ids);

  const { data: profiles } = await query;
  if (!profiles?.length) return NextResponse.json({ ok: true, recharged: 0 });

  let recharged = 0;
  for (const p of profiles) {
    const delta = use_monthly ? (p.monthly_points ?? 0) : (amount ?? 0);
    if (delta <= 0) continue;
    await admin.rpc("deduct_points", {
      p_user_id: p.id,
      p_delta: delta,
      p_booking_id: null,
      p_description: `Recarga mensual — ${new Date().toLocaleString("es-AR", { month: "long", year: "numeric" })}`,
    });
    recharged++;
  }

  return NextResponse.json({ ok: true, recharged });
}
