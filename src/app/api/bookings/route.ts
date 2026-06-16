import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";
import { createCalendarEvent, calendarEventExists } from "@/lib/google-calendar";
import { transporter } from "@/lib/mailer";

function minutesBetween(start: string, end: string) {
  return (new Date(end).getTime() - new Date(start).getTime()) / 60000;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { room_id, guest_name, guest_email, start_time, end_time, notes } = body;

  if (!room_id || !start_time || !end_time) {
    return NextResponse.json({ error: "Faltan campos requeridos." }, { status: 400 });
  }

  // Check if request comes from a logged-in user
  const authHeader = req.headers.get("authorization");
  let userId: string | null = null;

  if (authHeader) {
    const token = authHeader.replace("Bearer ", "");
    const userClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: { user } } = await userClient.auth.getUser(token);
    userId = user?.id ?? null;
  }

  const admin = supabaseAdmin();

  // Get room info
  const { data: room } = await admin
    .from("rooms")
    .select("name, sede, google_calendar_id, points_per_hour")
    .eq("id", room_id)
    .single();

  if (!room) return NextResponse.json({ error: "Sala no encontrada." }, { status: 404 });

  // Calculate points cost
  const durationHours = minutesBetween(start_time, end_time) / 60;
  const pointsCost = Math.ceil(durationHours * (room.points_per_hour ?? 1));

  // If logged-in user → validate and deduct points
  if (userId) {
    const { data: profile } = await admin
      .from("profiles")
      .select("aco_points")
      .eq("id", userId)
      .single();

    if (!profile) return NextResponse.json({ error: "Perfil no encontrado." }, { status: 404 });
    if (profile.aco_points < pointsCost) {
      return NextResponse.json({
        error: `No tenés suficientes ACO Points. Necesitás ${pointsCost}, tenés ${profile.aco_points}.`,
        points_needed: pointsCost,
        points_available: profile.aco_points,
      }, { status: 402 });
    }
  }

  // Check for conflicts
  const { data: conflicts } = await admin
    .from("bookings")
    .select("id, google_event_id, room:rooms(google_calendar_id)")
    .eq("room_id", room_id)
    .eq("status", "confirmed")
    .lt("start_time", end_time)
    .gt("end_time", start_time);

  if (conflicts && conflicts.length > 0) {
    // Auto-cancel bookings whose calendar event was deleted externally
    const stale = await Promise.all(
      conflicts.map(async (c) => {
        if (!c.google_event_id) return false;
        const calId = (c as { room?: { google_calendar_id?: string } }).room?.google_calendar_id ?? undefined;
        const exists = await calendarEventExists(c.google_event_id, calId);
        if (!exists) {
          await admin.from("bookings").update({ status: "cancelled" }).eq("id", c.id);
          return true;
        }
        return false;
      })
    );
    if (!stale.every(Boolean)) {
      return NextResponse.json({ error: "La sala ya está reservada en ese horario." }, { status: 409 });
    }
  }

  // Create booking
  const { data: booking, error } = await admin
    .from("bookings")
    .insert({
      room_id,
      user_id: userId,
      guest_name: guest_name ?? null,
      guest_email: guest_email ?? null,
      start_time,
      end_time,
      status: "confirmed",
      notes: notes ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Deduct points from user profile
  if (userId && pointsCost > 0) {
    await admin.rpc("deduct_points", {
      p_user_id: userId,
      p_delta: -pointsCost,
      p_booking_id: booking.id,
      p_description: `Reserva ${room.name} — ${durationHours}h`,
    });
  }

  // Sync to Google Calendar
  if (process.env.GOOGLE_REFRESH_TOKEN && room) {
    try {
      const event = await createCalendarEvent({
        title: `Reserva — ${room.name} (${room.sede})`,
        description: [
          guest_name && `Cliente: ${guest_name}`,
          guest_email && `Email: ${guest_email}`,
          notes && `Notas: ${notes}`,
          userId && `Puntos descontados: ${pointsCost}`,
        ].filter(Boolean).join("\n"),
        startTime: start_time,
        endTime: end_time,
        attendeeEmail: guest_email ?? undefined,
        calendarId: (room as { google_calendar_id?: string }).google_calendar_id ?? undefined,
      });

      await admin.from("bookings").update({ google_event_id: event.id }).eq("id", booking.id);
    } catch (err) {
      console.error("Google Calendar sync failed:", err);
    }
  }

  // Notify reception
  try {
    const dateStr = new Date(start_time).toLocaleDateString("es-AR", {
      weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "America/Argentina/Buenos_Aires",
    });
    const startStr = new Date(start_time).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Argentina/Buenos_Aires" });
    const endStr = new Date(end_time).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Argentina/Buenos_Aires" });

    await transporter.sendMail({
      from: `"ACO Workspace" <${process.env.GMAIL_USER}>`,
      to: "recepcion@acoworkspace.com",
      subject: `Nueva reserva — ${room.name} (${dateStr})`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #111;">
          <div style="background: linear-gradient(135deg, #C0201A, #E03A1A); height: 4px; border-radius: 4px 4px 0 0;"></div>
          <div style="padding: 32px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 8px 8px;">
            <h2 style="margin: 0 0 8px; font-size: 22px;">Nueva reserva confirmada</h2>
            <div style="background: #f9f9f9; border-radius: 8px; padding: 20px; margin: 24px 0;">
              <p style="margin: 0 0 12px; font-weight: 700; font-size: 16px;">${room.name} — ${room.sede}</p>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 6px 0; color: #666; width: 40%;">Fecha</td><td style="padding: 6px 0; font-weight: 500; text-transform: capitalize;">${dateStr}</td></tr>
                <tr><td style="padding: 6px 0; color: #666;">Horario</td><td style="padding: 6px 0; font-weight: 500;">${startStr} – ${endStr} hs</td></tr>
                <tr><td style="padding: 6px 0; color: #666;">Cliente</td><td style="padding: 6px 0; font-weight: 500;">${guest_name ?? "Usuario registrado"}</td></tr>
                <tr><td style="padding: 6px 0; color: #666;">Email</td><td style="padding: 6px 0; font-weight: 500;">${guest_email ?? "—"}</td></tr>
                ${notes ? `<tr><td style="padding: 6px 0; color: #666;">Notas</td><td style="padding: 6px 0; font-weight: 500;">${notes}</td></tr>` : ""}
                ${userId && pointsCost > 0 ? `<tr><td style="padding: 6px 0; color: #666;">ACO Points</td><td style="padding: 6px 0; font-weight: 500;">−${pointsCost} pts</td></tr>` : ""}
              </table>
            </div>
            <p style="margin: 0; color: #888; font-size: 13px;">ID de reserva: ${booking.id}</p>
          </div>
        </div>
      `,
    });
  } catch (err) {
    console.error("Reception notification email failed:", err);
  }

  // Send confirmation email to guest
  if (guest_email) {
    try {
      const dateStr = new Date(start_time).toLocaleDateString("es-AR", {
        weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "America/Argentina/Buenos_Aires",
      });
      const startStr = new Date(start_time).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Argentina/Buenos_Aires" });
      const endStr = new Date(end_time).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Argentina/Buenos_Aires" });

      await transporter.sendMail({
        from: `"ACO Workspace" <${process.env.GMAIL_USER}>`,
        to: guest_email,
        subject: `Reserva confirmada — ${room.name}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #111;">
            <div style="background: linear-gradient(135deg, #C0201A, #E03A1A); height: 4px; border-radius: 4px 4px 0 0;"></div>
            <div style="padding: 32px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 8px 8px;">
              <h2 style="margin: 0 0 8px; font-size: 22px;">¡Reserva confirmada!</h2>
              <p style="margin: 0 0 24px; color: #666;">Hola${guest_name ? ` ${guest_name.split(" ")[0]}` : ""}, tu reserva en ACO Workspace está confirmada.</p>

              <div style="background: #f9f9f9; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                <p style="margin: 0 0 12px; font-weight: 700; font-size: 16px;">${room.name}</p>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr><td style="padding: 6px 0; color: #666; width: 40%;">Sede</td><td style="padding: 6px 0; font-weight: 500;">${room.sede}</td></tr>
                  <tr><td style="padding: 6px 0; color: #666;">Fecha</td><td style="padding: 6px 0; font-weight: 500; text-transform: capitalize;">${dateStr}</td></tr>
                  <tr><td style="padding: 6px 0; color: #666;">Horario</td><td style="padding: 6px 0; font-weight: 500;">${startStr} – ${endStr} hs</td></tr>
                  ${userId && pointsCost > 0 ? `<tr><td style="padding: 6px 0; color: #666;">ACO Points</td><td style="padding: 6px 0; font-weight: 500;">−${pointsCost} pts</td></tr>` : ""}
                </table>
              </div>

              <div style="margin-bottom: 24px;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/api/bookings/${booking.id}/cancel" style="display: inline-block; background: #f5f5f5; color: #666; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 14px; border: 1px solid #e0e0e0;">Cancelar reserva</a>
              </div>

              <p style="margin: 0; color: #888; font-size: 13px;">¿Tenés alguna pregunta? Escribinos a <a href="mailto:info@acoworkspace.com" style="color: #C0201A;">info@acoworkspace.com</a></p>
            </div>
          </div>
        `,
      });
    } catch (err) {
      console.error("Booking confirmation email failed:", err);
    }
  }

  return NextResponse.json({ ok: true, booking, points_used: userId ? pointsCost : 0 });
}
