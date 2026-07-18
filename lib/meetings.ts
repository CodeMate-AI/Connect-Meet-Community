export interface Meeting {
  id: string;
  title: string;
  date: string;
  time: string;
  duration: string;
  link: string;
  host: string;
  participants: number;
}

const STORAGE_KEY = "connectmeet_meetings";

const initialMeetings: Meeting[] = [];

export function getMeetings(): Meeting[] {
  if (typeof window === "undefined") return initialMeetings;

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialMeetings));
    return initialMeetings;
  }

  try {
    return JSON.parse(stored) as Meeting[];
  } catch {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialMeetings));
    return initialMeetings;
  }
}

export function saveMeetings(meetings: Meeting[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(meetings));
}

export function addMeeting(meeting: Meeting): void {
  const meetings = getMeetings();
  meetings.push(meeting);
  saveMeetings(meetings);
}

export function removeMeeting(id: string): void {
  const meetings = getMeetings().filter((m) => m.id !== id);
  saveMeetings(meetings);
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
