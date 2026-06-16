import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getCalendarClient, DEFAULT_CALENDAR_ID } from "@/lib/google-calendar";

// Google Calendar push notifications — called when calendar changes
export async function POST(req: NextRequest) {
  const channelId = req.headers.get("x-goog-channel-id");
  const resourceState = req.headers.get("x-goog-resource-state");

  // Only process actual changes (not the initial sync message)
  if (!channelId || resourceState === "sync") {
    return NextResponse.json({ ok: true });
  }

  try {
    await syncCalendarToDb();
  } catch (err) {
    console.error("Calendar webhook sync error:", err);
  }

  return NextResponse.json({ ok: true });
}

async function syncCalendarToDb() {
  const calendar = getCalendarClient();
  const admin = supabaseAdmin();

  // Fetch events from the last 30 days to 6 months ahead
  const timeMin = new Date();
  timeMin.setDate(timeMin.getDate() - 30);
  const timeMax = new Date();
  timeMax.setMonth(timeMax.getMonth() + 6);

  const { data: events } = await calendar.events.list({
    calendarId: DEFAULT_CALENDAR_ID,
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: true,
    maxResults: 500,
  });

  if (!events.items) return;

  for (const event of events.items) {
    if (!event.id || !event.start?.dateTime || !event.end?.dateTime) continue;

    // Check if booking with this google_event_id exists
    const { data: existing } = await admin
      .from("bookings")
      .select("id, status")
      .eq("google_event_id", event.id)
      .maybeSingle();

    if (event.status === "cancelled") {
      // Cancel the booking if it exists
      if (existing) {
        await admin
          .from("bookings")
          .update({ status: "cancelled" })
          .eq("id", existing.id);
      }
      continue;
    }

    // Parse room from event description or title
    // Events created from Google Calendar directly: we try to match by title
    const roomName = extractRoomFromEvent(event.summary ?? "");
    if (!roomName) continue;

    const { data: room } = await admin
      .from("rooms")
      .select("id")
      .ilike("name", `%${roomName}%`)
      .maybeSingle();

    if (!room) continue;

    if (existing) {
      // Update times if changed
      await admin.from("bookings").update({
        start_time: event.start.dateTime,
        end_time: event.end.dateTime,
        status: "confirmed",
      }).eq("id", existing.id);
    } else {
      // Create new booking from calendar event
      await admin.from("bookings").insert({
        room_id: room.id,
        guest_name: event.organizer?.displayName ?? event.summary,
        guest_email: event.organizer?.email,
        start_time: event.start.dateTime,
        end_time: event.end.dateTime,
        status: "confirmed",
        google_event_id: event.id,
        notes: `Importado desde Google Calendar`,
      });
    }
  }
}

// Extract room name from event title: "Reserva — Sala Roble" or "Sala Roble — Cliente"
function extractRoomFromEvent(title: string): string | null {
  const patterns = [/sala\s+\w+/i, /room\s+\w+/i];
  for (const p of patterns) {
    const m = title.match(p);
    if (m) return m[0];
  }
  return null;
}
