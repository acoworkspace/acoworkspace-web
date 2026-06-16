import { NextRequest, NextResponse } from "next/server";
import { getCalendarClient } from "@/lib/google-calendar";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { room_id, room_name } = await req.json();
  const calendar = getCalendarClient();

  // Create new calendar in Google
  const res = await calendar.calendars.insert({
    requestBody: { summary: room_name },
  });

  const calendarId = res.data.id!;

  // Save calendar ID to room
  await supabaseAdmin()
    .from("rooms")
    .update({ google_calendar_id: calendarId })
    .eq("id", room_id);

  return NextResponse.json({ ok: true, calendarId, summary: res.data.summary });
}
