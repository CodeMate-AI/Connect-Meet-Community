"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMeeting, usePubSub } from "@videosdk.live/react-sdk";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import Icon from "@/components/Icon";

type ChatPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  className?: string;
};

function formatTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ChatPanel({ open, onOpenChange, className }: ChatPanelProps) {
  const meeting = useMeeting();
  const { publish, messages } = usePubSub("CHAT");
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const localParticipantId = meeting.localParticipant?.id || "";
  const isChatAllowed = true;

  const sendChat = async () => {
    const text = draft.trim();
    if (!text || !isChatAllowed) return;

    await publish(text, { persist: true }, { kind: "chat" });
    setDraft("");
  };

  const renderedMessages = useMemo(() => messages, [messages]);

  const content = (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0F172A]/95 shadow-2xl shadow-black/25">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <div className="flex items-center gap-2">
          <h2 className="font-heading text-base font-semibold text-[#E2E8F0]">Chat</h2>
          <span className="inline-flex min-w-[22px] items-center justify-center rounded-md bg-[#0B5CFF]/15 px-1.5 py-1 text-xs font-bold text-[#0B5CFF]">
            {messages.length}
          </span>
        </div>
        <button
          onClick={() => onOpenChange(false)}
          className="flex h-8 w-8 items-center justify-center rounded-full text-[#94A3B8] transition-colors hover:bg-white/10 hover:text-white"
        >
          <Icon name="X" className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {renderedMessages.length === 0 ? (
          <div className="flex h-full min-h-[12rem] items-center justify-center text-center px-4">
            <div>
              <Icon name="MessageSquare" className="mx-auto mb-2 h-8 w-8 text-[#64748B]" />
              <p className="text-sm text-[#94A3B8]">No messages yet</p>
            </div>
          </div>
        ) : (
          renderedMessages.map((message) => {
            const isSelf = message.senderId === localParticipantId;
            return (
              <div key={message.id} className={cn("flex", isSelf ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl border px-3 py-2 shadow-sm",
                    isSelf
                      ? "rounded-br-md border-[#0B5CFF]/20 bg-[#0B5CFF] text-white"
                      : "rounded-bl-md border-white/[0.08] bg-[#1E293B] text-[#E2E8F0]"
                  )}
                >
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold opacity-90">
                      {isSelf ? "You" : message.senderName}
                    </span>
                    <span className="text-[10px] opacity-70">{formatTime(message.timestamp)}</span>
                  </div>
                  <p className="break-words text-sm leading-relaxed">{message.message}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <SheetFooter className="border-t border-white/[0.06] bg-[#0B1120] px-4 py-3">
        <div className="flex w-full items-center gap-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void sendChat()}
            placeholder="Send a message..."
            className="border-white/[0.08] bg-[#1E293B] text-[#E2E8F0] placeholder:text-[#64748B]"
          />
          <Button onClick={() => void sendChat()} disabled={!draft.trim()} className="bg-[#0B5CFF]">
            Send
          </Button>
        </div>
      </SheetFooter>
    </div>
  );

  const mobilePanel = (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex h-full w-full flex-col border-l border-white/[0.08] bg-[#0F172A] p-0"
        showCloseButton={false}
      >
        <SheetHeader className="border-b border-white/[0.08] px-5 py-4">
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-2">
              <SheetTitle className="text-[#E2E8F0]">Chat</SheetTitle>
              <span className="inline-flex min-w-[22px] items-center justify-center rounded-md bg-[#0B5CFF]/15 px-1.5 py-1 text-xs font-bold text-[#0B5CFF]">
                {messages.length}
              </span>
            </div>
            <SheetClose asChild>
              <button className="flex h-8 w-8 items-center justify-center rounded-full text-[#94A3B8] transition-colors hover:bg-white/10 hover:text-white">
                <Icon name="X" className="h-5 w-5" />
              </button>
            </SheetClose>
          </div>
        </SheetHeader>

        <div className="flex-1 min-h-0">{content}</div>
      </SheetContent>
    </Sheet>
  );

  return (
    <div className={cn("min-h-0", className)}>
      <div className="hidden h-full min-h-0 xl:block">{content}</div>
      <div className="xl:hidden">{mobilePanel}</div>
    </div>
  );
}
