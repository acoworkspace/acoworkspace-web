import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const admin = supabaseAdmin();

  const [{ data: profiles }, { data: { users } }, { data: history }] = await Promise.all([
    admin.from("profiles").select("*").order("created_at", { ascending: false }),
    admin.auth.admin.listUsers({ perPage: 1000 }),
    admin.from("points_history").select("user_id, delta, created_at"),
  ]);

  if (!profiles?.length) return NextResponse.json({ clients: [] });

  const emailMap = new Map(users.map((u) => [u.id, u.email ?? ""]));

  const clients = profiles.map((p) => {
    const userHistory = (history ?? []).filter((h) => h.user_id === p.id);
    const totalGiven = userHistory.filter((h) => h.delta > 0).reduce((sum, h) => sum + h.delta, 0);
    const totalSpent = Math.abs(userHistory.filter((h) => h.delta < 0).reduce((sum, h) => sum + h.delta, 0));

    // Monthly average spent — based on months since registration
    const registeredAt = new Date(p.created_at);
    const now = new Date();
    const monthsSince = Math.max(
      1,
      (now.getFullYear() - registeredAt.getFullYear()) * 12 + (now.getMonth() - registeredAt.getMonth()) + 1
    );
    const monthlyAvg = Math.round(totalSpent / monthsSince);

    return {
      ...p,
      email: emailMap.get(p.id) ?? "",
      total_given: totalGiven,
      total_spent: totalSpent,
      monthly_avg: monthlyAvg,
    };
  });

  return NextResponse.json({ clients });
}
