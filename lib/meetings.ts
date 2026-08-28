export interface Meeting {
  id: string;
  title: string;
  date: string;
  time: string;
  duration: string;
  link: string;
  host: string;
  participants: number;
  userId?: string;
}

function getStorageKey(userId?: string): string {
  if (userId && userId.trim()) {
    return `connectmeet_meetings_${userId.trim()}`;
  }
  return "connectmeet_meetings_guest";
}

export function getMeetings(userId?: string): Meeting[] {
  if (typeof window === "undefined") return [];

  const key = getStorageKey(userId);
  const stored = localStorage.getItem(key);
  if (!stored) {
    return [];
  }

  try {
    return JSON.parse(stored) as Meeting[];
  } catch {
    return [];
  }
}

export function saveMeetings(meetings: Meeting[], userId?: string): void {
  if (typeof window === "undefined") return;
  const key = getStorageKey(userId);
  localStorage.setItem(key, JSON.stringify(meetings));
}

export function addMeeting(meeting: Meeting, userId?: string): void {
  const targetUserId = userId || meeting.userId;
  const meetingWithUser: Meeting = {
    ...meeting,
    userId: targetUserId,
  };
  const meetings = getMeetings(targetUserId);
  meetings.push(meetingWithUser);
  saveMeetings(meetings, targetUserId);
}

export function removeMeeting(id: string, userId?: string): void {
  const meetings = getMeetings(userId).filter((m) => m.id !== id);
  saveMeetings(meetings, userId);
}

export function formatMeetingDate(dateStr: string): { day: string; month: string } {
  const date = new Date(dateStr);
  return {
    day: date.getDate().toString().padStart(2, "0"),
    month: date.toLocaleString("en-US", { month: "short" }).toUpperCase(),
  };
}

async function parseRoomCreationResponse(response: Response): Promise<string> {
  const payload = (await response.json()) as { roomId?: string; error?: string };
  if (!response.ok || !payload.roomId) {
    throw new Error(payload.error || "Unable to create a meeting room");
  }
  return payload.roomId;
}

export async function createVideoSDKRoom(): Promise<string> {
  const response = await fetch("/api/videosdk/room", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  return parseRoomCreationResponse(response);
}

export function generateMeetingLink(id: string): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/meeting/${id}/lobby`;
  }
  return `/meeting/${id}/lobby`;
}
