import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export const runtime = "nodejs";

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function buildRoomName(): string {
  return `room-${crypto.randomUUID()}`;
}

export async function POST() {
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
        expiresIn: 60 * 10, // 10 minutes is plenty for room creation
      }
    );
    const roomName = buildRoomName();

    const roomRes = await fetch("https://api.videosdk.live/v2/rooms", {
      method: "POST",
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        customRoomId: roomName,
      }),
    });

    if (!roomRes.ok) {
      const errorText = await roomRes.text();
      return NextResponse.json(
        { error: `Failed to create VideoSDK room: ${errorText}` },
        { status: roomRes.status }
      );
    }

    const room = (await roomRes.json()) as { roomId?: string; meetingId?: string; id?: string };
    const roomId = room.roomId || room.meetingId || room.id || roomName;

    return NextResponse.json({ roomId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create VideoSDK room";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
