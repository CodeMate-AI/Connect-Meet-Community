"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useMeeting } from "@videosdk.live/react-sdk";
import { useMeetingStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import Icon from "@/components/Icon";

interface ParticipantsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  raisedHands?: Record<string, boolean>;
  className?: string;
}

function getInitials(name: string): string {
  return (
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U"
  );
}

type ParticipantRowData = {
  id: string;
  name: string;
  isHost: boolean;
  muted: boolean;
  videoOff: boolean;
  handRaised: boolean;
  isLocal: boolean;
};

export default function ParticipantsPanel({
  open,
  onOpenChange,
  raisedHands = {},
  className,
}: ParticipantsPanelProps) {
  const meeting = useMeeting();
  const localParticipant = useMeetingStore((s) => s.localParticipant);
  const setParticipantsOpen = useMeetingStore((s) => s.setParticipantsOpen);
  const isHost = localParticipant.isHost;

  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    setParticipantsOpen(open);
  }, [open, setParticipantsOpen]);

  const participants = useMemo<ParticipantRowData[]>(() => {
    const list: ParticipantRowData[] = [];
    const localParticipantId = meeting.localParticipant?.id ?? "";

    if (meeting.localParticipant?.id) {
      list.push({
        id: meeting.localParticipant.id,
        name: meeting.localParticipant.displayName || "Guest",
        isHost,
        muted: !meeting.localMicOn,
        videoOff: !meeting.localWebcamOn,
        handRaised: raisedHands[meeting.localParticipant.id] ?? false,
        isLocal: true,
      });
    }

    Array.from(meeting.participants.values()).forEach((participant) => {
      if (participant.id === localParticipantId) {
        return;
      }

      list.push({
        id: participant.id,
        name: participant.displayName || "Guest",
        isHost: false,
        muted: !participant.micOn,
        videoOff: !participant.webcamOn,
        handRaised: raisedHands[participant.id] ?? false,
        isLocal: false,
      });
    });

    return list;
  }, [isHost, meeting.localParticipant, meeting.participants, raisedHands, meeting.localMicOn, meeting.localWebcamOn]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = q
      ? participants.filter((p) => p.name.toLowerCase().includes(q))
      : [...participants];

    list.sort((a, b) => {
      if (a.handRaised && !b.handRaised) return -1;
      if (!a.handRaised && b.handRaised) return 1;
      if (a.isLocal && !b.isLocal) return -1;
      if (!a.isLocal && b.isLocal) return 1;
      return a.name.localeCompare(b.name);
    });

    return list;
  }, [participants, search]);

  const handRaisedCount = participants.filter((p) => p.handRaised).length;

  const handleMuteAll = () => {
    Array.from(meeting.participants.values()).forEach((participant) => {
      participant.disableMic();
    });
  };

  const handleMuteRemote = (peerId: string) => {
    meeting.participants.get(peerId)?.disableMic();
    setExpandedId(null);
  };

  const handleRemoveRemote = (peerId: string) => {
    meeting.participants.get(peerId)?.remove();
    setExpandedId(null);
  };

  const pinId = localParticipant.pinnedId;

  const rowContainerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!rowContainerRef.current) return;
      const target = e.target as Node;
      if (!rowContainerRef.current.contains(target)) {
        setExpandedId(null);
      }
    };
    if (expandedId) {
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }
  }, [expandedId]);

  function ParticipantRow({
    p,
    isLast,
  }: {
    p: ParticipantRowData;
    isLast: boolean;
  }) {
    const isExpanded = expandedId === p.id;
    const showActions = isHost && !p.isLocal;

    return (
      <div
        className={cn(
          "group relative flex items-center gap-3 px-4 py-3 transition-colors",
          !isLast && "border-b border-white/[0.06]",
          p.handRaised && "bg-[#FEBD00]/5 hover:bg-[#FEBD00]/10",
          !p.handRaised && "hover:bg-white/[0.04]"
        )}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1E293B] text-sm font-medium text-[#E2E8F0]">
          {getInitials(p.name)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-medium text-[#E2E8F0]">
              {p.name || "Guest"}
              {p.isLocal && (
                <span className="ml-1.5 text-[10px] text-[#64748B]">(You)</span>
              )}
            </span>
            {p.isHost && (
              <span className="inline-flex items-center rounded border border-[#FEBD00]/20 bg-[#FEBD00]/15 px-1.5 py-0.5 text-[10px] font-bold text-[#FEBD00]">
                Host
              </span>
            )}
            {pinId === p.id && (
              <Icon name="Pin" className="h-3.5 w-3.5 text-[#64748B]" />
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-2">
            {p.handRaised && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#FEBD00]">
                <Icon name="Hand" className="h-3 w-3" />
                Raised hand
              </span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Icon
            name={p.muted ? "MicOff" : "Mic"}
            className={cn(
              "h-4 w-4",
              p.muted ? "text-red-400" : "text-[#94A3B8]"
            )}
          />
          <Icon
            name={p.videoOff ? "VideoOff" : "Video"}
            className={cn(
              "h-4 w-4",
              p.videoOff ? "text-red-400" : "text-[#94A3B8]"
            )}
          />

          {showActions && (
            <button
              onClick={() => setExpandedId(isExpanded ? null : p.id)}
              className="flex h-7 w-7 items-center justify-center rounded-full text-[#94A3B8] transition-colors hover:bg-white/10 hover:text-white"
            >
              <Icon name="MoreVertical" className="h-4 w-4" />
            </button>
          )}
        </div>

        {isExpanded && showActions && (
          <div className="absolute right-4 top-full z-50 w-44 overflow-hidden rounded-lg border border-white/[0.08] bg-[#1E293B] shadow-xl">
            <button
              onClick={() => handleMuteRemote(p.id)}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-[#E2E8F0] transition-colors hover:bg-white/[0.04]"
            >
              <Icon name="MicOff" className="h-4 w-4" />
              Mute
            </button>
            <button
              onClick={() => handleRemoveRemote(p.id)}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-red-400 transition-colors hover:bg-white/[0.04]"
            >
              <Icon name="UserX" className="h-4 w-4" />
              Remove
            </button>
          </div>
        )}
      </div>
    );
  }

  const DesktopPanel = (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 hidden bg-black/40 transition-opacity duration-200 sm:block",
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => onOpenChange(false)}
      />
      <div
        className={cn(
          "fixed right-0 top-0 z-50 hidden h-full w-80 flex-col border-l border-white/[0.08] bg-[#0F172A] shadow-2xl shadow-black/40 transition-transform duration-200 ease-in-out sm:flex",
          open ? "translate-x-0" : "translate-x-full",
          className
        )}
      >
        <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
          <div className="flex items-center gap-2">
            <h2 className="font-heading text-base font-semibold text-[#E2E8F0]">
              Participants
            </h2>
            <span className="inline-flex h-5 min-w-[22px] items-center justify-center rounded-md bg-[#0B5CFF]/15 px-1.5 text-xs font-bold text-[#0B5CFF]">
              {participants.length}
            </span>
            {handRaisedCount > 0 && (
              <span className="inline-flex h-5 min-w-[22px] items-center justify-center rounded-md bg-[#FEBD00]/15 px-1.5 text-xs font-bold text-[#FEBD00]">
                <Icon name="Hand" className="mr-1 h-3 w-3" />
                {handRaisedCount}
              </span>
            )}
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#94A3B8] transition-colors hover:bg-white/10 hover:text-white"
          >
            <Icon name="X" className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-white/[0.06] px-4 py-3">
          <div className="relative">
            <Icon
              name="Search"
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]"
            />
            <Input
              placeholder="Search participants..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-white/[0.08] bg-[#1E293B] pl-9 text-[#E2E8F0] placeholder:text-[#64748B] focus-visible:ring-[#0B5CFF]/30"
            />
          </div>
        </div>

        <div ref={rowContainerRef} className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
              <Icon name="Search" className="mb-2 h-8 w-8 text-[#64748B]" />
              <p className="text-sm text-[#94A3B8]">No participants found</p>
            </div>
          ) : (
            filtered.map((p, i) => (
              <ParticipantRow key={p.id} p={p} isLast={i === filtered.length - 1} />
            ))
          )}
        </div>

        {isHost && (
          <div className="border-t border-white/[0.06] bg-[#0B1120] px-4 py-3">
            <Button
              variant="outline"
              className="w-full border-white/[0.08] text-[#E2E8F0] hover:bg-white/[0.04] hover:text-white"
              onClick={handleMuteAll}
            >
              <Icon name="MicOff" className="mr-2 h-4 w-4" />
              Mute All
            </Button>
          </div>
        )}
      </div>
    </>
  );

  const MobilePanel = (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className={cn(
          "flex w-full flex-col border-l border-white/[0.08] bg-[#0F172A] p-0",
          className
        )}
        showCloseButton={false}
      >
        <SheetHeader className="border-b border-white/[0.08] px-5 py-4">
          <div className="flex w-full items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <SheetTitle className="text-[#E2E8F0]">Participants</SheetTitle>
              <span className="inline-flex h-5 min-w-[22px] items-center justify-center rounded-md bg-[#0B5CFF]/15 px-1.5 text-xs font-bold text-[#0B5CFF]">
                {participants.length}
              </span>
              {handRaisedCount > 0 && (
                <span className="inline-flex h-5 min-w-[22px] items-center justify-center rounded-md bg-[#FEBD00]/15 px-1.5 text-xs font-bold text-[#FEBD00]">
                  <Icon name="Hand" className="mr-1 h-3 w-3" />
                  {handRaisedCount}
                </span>
              )}
            </div>
            <SheetClose asChild>
              <button className="flex h-8 w-8 items-center justify-center rounded-full text-[#94A3B8] transition-colors hover:bg-white/10 hover:text-white">
                <Icon name="X" className="h-5 w-5" />
              </button>
            </SheetClose>
          </div>
        </SheetHeader>

        <div className="border-b border-white/[0.06] px-4 py-3">
          <div className="relative">
            <Icon
              name="Search"
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]"
            />
            <Input
              placeholder="Search participants..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-white/[0.08] bg-[#1E293B] pl-9 text-[#E2E8F0] placeholder:text-[#64748B] focus-visible:ring-[#0B5CFF]/30"
            />
          </div>
        </div>

        <div ref={rowContainerRef} className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
              <Icon name="Search" className="mb-2 h-8 w-8 text-[#64748B]" />
              <p className="text-sm text-[#94A3B8]">No participants found</p>
            </div>
          ) : (
            filtered.map((p, i) => (
              <ParticipantRow key={p.id} p={p} isLast={i === filtered.length - 1} />
            ))
          )}
        </div>

        {isHost && (
          <SheetFooter className="border-t border-white/[0.06] bg-[#0B1120] px-4 py-3">
            <Button
              variant="outline"
              className="w-full border-white/[0.08] text-[#E2E8F0] hover:bg-white/[0.04] hover:text-white"
              onClick={handleMuteAll}
            >
              <Icon name="MicOff" className="mr-2 h-4 w-4" />
              Mute All
            </Button>
          </SheetFooter>
        )}
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
