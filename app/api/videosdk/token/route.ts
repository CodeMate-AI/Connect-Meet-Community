import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export const runtime = "nodejs";

const DEFAULT_TOKEN_EXPIRY_SECONDS = 60 * 60 * 24;

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export async function GET() {
  try {
    const apiKey = getRequiredEnv("VIDEOSDK_API_KEY");
    const apiSecret = getRequiredEnv("VIDEOSDK_SECRET");

    const token = jwt.sign(
      {
        apikey: apiKey,
        permissions: ["allow_join", "ask_join", "end_meeting", "toggle_mic", "toggle_webcam", "toggle_screen_share", "chat", "pin", "remove_participant"],
      },
      apiSecret,
      {
        algorithm: "HS256",
        expiresIn: DEFAULT_TOKEN_EXPIRY_SECONDS,
      }
    );

    return NextResponse.json({ token });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to generate VideoSDK token";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
