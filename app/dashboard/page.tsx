"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import Sidebar from "@/components/dashboard/Sidebar";
import QuickActions from "@/components/dashboard/QuickActions";
import MeetingList from "@/components/dashboard/MeetingList";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import Icon from "@/components/Icon";

const DISPLAY_NAME_KEY = "connectmeet_display_name";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "G";
  return parts
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function DashboardPage() {
  const [greeting, setGreeting] = useState("Welcome");
  const [displayName, setDisplayName] = useState("Guest");

  useEffect(() => {
    setGreeting(getGreeting());
    if (typeof window === "undefined") return;

    setDisplayName(localStorage.getItem(DISPLAY_NAME_KEY) || "Guest");

    const kicked = new URLSearchParams(window.location.search).get("kicked");
    if (kicked === "true") {
      toast.warning("You were removed from the meeting by the host.");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const avatarSrc = useMemo(
    () => `https://i.pravatar.cc/150?u=${encodeURIComponent(displayName)}`,
    [displayName]
  );

  return (
    <div className="flex min-h-screen bg-[#F9FAFB]">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-[#E2E8F0] px-4 py-4 md:px-6 md:py-4">
          <div className="flex items-center justify-between gap-3 md:hidden mb-4">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#0B5CFF] shrink-0">
                <Icon name="Video" className="w-5 h-5 text-white" />
              </div>
              <span className="font-heading text-base font-bold text-[#0F172A]">
                ConnectMeet
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Avatar size="sm">
                <AvatarImage src={avatarSrc} alt={displayName} />
                <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
              </Avatar>
            </div>
          </div>

          <div className="flex items-center justify-between w-full">
            <div>
              <h1 className="font-heading text-lg sm:text-xl font-bold text-[#0F172A] leading-tight">
                {greeting}, {displayName}
              </h1>
              <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
                Here is what is happening with your meetings today.
              </p>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <Avatar size="sm">
                <AvatarImage src={avatarSrc} alt={displayName} />
                <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        <div className="flex-1 px-4 py-4 sm:px-6 sm:py-6 space-y-6 overflow-auto">
          <QuickActions />
          <MeetingList />
        </div>
      </main>
    </div>
  );
}
