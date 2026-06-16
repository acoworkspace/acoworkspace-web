import { google } from "googleapis";

export function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI ?? "http://localhost:3001/api/auth/google/callback"
  );
}

export function getCalendarClient() {
  const auth = getOAuthClient();
  auth.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });
  return google.calendar({ version: "v3", auth });
}

export const DEFAULT_CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID ?? "acoworkspace@gmail.com";

export async function createCalendarEvent(params: {
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  attendeeEmail?: string;
  calendarId?: string;
}) {
  const calendar = getCalendarClient();
  const res = await calendar.events.insert({
    calendarId: params.calendarId ?? DEFAULT_CALENDAR_ID,
    requestBody: {
      summary: params.title,
      description: params.description,
      start: { dateTime: params.startTime, timeZone: "America/Argentina/Buenos_Aires" },
      end: { dateTime: params.endTime, timeZone: "America/Argentina/Buenos_Aires" },
      attendees: params.attendeeEmail ? [{ email: params.attendeeEmail }] : undefined,
      status: "confirmed",
    },
  });
  return res.data;
}

export async function calendarEventExists(eventId: string, calendarId?: string): Promise<boolean> {
  try {
    const calendar = getCalendarClient();
    const res = await calendar.events.get({ calendarId: calendarId ?? DEFAULT_CALENDAR_ID, eventId });
    return res.data.status !== "cancelled";
  } catch {
    return false;
  }
}

export async function deleteCalendarEvent(eventId: string, calendarId?: string) {
  const calendar = getCalendarClient();
  await calendar.events.delete({ calendarId: calendarId ?? DEFAULT_CALENDAR_ID, eventId });
}

export async function updateCalendarEvent(eventId: string, params: {
  title?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  calendarId?: string;
}) {
  const calendar = getCalendarClient();
  const res = await calendar.events.patch({
    calendarId: params.calendarId ?? DEFAULT_CALENDAR_ID,
    eventId,
    requestBody: {
      ...(params.title && { summary: params.title }),
      ...(params.description && { description: params.description }),
      ...(params.startTime && {
        start: { dateTime: params.startTime, timeZone: "America/Argentina/Buenos_Aires" },
      }),
      ...(params.endTime && {
        end: { dateTime: params.endTime, timeZone: "America/Argentina/Buenos_Aires" },
      }),
    },
  });
  return res.data;
}
