"use client";

import { useRef, useEffect, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import Icon from "@/components/Icon";
import { ReactionBubbleContainer } from "@/components/call/ReactionBubble";

interface VideoTileProps {
  stream: MediaStream | null;
  name: string;
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenShare?: boolean;
  isPinned?: boolean;
  isActiveSpeaker?: boolean;
  isHandRaised?: boolean;
  reaction?: string | null;
  onPin?: () => void;
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

const VideoTile = forwardRef<HTMLDivElement, VideoTileProps>(
  (
    {
      stream,
      name,
      isMuted,
      isCameraOff,
      isScreenShare,
      isPinned,
      isActiveSpeaker,
      isHandRaised,
      reaction,
      onPin,
      className,
    },
    ref
  ) => {
    const videoRef = useRef<HTMLVideoElement | null>(null);

    useEffect(() => {
      const el = videoRef.current;
      if (!el) return;
      if (stream && !isCameraOff) {
        el.srcObject = stream;
      } else {
        el.srcObject = null;
      }
    }, [stream, isCameraOff]);

    return (
      <div
        ref={ref}
        className={cn(
          "relative rounded-xl overflow-hidden bg-[#111827] shadow-lg shadow-black/20 transition-all",
          isActiveSpeaker && !isPinned && !isScreenShare
            ? "ring-2 ring-[#0B5CFF]"
            : "ring-1 ring-white/[0.08]",
          className
        )}
      >
        {/* Video */}
        {stream && !isCameraOff && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* Avatar fallback */}
        {(!stream || isCameraOff) && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Avatar className="w-20 h-20">
              <AvatarImage
                src={`https://i.pravatar.cc/150?u=${encodeURIComponent(name)}`}
                alt={name}
              />
              <AvatarFallback className="text-2xl bg-[#1E293B] text-[#E2E8F0]">
                {getInitials(name)}
              </AvatarFallback>
            </Avatar>
          </div>
        )}

        {/* Screen share label */}
        {isScreenShare && (
          <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#FEBD00]/90 text-[#0F172A] text-xs font-semibold">
            <Icon name="MonitorUp" className="w-3.5 h-3.5" />
            Presenting
          </div>
        )}

        {/* Pin button */}
        {onPin && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPin();
            }}
            className={cn(
              "absolute top-3 right-3 inline-flex items-center justify-center w-7 h-7 rounded-full transition-colors z-10",
              isPinned
                ? "bg-[#0B5CFF]/80 text-white hover:bg-[#0B5CFF]"
                : "bg-black/40 text-white/70 hover:bg-black/60 hover:text-white"
            )}
            title={isPinned ? "Unpin" : "Pin"}
          >
            <Icon name="Pin" className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Hand raised badge */}
        {isHandRaised && (
          <div className="absolute top-3 left-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#FEBD00]/80 text-[#0F172A] text-[10px] font-bold">
            <Icon name="Hand" className="w-3 h-3" />
            Hand
          </div>
        )}

        {/* Name tag */}
        <div className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/50 backdrop-blur-sm border border-white/10">
          <Icon
            name={isMuted ? "MicOff" : "Mic"}
            className={cn(
              "w-3.5 h-3.5",
              isMuted ? "text-red-400" : "text-white/80"
            )}
          />
          <span className="text-xs font-medium text-white truncate max-w-[120px]">
            {name || "Guest"}
          </span>
        </div>

        {/* Active speaker indicator */}
        {isActiveSpeaker && !isScreenShare && (
          <div className="absolute top-3 left-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#0B5CFF]/80 text-white text-[10px] font-semibold">
            <Icon name="Volume2" className="w-3 h-3" />
            Speaking
          </div>
        )}

        {/* Reaction bubble */}
        <ReactionBubbleContainer emoji={reaction} />
      </div>
    );
  }
);

VideoTile.displayName = "VideoTile";

export default VideoTile;