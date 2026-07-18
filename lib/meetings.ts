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

const initialMeetings: Meeting[] = [
  {
    id: "cm-8f72a1b4",
    title: "Weekly Team Standup",
    date: new Date(Date.now() + 86400000).toISOString(),
    time: "09:00 AM",
    duration: "30 min",
    link: "https://connectmeet.app/meeting/cm-8f72a1b4",
    host: "Alex Johnson",
    participants: 8,
  },
  {
    id: "cm-9c31d5e8",
    title: "Product Review — Q3 Roadmap",
    date: new Date(Date.now() + 172800000).toISOString(),
    time: "02:00 PM",
    duration: "60 min",
    link: "https://connectmeet.app/meeting/cm-9c31d5e8",
    host: "Sarah Chen",
    participants: 12,
  },
  {
    id: "cm-a485f2c0",
    title: "Design Sync with Creative Team",
    date: new Date(Date.now() + 259200000).toISOString(),
    time: "11:00 AM",
    duration: "45 min",
    link: "https://connectmeet.app/meeting/cm-a485f2c0",
    host: "Maya Rodriguez",
    participants: 5,
  },
  {
    id: "cm-b129e7d3",
    title: "Client Onboarding — Acme Corp",
    date: new Date(Date.now() + 345600000).toISOString(),
    time: "03:30 PM",
    duration: "90 min",
    link: "https://connectmeet.app/meeting/cm-b129e7d3",
    host: "David Park",
    participants: 4,
  },
  {
    id: "cm-c673a0f9",
    title: "Engineering All-Hands",
    date: new Date(Date.now() + 432000000).toISOString(),
    time: "10:00 AM",
    duration: "120 min",
    link: "https://connectmeet.app/meeting/cm-c673a0f9",
    host: "Alex Johnson",
    participants: 24,
  },
];

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
