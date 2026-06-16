import { NextResponse } from "next/server";
import { getCalendarClient } from "@/lib/google-calendar";

export async function GET() {
  const calendar = getCalendarClient();
  const res = await calendar.calendarList.list({ maxResults: 100 });
  const items = (res.data.items ?? []).map((c) => ({
    id: c.id,
    summary: c.summary,
    backgroundColor: c.backgroundColor,
  }));
  return NextResponse.json({ calendars: items });
}
