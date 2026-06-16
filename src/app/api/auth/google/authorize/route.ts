import { NextResponse } from "next/server";
import { getOAuthClient } from "@/lib/google-calendar";

export async function GET() {
  const oauth = getOAuthClient();
  const url = oauth.generateAuthUrl({
    access_type: "offline",
    prompt: "consent", // force to always get refresh_token
    scope: ["https://www.googleapis.com/auth/calendar"],
  });
  return NextResponse.redirect(url);
}
