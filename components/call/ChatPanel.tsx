"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useMeetingStore, type ChatMessage } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import Icon from "@/components/Icon";

function formatTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ChatPanel() {
  const isChatOpen = useMeetingStore((s) => s.isChatOpen);
  const setChatOpen = useMeetingStore((s) => s.setChatOpen);
  const chatMessages = useMeetingStore((s) => s.chatMessages);
  const localParticipant = useMeetingStore((s) => s.localParticipant);
  const remotePeers = useMeetingStore((s) => s.remotePeers);
  const settings = useMeetingStore((s) => s.settings);
  const addChatMessage = useMeetingStore((s) => s.addChatMessage);

  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const sendChat = () => {
    const text = draft.trim();
    if (!text || !settings.isChatAllowed) return;

    const message: ChatMessage = {
      id: `chat-${Math.random().toString(36).slice(2, 10)}`,
      senderId: localParticipant.id || "local",
      senderName: localParticipant.name || "Guest",
      text,
      timestamp: new Date().toISOString(),
    };

    addChatMessage(message);
    Object.values(remotePeers).forEach((peer) => {
      if (peer.dataChannel?.readyState === "open") {
        peer.dataChannel.send(
          JSON.stringify({ type: "chat", message })
        );
      }
    });
    setDraft("");
  };

  const groupedMessages = useMemo(() => chatMessages, [chatMessages]);

  const desktopMessages = (
    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
      {groupedMessages.length === 0 ? (
        <div className="flex h-full items-center justify-center text-center px-4">
          <div>
            <Icon name="MessageSquare" className="w-8 h-8 text-[#64748B] mx-auto mb-2" />
            <p className="text-sm text-[#94A3B8]">No messages yet</p>
          </div>
        </div>
      ) : (
        groupedMessages.map((message) => {
          const isSelf = message.senderId === localParticipant.id;
          return (
            <div
              key={message.id}
              className={cn(
                "flex",
                isSelf ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-3 py-2 shadow-sm border",
                  isSelf
                    ? "bg-[#0B5CFF] text-white border-[#0B5CFF]/20 rounded-br-md"
                    : "bg-[#1E293B] text-[#E2E8F0] border-white/[0.08] rounded-bl-md"
                )}
              >
                <div className="flex items-center justify-between gap-3 mb-1">
                  <span className="text-xs font-semibold opacity-90">
                    {isSelf ? "You" : message.senderName}
                  </span>
                  <span className="text-[10px] opacity-70">{formatTime(message.timestamp)}</span>
                </div>
                <p className="text-sm leading-relaxed break-words">{message.text}</p>
              </div>
            </div>
          );
        })
      )}
      <div ref={bottomRef} />
    </div>
  );

  const DesktopPanel = (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/40 transition-opacity duration-200 sm:block hidden",
          isChatOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setChatOpen(false)}
      />
      <div
        className={cn(
          "fixed top-0 right-0 z-50 w-96 h-full bg-[#0F172A] border-l border-white/[0.08] shadow-2xl shadow-black/40 transition-transform duration-200 ease-in-out flex flex-col sm:flex hidden",
          isChatOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <h2 className="font-heading text-base font-semibold text-[#E2E8F0]">
              Chat
            </h2>
            <span className="inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 rounded-md bg-[#0B5CFF]/15 text-[#0B5CFF] text-xs font-bold">
              {chatMessages.length}
            </span>
          </div>
          <button
            onClick={() => setChatOpen(false)}
            className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-white/10 transition-colors text-[#94A3B8] hover:text-white"
          >
            <Icon name="X" className="w-5 h-5" />
          </button>
        </div>

        {!settings.isChatAllowed ? (
          <div className="flex-1 flex items-center justify-center px-6 text-center">
            <div>
              <Icon name="MessageSquareOff" className="w-8 h-8 text-[#64748B] mx-auto mb-2" />
              <p className="text-sm text-[#94A3B8]">Chat is disabled by the host.</p>
            </div>
          </div>
        ) : (
          desktopMessages
        )}

        <SheetFooter className="px-4 py-3 border-t border-white/[0.06] bg-[#0B1120]">
          <div className="flex items-center gap-2 w-full">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendChat()}
              placeholder={settings.isChatAllowed ? "Send a message..." : "Chat disabled"}
              disabled={!settings.isChatAllowed}
              className="bg-[#1E293B] border-white/[0.08] text-[#E2E8F0] placeholder:text-[#64748B]"
            />
            <Button onClick={sendChat} disabled={!draft.trim() || !settings.isChatAllowed} className="bg-[#0B5CFF]">
              Send
            </Button>
          </div>
        </SheetFooter>
      </div>
    </>
  );

  const MobilePanel = (
    <Sheet open={isChatOpen} onOpenChange={setChatOpen}>
      <SheetContent
        side="right"
        className="w-full bg-[#0F172A] border-l border-white/[0.08] p-0 flex flex-col"
        showCloseButton={false}
      >
        <SheetHeader className="px-5 py-4 border-b border-white/[0.08]">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <SheetTitle className="text-[#E2E8F0]">Chat</SheetTitle>
              <span className="inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 rounded-md bg-[#0B5CFF]/15 text-[#0B5CFF] text-xs font-bold">
                {chatMessages.length}
              </span>
            </div>
            <SheetClose asChild>
              <button className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-white/10 transition-colors text-[#94A3B8] hover:text-white">
                <Icon name="X" className="w-5 h-5" />
              </button>
            </SheetClose>
          </div>
        </SheetHeader>

        {!settings.isChatAllowed ? (
          <div className="flex-1 flex items-center justify-center px-6 text-center">
            <div>
              <Icon name="MessageSquareOff" className="w-8 h-8 text-[#64748B] mx-auto mb-2" />
              <p className="text-sm text-[#94A3B8]">Chat is disabled by the host.</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {groupedMessages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-center px-4">
                <div>
                  <Icon name="MessageSquare" className="w-8 h-8 text-[#64748B] mx-auto mb-2" />
                  <p className="text-sm text-[#94A3B8]">No messages yet</p>
                </div>
              </div>
            ) : (
              groupedMessages.map((message) => {
                const isSelf = message.senderId === localParticipant.id;
                return (
                  <div
                    key={message.id}
                    className={cn(
                      "flex",
                      isSelf ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl px-3 py-2 shadow-sm border",
                        isSelf
                          ? "bg-[#0B5CFF] text-white border-[#0B5CFF]/20 rounded-br-md"
                          : "bg-[#1E293B] text-[#E2E8F0] border-white/[0.08] rounded-bl-md"
                      )}
                    >
                      <div className="flex items-center justify-between gap-3 mb-1">
                        <span className="text-xs font-semibold opacity-90">
                          {isSelf ? "You" : message.senderName}
                        </span>
                        <span className="text-[10px] opacity-70">{formatTime(message.timestamp)}</span>
                      </div>
                      <p className="text-sm leading-relaxed break-words">{message.text}</p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>
        )}

        <SheetFooter className="px-4 py-3 border-t border-white/[0.06] bg-[#0B1120]">
          <div className="flex items-center gap-2 w-full">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendChat()}
              placeholder={settings.isChatAllowed ? "Send a message..." : "Chat disabled"}
              disabled={!settings.isChatAllowed}
              className="bg-[#1E293B] border-white/[0.08] text-[#E2E8F0] placeholder:text-[#64748B]"
            />
            <Button onClick={sendChat} disabled={!draft.trim() || !settings.isChatAllowed} className="bg-[#0B5CFF]">
              Send
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );

  return (
    <>
      <div className="hidden sm:block">{DesktopPanel}</div>
      <div className="sm:hidden">{MobilePanel}</div>
    </>
  );
}
