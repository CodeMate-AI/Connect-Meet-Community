"use client";

import { useEffect, useMemo, useRef } from "react";
import { useParticipant } from "@videosdk.live/react-sdk";
import AnonymousAvatar from "@/components/ui/AnonymousAvatar";
import { cn } from "@/lib/utils";
import Icon from "@/components/Icon";
import { ReactionBubbleContainer } from "@/components/call/ReactionBubble";

type VideoTileProps = {
  participantId: string;
  mode?: "video" | "share";
  showAudio?: boolean;
  className?: string;
  classNameVideo?: string;
  raisedHand?: boolean;
  reaction?: string | null;
  spotlight?: boolean;
};

export default function VideoTile({
  participantId,
  mode = "video",
  showAudio = true,
  className,
  classNameVideo,
  raisedHand,
  reaction,
  spotlight,
}: VideoTileProps) {
  const {
    displayName,
    webcamStream,
    micStream,
    screenShareStream,
    screenShareAudioStream,
    webcamOn,
    micOn,
    screenShareOn,
    screenShareAudioOn,
    isLocal,
    isActiveSpeaker,
    participant,
  } = useParticipant(participantId);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const selectedVideoStream = mode === "share" ? screenShareStream : webcamStream;
  const isVideoEnabled = mode === "share" ? screenShareOn : webcamOn;
  const selectedAudioStream = useMemo(() => {
    if (mode === "share" && screenShareAudioOn && screenShareAudioStream) {
      return screenShareAudioStream;
    }
    return micStream;
  }, [micStream, mode, screenShareAudioOn, screenShareAudioStream]);
  const isAudioEnabled = mode === "share" ? screenShareAudioOn || micOn : micOn;

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    if (isVideoEnabled && selectedVideoStream?.track) {
      const mediaStream = new MediaStream();
      mediaStream.addTrack(selectedVideoStream.track);
      el.srcObject = mediaStream;
      el.muted = true;
      el.setAttribute("playsinline", "true");
      el.setAttribute("webkit-playsinline", "true");
      el.play().catch(() => undefined);
    } else {
      el.srcObject = null;
    }
  }, [isVideoEnabled, selectedVideoStream]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el || !showAudio || isLocal) return;

    if (isAudioEnabled && selectedAudioStream?.track) {
      const mediaStream = new MediaStream();
      mediaStream.addTrack(selectedAudioStream.track);
      el.srcObject = mediaStream;
      el.play().catch(() => undefined);
    } else {
      el.srcObject = null;
    }
  }, [isAudioEnabled, isLocal, selectedAudioStream, showAudio]);

  return (
    <div
      className={cn(
        "relative isolate overflow-hidden rounded-2xl bg-[#0F172A] shadow-lg shadow-black/25 ring-1 ring-white/10 transition-all",
        isActiveSpeaker && !spotlight && "ring-2 ring-[#0B5CFF]",
        spotlight && "ring-2 ring-[#FEBD00]",
        className
      )}
    >
      <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-black/45" />

      {isVideoEnabled ? (
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className={cn(
            "absolute inset-0 h-full w-full object-cover",
            mode === "share" ? "object-contain bg-black" : "",
            isLocal && mode !== "share" ? "scale-x-[-1]" : "",
            classNameVideo
          )}
        />
      ) : null}

      {!isVideoEnabled ? (
        <div className="absolute inset-0 flex items-center justify-center bg-[#111827]">
          <div className="h-20 w-20 rounded-2xl overflow-hidden shadow-lg border border-white/10 shrink-0">
            <AnonymousAvatar />
          </div>
        </div>
      ) : null}

      {mode === "share" ? (
        <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-[#FEBD00]/95 px-2.5 py-1 text-xs font-semibold text-[#0F172A] shadow-lg">
          <Icon name="MonitorUp" className="h-3.5 w-3.5" />
          Presenting
        </div>
      ) : null}

      {raisedHand ? (
        <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-[#FEBD00]/85 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#0F172A] shadow-lg">
          <Icon name="Hand" className="h-3 w-3" />
          Raised
        </div>
      ) : null}

      {isActiveSpeaker && mode !== "share" ? (
        <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-[#0B5CFF]/85 px-2 py-1 text-[10px] font-semibold text-white shadow-lg">
          <Icon name="Volume2" className="h-3 w-3" />
          Speaking
        </div>
      ) : null}

      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
        <div className="inline-flex max-w-[75%] items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 backdrop-blur-sm">
          <Icon
            name={micOn ? "Mic" : "MicOff"}
            className={cn("h-3.5 w-3.5", micOn ? "text-[#E2E8F0]" : "text-red-300")}
          />
          <span className="truncate text-xs font-medium text-white">
            {displayName || "Guest"}
          </span>
        </div>

        {!isLocal ? (
          <audio ref={audioRef} autoPlay playsInline className="hidden" />
        ) : null}
      </div>

      <ReactionBubbleContainer emoji={reaction} />
    </div>
  );
}
