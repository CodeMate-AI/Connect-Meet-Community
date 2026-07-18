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

export function generateMeetingId(): string {
  return `cm-${Math.random().toString(36).substring(2, 10)}`;
}

export function generateMeetingLink(id: string): string {
  return `https://connectmeet.app/meeting/${id}`;
}
