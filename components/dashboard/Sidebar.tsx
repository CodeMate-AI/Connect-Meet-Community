"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import Icon from "@/components/Icon";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "CM";
}

export default function Sidebar() {
  const { user, signOut } = useAuth();
  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Guest";

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col bg-white border-r border-[#E2E8F0] h-screen sticky top-0">
      <Link href="/dashboard" className="flex items-center gap-2.5 px-6 py-5">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#0B5CFF]">
          <Icon name="Video" className="w-5 h-5 text-white" />
        </div>
        <span className="font-heading text-lg font-bold text-[#0F172A]">ConnectMeet</span>
      </Link>

      <nav className="flex-1 px-3 py-2 space-y-1">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors bg-[#0B5CFF]/10 text-[#0B5CFF]"
        >
          <Icon name="Home" className="w-4.5 h-4.5 text-[#0B5CFF]" />
          <span>Dashboard</span>
        </Link>
      </nav>

      <div className="border-t border-[#E2E8F0] p-4">
        <div className="flex items-center gap-3 rounded-2xl border border-[#E2E8F0] bg-slate-50 p-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-[#0B5CFF] text-white">{getInitials(displayName)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-[#0F172A]">{displayName}</p>
            <p className="truncate text-xs text-[#64748B]">{user?.email}</p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          className="mt-3 w-full border-[#E2E8F0] text-[#0F172A] hover:bg-slate-50"
          onClick={() => void signOut()}
        >
          <Icon name="LogOut" className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </aside>
  );
}
