import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { deleteCalendarEvent } from "@/lib/google-calendar";

export async function POST(req: NextRequest) {
  const { booking_id } = await req.json();
  if (!booking_id) return NextResponse.json({ error: "Missing booking_id" }, { status: 400 });

  const admin = supabaseAdmin();

  const { data: booking } = await admin
    .from("bookings")
    .select("id, google_event_id, room:rooms(google_calendar_id)")
    .eq("id", booking_id)
    .single();

  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  await admin.from("bookings").update({ status: "cancelled" }).eq("id", booking_id);

  if (booking.google_event_id && process.env.GOOGLE_REFRESH_TOKEN) {
    try {
      const calId = (booking as { room?: { google_calendar_id?: string } }).room?.google_calendar_id ?? undefined;
      await deleteCalendarEvent(booking.google_event_id, calId);
    } catch (err) {
      console.error("Failed to delete calendar event:", err);
    }
  }

  return NextResponse.json({ ok: true });
}
