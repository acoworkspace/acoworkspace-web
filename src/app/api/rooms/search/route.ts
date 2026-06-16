import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getCalendarClient } from "@/lib/google-calendar";

// Returns rooms available for a given time range
export async function GET(req: NextRequest) {
  const start = req.nextUrl.searchParams.get("start"); // ISO datetime
  const end = req.nextUrl.searchParams.get("end");     // ISO datetime

  if (!start || !end) {
    return NextResponse.json({ error: "Missing start/end" }, { status: 400 });
  }

  const startDate = new Date(start);
  const dayOfWeek = startDate.getDay();
  const admin = supabaseAdmin();

  // Get all active rooms available on that day of week
  const { data: rooms } = await admin
    .from("rooms")
    .select("*")
    .eq("is_active", true)
    .order("sede").order("name");

  if (!rooms) return NextResponse.json({ rooms: [] });

  // Filter rooms by day-of-week and hours
  const startMinutes = startDate.getHours() * 60 + startDate.getMinutes();
  const endDate = new Date(end);
  const endMinutes = endDate.getHours() * 60 + endDate.getMinutes();

  const eligibleRooms = rooms.filter((r) => {
    if (!r.available_days.includes(dayOfWeek)) return false;
    const [fh, fm] = r.available_from.split(":").map(Number);
    const [th, tm] = r.available_to.split(":").map(Number);
    const roomFrom = fh * 60 + fm;
    const roomTo = th * 60 + tm;
    return startMinutes >= roomFrom && endMinutes <= roomTo;
  });

  // Check Supabase bookings for conflicts
  const { data: conflicts } = await admin
    .from("bookings")
    .select("room_id")
    .in("room_id", eligibleRooms.map((r) => r.id))
    .eq("status", "confirmed")
    .lt("start_time", end)
    .gt("end_time", start);

  const conflictingRoomIds = new Set((conflicts ?? []).map((c) => c.room_id));

  // Check Google Calendar for conflicts
  const calendarClient = process.env.GOOGLE_REFRESH_TOKEN ? getCalendarClient() : null;

  for (const room of eligibleRooms) {
    if (!room.google_calendar_id || !calendarClient || conflictingRoomIds.has(room.id)) continue;
    try {
      const res = await calendarClient.freebusy.query({
        requestBody: {
          timeMin: start,
          timeMax: end,
          items: [{ id: room.google_calendar_id }],
        },
      });
      const busy = res.data.calendars?.[room.google_calendar_id]?.busy ?? [];
      if (busy.length > 0) conflictingRoomIds.add(room.id);
    } catch {
      // ignore calendar errors
    }
  }

  const available = eligibleRooms.filter((r) => !conflictingRoomIds.has(r.id));

  return NextResponse.json({ rooms: available });
}
