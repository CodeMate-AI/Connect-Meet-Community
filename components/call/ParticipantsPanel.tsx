"use client";

import { useState, useMemo, useEffect, useRef } from "react";
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

export default function ParticipantsPanel({
  open,
  onOpenChange,
}: ParticipantsPanelProps) {
  const localParticipant = useMeetingStore((s) => s.localParticipant);
  const remotePeers = useMeetingStore((s) => s.remotePeers);
  const setParticipantsOpen = useMeetingStore((s) => s.setParticipantsOpen);

  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    setParticipantsOpen(open);
  }, [open, setParticipantsOpen]);

  const participants = useMemo(() => {
    const list: {
      id: string;
      name: string;
      isHost: boolean;
      muted: boolean;
      videoOff: boolean;
      handRaised: boolean;
      isLocal: boolean;
      connection?: RTCPeerConnection;
    }[] = [
      {
        id: localParticipant.id || "local",
        name: localParticipant.name,
        isHost: localParticipant.isHost,
        muted: localParticipant.muted,
        videoOff: localParticipant.videoOff,
        handRaised: localParticipant.handRaised,
        isLocal: true,
      },
    ];

    Object.entries(remotePeers).forEach(([peerId, peer]) => {
      list.push({
        id: peerId,
        name: peer.state.name,
        isHost: false,
        muted: peer.state.muted,
        videoOff: peer.state.videoOff,
        handRaised: peer.state.handRaised,
        isLocal: false,
        connection: peer.connection,
      });
    });

    return list;
  }, [localParticipant, remotePeers]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = q
      ? participants.filter((p) => p.name.toLowerCase().includes(q))
      : [...participants];

    // Sort: hand-raised first
    list.sort((a, b) => {
      if (a.handRaised && !b.handRaised) return -1;
      if (!a.handRaised && b.handRaised) return 1;
      return a.name.localeCompare(b.name);
    });

    return list;
  }, [participants, search]);

  const handRaisedCount = participants.filter((p) => p.handRaised).length;
  const remoteIds = Object.keys(remotePeers);

  const handleMuteAll = () => {
    Object.values(remotePeers).forEach((peer) => {
      try {
        if (peer.dataChannel?.readyState === "open") {
          peer.dataChannel.send(
            JSON.stringify({ type: "command", action: "mute", targetId: peer.id })
          );
        }
      } catch {
        // ignore send errors
      }
    });
  };

  const handleMuteRemote = (peerId: string) => {
    const peer = remotePeers[peerId];
    if (!peer) return;
    try {
      if (peer.dataChannel?.readyState === "open") {
        peer.dataChannel.send(
          JSON.stringify({ type: "command", action: "mute", targetId: peerId })
        );
      }
    } catch {
      // ignore
    }
    setExpandedId(null);
  };

  const handleRemoveRemote = (peerId: string) => {
    const peer = remotePeers[peerId];
    if (!peer) return;
    try {
      if (peer.dataChannel?.readyState === "open") {
        peer.dataChannel.send(
          JSON.stringify({ type: "command", action: "kick", targetId: peerId })
        );
      }
    } catch {
      // ignore
    }
    setExpandedId(null);
  };

  const pinId = localParticipant.pinnedId;

  // Click outside to close expanded menu
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
    p: (typeof participants)[number];
    isLast: boolean;
  }) {
    const isExpanded = expandedId === p.id;
    const showActions = localParticipant.isHost && !p.isLocal;

    return (
      <div
        className={cn(
          "group relative flex items-center gap-3 px-4 py-3 transition-colors",
          !isLast && "border-b border-white/[0.06]",
          p.handRaised && "bg-[#FEBD00]/5 hover:bg-[#FEBD00]/10",
          !p.handRaised && "hover:bg-white/[0.04]"
        )}
      >
        {/* Avatar */}
        <div className="flex items-center justify-center w-9 h-9 rounded-full bg-[#1E293B] text-sm font-medium text-[#E2E8F0] shrink-0">
          {getInitials(p.name)}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[#E2E8F0] truncate">
              {p.name || "Guest"}
              {p.isLocal && (
                <span className="ml-1.5 text-[10px] text-[#64748B]">(You)</span>
              )}
            </span>
            {p.isHost && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#FEBD00]/15 text-[#FEBD00] border border-[#FEBD00]/20">
                Host
              </span>
            )}
            {pinId === p.id && (
              <Icon
                name="Pin"
                className="w-3.5 h-3.5 text-[#64748B]"
              />
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            {p.handRaised && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#FEBD00]">
                <Icon name="Hand" className="w-3 h-3" />
                Raised hand
              </span>
            )}
          </div>
        </div>

        {/* Status icons */}
        <div className="flex items-center gap-2 shrink-0">
          <Icon
            name={p.muted ? "MicOff" : "Mic"}
            className={cn(
              "w-4 h-4",
              p.muted ? "text-red-400" : "text-[#94A3B8]"
            )}
          />
          <Icon
            name={p.videoOff ? "VideoOff" : "Video"}
            className={cn(
              "w-4 h-4",
              p.videoOff ? "text-red-400" : "text-[#94A3B8]"
            )}
          />

          {/* Host actions toggle */}
          {showActions && (
            <button
              onClick={() =>
                setExpandedId(isExpanded ? null : p.id)
              }
              className="flex items-center justify-center w-7 h-7 rounded-full hover:bg-white/10 transition-colors text-[#94A3B8] hover:text-white"
            >
              <Icon name="MoreVertical" className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Host action dropdown */}
        {isExpanded && showActions && (
          <div className="absolute right-4 top-full z-50 w-44 rounded-lg bg-[#1E293B] border border-white/[0.08] shadow-xl overflow-hidden">
            <button
              onClick={() => handleMuteRemote(p.id)}
              className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-[#E2E8F0] hover:bg-white/[0.04] transition-colors text-left"
            >
              <Icon name="MicOff" className="w-4 h-4" />
              Mute
            </button>
            <button
              onClick={() => handleRemoveRemote(p.id)}
              className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-red-400 hover:bg-white/[0.04] transition-colors text-left"
            >
              <Icon name="UserX" className="w-4 h-4" />
              Remove
            </button>
          </div>
        )}
      </div>
    );
  }

  // Desktop: custom slide-in panel
  const DesktopPanel = (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/40 transition-opacity duration-200 sm:block hidden",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => onOpenChange(false)}
      />
      {/* Panel */}
      <div
        className={cn(
          "fixed top-0 right-0 z-50 w-80 h-full bg-[#0F172A] border-l border-white/[0.08] shadow-2xl shadow-black/40 transition-transform duration-200 ease-in-out flex flex-col sm:flex hidden",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <h2 className="font-heading text-base font-semibold text-[#E2E8F0]">
              Participants
            </h2>
            <span className="inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 rounded-md bg-[#0B5CFF]/15 text-[#0B5CFF] text-xs font-bold">
              {participants.length}
            </span>
            {handRaisedCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 rounded-md bg-[#FEBD00]/15 text-[#FEBD00] text-xs font-bold">
                <Icon name="Hand" className="w-3 h-3 mr-1" />
                {handRaisedCount}
              </span>
            )}
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-white/10 transition-colors text-[#94A3B8] hover:text-white"
          >
            <Icon name="X" className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-white/[0.06]">
          <div className="relative">
            <Icon
              name="Search"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]"
            />
            <Input
              placeholder="Search participants..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-[#1E293B] border-white/[0.08] text-[#E2E8F0] placeholder:text-[#64748B] focus-visible:ring-[#0B5CFF]/30"
            />
          </div>
        </div>

        {/* List */}
        <div ref={rowContainerRef} className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <Icon name="Search" className="w-8 h-8 text-[#64748B] mb-2" />
              <p className="text-sm text-[#94A3B8]">No participants found</p>
            </div>
          ) : (
            filtered.map((p, i) => (
              <ParticipantRow
                key={p.id}
                p={p}
                isLast={i === filtered.length - 1}
              />
            ))
          )}
        </div>

        {/* Footer */}
        {localParticipant.isHost && (
          <div className="px-4 py-3 border-t border-white/[0.06] bg-[#0B1120]">
            <Button
              variant="outline"
              className="w-full border-white/[0.08] text-[#E2E8F0] hover:bg-white/[0.04] hover:text-white"
              onClick={handleMuteAll}
            >
              <Icon name="MicOff" className="w-4 h-4 mr-2" />
              Mute All
            </Button>
          </div>
        )}
      </div>
    </>
  );

  // Mobile: Sheet
  const MobilePanel = (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full bg-[#0F172A] border-l border-white/[0.08] p-0 flex flex-col"
        showCloseButton={false}
      >
        <SheetHeader className="px-5 py-4 border-b border-white/[0.08]">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <SheetTitle className="text-[#E2E8F0]">Participants</SheetTitle>
              <span className="inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 rounded-md bg-[#0B5CFF]/15 text-[#0B5CFF] text-xs font-bold">
                {participants.length}
              </span>
              {handRaisedCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 rounded-md bg-[#FEBD00]/15 text-[#FEBD00] text-xs font-bold">
                  <Icon name="Hand" className="w-3 h-3 mr-1" />
                  {handRaisedCount}
                </span>
              )}
            </div>
            <SheetClose asChild>
              <button className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-white/10 transition-colors text-[#94A3B8] hover:text-white">
                <Icon name="X" className="w-5 h-5" />
              </button>
            </SheetClose>
          </div>
        </SheetHeader>

        {/* Search */}
        <div className="px-4 py-3 border-b border-white/[0.06]">
          <div className="relative">
            <Icon
              name="Search"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]"
            />
            <Input
              placeholder="Search participants..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-[#1E293B] border-white/[0.08] text-[#E2E8F0] placeholder:text-[#64748B] focus-visible:ring-[#0B5CFF]/30"
            />
          </div>
        </div>

        {/* List */}
        <div ref={rowContainerRef} className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <Icon name="Search" className="w-8 h-8 text-[#64748B] mb-2" />
              <p className="text-sm text-[#94A3B8]">No participants found</p>
            </div>
          ) : (
            filtered.map((p, i) => (
              <ParticipantRow
                key={p.id}
                p={p}
                isLast={i === filtered.length - 1}
              />
            ))
          )}
        </div>

        {/* Footer */}
        {localParticipant.isHost && (
          <SheetFooter className="px-4 py-3 border-t border-white/[0.06] bg-[#0B1120]">
            <Button
              variant="outline"
              className="w-full border-white/[0.08] text-[#E2E8F0] hover:bg-white/[0.04] hover:text-white"
              onClick={handleMuteAll}
            >
              <Icon name="MicOff" className="w-4 h-4 mr-2" />
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
