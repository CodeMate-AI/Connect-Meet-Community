"use client";

import { useState } from "react";
import Link from "next/link";
import Icon from "@/components/Icon";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Home", icon: "Home", href: "/", active: true },
  { label: "Meetings", icon: "Video", href: "#", active: false },
  { label: "Contacts", icon: "Users", href: "#", active: false },
];

export default function Sidebar() {
  const [active, setActive] = useState("Home");

  return (
    <aside className="w-64 shrink-0 flex flex-col bg-white border-r border-[#E2E8F0] h-screen sticky top-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-6 py-5">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#0B5CFF]">
          <Icon name="Video" className="w-5 h-5 text-white" />
        </div>
        <span className="font-heading text-lg font-bold text-[#0F172A]">
          ConnectMeet
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            onClick={() => setActive(item.label)}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              active === item.label
                ? "bg-[#0B5CFF]/10 text-[#0B5CFF]"
                : "text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]"
            )}
          >
            <Icon
              name={item.icon as "Home" | "Video" | "Users"}
              className={cn(
                "w-[18px] h-[18px]",
                active === item.label ? "text-[#0B5CFF]" : "text-[#94A3B8]"
              )}
            />
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
