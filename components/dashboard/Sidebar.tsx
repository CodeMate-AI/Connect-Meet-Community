"use client";

import Link from "next/link";
import Icon from "@/components/Icon";

export default function Sidebar() {
  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col bg-white border-r border-[#E2E8F0] h-screen sticky top-0">
      {/* Logo */}
      <Link href="/dashboard" className="flex items-center gap-2.5 px-6 py-5">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#0B5CFF]">
          <Icon name="Video" className="w-5 h-5 text-white" />
        </div>
        <span className="font-heading text-lg font-bold text-[#0F172A]">
          ConnectMeet
        </span>
      </Link>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-1">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors bg-[#0B5CFF]/10 text-[#0B5CFF]"
        >
          <Icon name="Home" className="w-4.5 h-4.5 text-[#0B5CFF]" />
          <span>Dashboard</span>
        </Link>
      </nav>
    </aside>
  );
}
