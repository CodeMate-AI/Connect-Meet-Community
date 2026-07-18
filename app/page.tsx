"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import QuickActions from "@/components/dashboard/QuickActions";
import MeetingList from "@/components/dashboard/MeetingList";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import Icon from "@/components/Icon";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function Home() {
  const [greeting, setGreeting] = useState("Welcome");

  useEffect(() => {
    setGreeting(getGreeting());
  }, []);

  return (
    <div className="flex min-h-screen bg-[#F9FAFB]">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-[#E2E8F0]">
          <div>
            <h1 className="font-heading text-xl font-bold text-[#0F172A]">
              {greeting}, Alex
            </h1>
            <p className="text-sm text-[#64748B] mt-0.5">
              Here is what is happening with your meetings today.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-[#F1F5F9] transition-colors text-[#64748B]">
              <Icon name="Settings" className="w-5 h-5" />
            </button>
            <Avatar size="sm">
              <AvatarImage src="https://i.pravatar.cc/150?img=11" alt="Alex Johnson" />
              <AvatarFallback>AJ</AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 px-6 py-6 space-y-6 overflow-auto">
          <QuickActions />
          <MeetingList />
        </div>
      </main>
    </div>
  );
}
