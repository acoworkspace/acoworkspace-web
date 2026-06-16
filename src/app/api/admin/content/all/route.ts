import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const admin = supabaseAdmin();
  const { data } = await admin.from("site_content").select("section, key, value");

  const content: Record<string, string> = {};
  for (const row of data ?? []) {
    content[`${row.section}.${row.key}`] = row.value ?? "";
  }
  return NextResponse.json({ content });
}
