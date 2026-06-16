import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getCalendarClient } from "@/lib/google-calendar";

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date"); // YYYY-MM-DD
  const room_id = req.nextUrl.searchParams.get("room_id");

  const admin = supabaseAdmin();

  if (room_id && date) {
    const start = `${date}T00:00:00`;
    const end = `${date}T23:59:59`;

    // Get room to find its google_calendar_id
    const { data: room } = await admin
      .from("rooms")
      .select("google_calendar_id")
      .eq("id", room_id)
      .single();

    // Supabase bookings
    const { data: dbBookings } = await admin
      .from("bookings")
      .select("start_time, end_time")
      .eq("room_id", room_id)
      .eq("status", "confirmed")
      .gte("start_time", start)
      .lte("start_time", end);

    const bookings: { start_time: string; end_time: string }[] = dbBookings ?? [];

    // Google Calendar events (source of truth for events created directly in Calendar)
    if (room?.google_calendar_id && process.env.GOOGLE_REFRESH_TOKEN) {
      try {
        const calendar = getCalendarClient();
        const res = await calendar.events.list({
          calendarId: room.google_calendar_id,
          timeMin: `${date}T00:00:00-03:00`,
          timeMax: `${date}T23:59:59-03:00`,
          singleEvents: true,
          maxResults: 100,
        });

        for (const event of res.data.items ?? []) {
          if (event.status === "cancelled") continue;
          if (!event.start?.dateTime || !event.end?.dateTime) continue;

          // Only add if not already in Supabase (avoid duplicates from app-created events)
          const alreadyInDb = bookings.some(
            (b) => b.start_time === event.start!.dateTime || b.start_time.startsWith(event.start!.dateTime!.substring(0, 16))
          );
          if (!alreadyInDb) {
            bookings.push({
              start_time: event.start.dateTime,
              end_time: event.end.dateTime,
            });
          }
        }
      } catch (err) {
        console.error("Failed to fetch Google Calendar events:", err);
      }
    }

    return NextResponse.json({ bookings });
  }

  // Return all active rooms
  const { data: rooms } = await admin
    .from("rooms")
    .select("*")
    .eq("is_active", true)
    .order("sede")
    .order("name");

  return NextResponse.json({ rooms: rooms ?? [] });
}
