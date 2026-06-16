import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { deleteCalendarEvent } from "@/lib/google-calendar";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = supabaseAdmin();

  const { data: booking } = await admin
    .from("bookings")
    .select("id, status, user_id, google_event_id, room:rooms(name, google_calendar_id, points_per_hour), start_time, end_time")
    .eq("id", id)
    .single();

  if (!booking) {
    return new NextResponse(cancelPage("Reserva no encontrada.", false), { headers: { "Content-Type": "text/html; charset=utf-8" } });
  }

  if (booking.status === "cancelled") {
    return new NextResponse(cancelPage("Esta reserva ya fue cancelada.", false), { headers: { "Content-Type": "text/html; charset=utf-8" } });
  }

  await admin.from("bookings").update({ status: "cancelled" }).eq("id", id);

  // Refund points to user
  if (booking.user_id) {
    const room = booking.room as { points_per_hour?: number } | null;
    const durationHours = (new Date(booking.end_time as string).getTime() - new Date(booking.start_time as string).getTime()) / 3600000;
    const pointsCost = Math.ceil(durationHours * (room?.points_per_hour ?? 1));
    if (pointsCost > 0) {
      await admin.rpc("deduct_points", {
        p_user_id: booking.user_id,
        p_delta: pointsCost,
        p_booking_id: booking.id,
        p_description: `Cancelacion reserva — reembolso ${pointsCost} pts`,
      });
    }
  }

  if (booking.google_event_id && process.env.GOOGLE_REFRESH_TOKEN) {
    try {
      const calId = (booking.room as { google_calendar_id?: string } | null)?.google_calendar_id ?? undefined;
      await deleteCalendarEvent(booking.google_event_id, calId);
    } catch (err) {
      console.error("Failed to delete calendar event:", err);
    }
  }

  return new NextResponse(cancelPage("Tu reserva fue cancelada exitosamente.", true), { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

function cancelPage(message: string, success: boolean) {
  const color = success ? "#16a34a" : "#dc2626";
  const icon = success ? "&#10003;" : "&#10007;";
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ACO Workspace</title></head>
<body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f9f9f9;">
  <div style="text-align:center;max-width:400px;padding:2rem;">
    <div style="width:64px;height:64px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;margin:0 auto 1.5rem;font-size:28px;color:#fff;">${icon}</div>
    <h2 style="margin:0 0 0.5rem;color:#111;">${message}</h2>
    <p style="color:#666;margin:0 0 1.5rem;">Si tenes alguna pregunta, escribinos a <a href="mailto:info@acoworkspace.com" style="color:#C0201A;">info@acoworkspace.com</a></p>
    <a href="https://acoworkspace.com" style="display:inline-block;background:#C0201A;color:#fff;padding:0.75rem 1.5rem;border-radius:8px;text-decoration:none;font-weight:600;">Volver al inicio</a>
  </div>
</body></html>`;
}
