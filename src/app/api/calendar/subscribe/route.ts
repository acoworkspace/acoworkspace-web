import { NextResponse } from "next/server";
import { getCalendarClient, DEFAULT_CALENDAR_ID } from "@/lib/google-calendar";

// Call this once after setup to register the webhook with Google
export async function POST() {
  const calendar = getCalendarClient();
  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/calendar/webhook`;

  const res = await calendar.events.watch({
    calendarId: DEFAULT_CALENDAR_ID,
    requestBody: {
      id: `aco-calendar-channel-${Date.now()}`,
      type: "web_hook",
      address: webhookUrl,
      expiration: String(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  return NextResponse.json({
    ok: true,
    channelId: res.data.id,
    expiration: res.data.expiration,
    message: "Webhook registered. Renew before expiration.",
  });
}
