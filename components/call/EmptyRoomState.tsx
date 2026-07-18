"use client";

import { useState } from "react";
import Icon from "@/components/Icon";

interface EmptyRoomStateProps {
  meetingId: string;
}

export default function EmptyRoomState({ meetingId }: EmptyRoomStateProps) {
  const [copied, setCopied] = useState(false);

  const link = `https://connectmeet.app/meeting/${meetingId}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6 gap-5">
      <div className="w-16 h-16 rounded-2xl bg-[#1E293B] border border-white/[0.08] flex items-center justify-center">
        <Icon name="Users" className="w-8 h-8 text-[#64748B]" />
      </div>
      <div className="space-y-1">
        <h3 className="font-heading text-lg font-semibold text-[#E2E8F0]">
          You are the only one here
        </h3>
        <p className="text-sm text-[#94A3B8] max-w-xs">
          Invite others to join this meeting by sharing the link below.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleCopy}
          className="flex items-center justify-center min-h-[44px] gap-2 px-5 rounded-full bg-[#0B5CFF] text-white text-sm font-medium hover:bg-[#0B5CFF]/90 transition-colors"
        >
          <Icon name={copied ? "Check" : "Copy"} className="w-4 h-4" />
          {copied ? "Copied!" : "Copy invite link"}
        </button>
      </div>
    </div>
  );
}
