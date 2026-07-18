"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMeeting, usePubSub } from "@videosdk.live/react-sdk";
import { cn } from "@/lib/utils";
import Icon from "@/components/Icon";
import type { IconName } from "@/components/Icon";

const REACTIONS = ["👍", "❤️", "🎉", "😂", "👏"];

type ControlBarProps = {
  onLeave: () => void;
  participantsOpen: boolean;
  onParticipantsOpenChange: (open: boolean) => void;
  chatOpen: boolean;
  onChatOpenChange: (open: boolean) => void;
  localParticipantId: string;
  isJoined: boolean;
};

export default function ControlBar({
  onLeave,
  participantsOpen,
  onParticipantsOpenChange,
  chatOpen,
  onChatOpenChange,
  localParticipantId,
  isJoined,
}: ControlBarProps) {
  const meeting = useMeeting();
  const { publish: publishRaiseHand, messages: raisedHandMessages } = usePubSub("RAISE_HAND");
  const { publish: publishReactions } = usePubSub("REACTIONS");

  const [showReactions, setShowReactions] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const reactionsRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (reactionsRef.current && !reactionsRef.current.contains(e.target as Node)) {
        setShowReactions(false);
      }
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setShowMore(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const participantCount = useMemo(() => {
    const localParticipantIncluded = meeting.localParticipant
      ? meeting.participants.has(meeting.localParticipant.id)
      : false;

    return meeting.participants.size + (meeting.localParticipant && !localParticipantIncluded ? 1 : 0);
  }, [meeting.localParticipant, meeting.participants]);

  const isHandRaised = useMemo(() => {
    for (let index = raisedHandMessages.length - 1; index >= 0; index -= 1) {
      const message = raisedHandMessages[index];
      if (message.senderId !== localParticipantId) continue;

      const payload = message.payload as { raised?: boolean } | undefined;
      if (typeof payload?.raised === "boolean") {
        return payload.raised;
      }

      return message.message === "raise";
    }

    return false;
  }, [localParticipantId, raisedHandMessages]);

  const toggleMic = useCallback(() => {
    if (!isJoined) return;
    meeting.localMicOn ? meeting.muteMic() : meeting.unmuteMic();
  }, [meeting, isJoined]);

  const toggleCamera = useCallback(() => {
    if (!isJoined) return;
    meeting.localWebcamOn ? meeting.disableWebcam() : meeting.enableWebcam();
  }, [meeting, isJoined]);

  const toggleScreenShare = useCallback(() => {
    if (!isJoined) return;
    meeting.localScreenShareOn
      ? meeting.disableScreenShare()
      : meeting.enableScreenShare();
  }, [meeting, isJoined]);

  const toggleHand = useCallback(() => {
    if (!isJoined) return;
    const nextRaised = !isHandRaised;
    void publishRaiseHand(
      nextRaised ? "raise" : "lower",
      { persist: true },
      { raised: nextRaised, participantId: localParticipantId }
    );
  }, [isHandRaised, localParticipantId, publishRaiseHand, isJoined]);

  const sendReaction = useCallback(
    (emoji: string) => {
      if (!isJoined) return;
      setShowReactions(false);
      void publishReactions(emoji, { persist: false }, {
        emoji,
        expiresAt: Date.now() + 2200,
      });
    },
    [publishReactions, isJoined]
  );

  const avBtn = (
    icon: IconName,
    label: string,
    active: boolean,
    onClick: () => void,
    disabled = false
  ) => (
    <button
      key={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex flex-col items-center justify-center gap-1 group touch-manipulation",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      title={label}
    >
      <div
        className={cn(
          "flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full transition-colors",
          active
            ? "bg-white/10 text-white hover:bg-white/20"
            : "bg-red-500/80 text-white hover:bg-red-500",
          disabled && "hover:bg-white/10"
        )}
      >
        <Icon name={icon} className="h-5 w-5" />
      </div>
      <span className="hidden text-[10px] text-[#94A3B8] transition-colors group-hover:text-white sm:block">
        {label}
      </span>
    </button>
  );

  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
      <div className="flex items-center gap-1 rounded-full border border-white/10 bg-black/60 px-3 py-2 shadow-2xl shadow-black/40 backdrop-blur-xl sm:gap-2 sm:px-4 sm:py-2.5">
        {avBtn(
          meeting.localMicOn ? "Mic" : "MicOff",
          meeting.localMicOn ? "Mute" : "Unmute",
          meeting.localMicOn,
          toggleMic
        )}
        {avBtn(
          meeting.localWebcamOn ? "Video" : "VideoOff",
          meeting.localWebcamOn ? "Stop Video" : "Start Video",
          meeting.localWebcamOn,
          toggleCamera
        )}

        <div className="hidden h-8 w-px bg-white/10 sm:block" />

        <div className="hidden items-center gap-1 sm:flex sm:gap-2">
          <button
            onClick={() => onParticipantsOpenChange(!participantsOpen)}
            className="group flex flex-col items-center justify-center gap-1 touch-manipulation"
            title="Participants"
          >
            <div className="relative flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20">
              <Icon name="Users" className="h-5 w-5" />
              <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#0B5CFF] px-1 text-[10px] font-bold text-white">
                {participantCount}
              </span>
            </div>
            <span className="text-[10px] text-[#94A3B8] transition-colors group-hover:text-white">
              People
            </span>
          </button>

          <button
            onClick={() => onChatOpenChange(!chatOpen)}
            className="group flex flex-col items-center justify-center gap-1 touch-manipulation"
            title="Chat"
          >
            <div className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20">
              <Icon name="MessageSquare" className="h-5 w-5" />
            </div>
            <span className="text-[10px] text-[#94A3B8] transition-colors group-hover:text-white">
              Chat
            </span>
          </button>

          <div className="relative" ref={reactionsRef}>
            <button
              onClick={() => setShowReactions((current) => !current)}
              className="group flex flex-col items-center justify-center gap-1 touch-manipulation"
              title="Reactions"
            >
              <div className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20">
                <Icon name="Smile" className="h-5 w-5" />
              </div>
              <span className="text-[10px] text-[#94A3B8] transition-colors group-hover:text-white">
                React
              </span>
            </button>
            {showReactions ? (
              <div className="absolute bottom-full left-1/2 mb-2 flex -translate-x-1/2 flex-col gap-2 rounded-2xl border border-white/10 bg-black/80 px-3 py-3 shadow-xl backdrop-blur-xl">
                <button
                  onClick={toggleHand}
                  className={cn(
                    "flex min-h-[44px] min-w-[44px] items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                    isHandRaised
                      ? "bg-[#FEBD00]/15 text-[#FEBD00] hover:bg-[#FEBD00]/20"
                      : "bg-white/10 text-white hover:bg-white/20"
                  )}
                >
                  <Icon name="Hand" className="h-4 w-4" />
                  {isHandRaised ? "Lower Hand" : "Raise Hand"}
                </button>
                <div className="flex items-center gap-1 border-t border-white/10 pt-2">
                  {REACTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => sendReaction(emoji)}
                      className="flex min-h-[44px] min-w-[44px] items-center justify-center select-none text-xl transition-transform hover:scale-125"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {avBtn(
            "MonitorUp",
            meeting.localScreenShareOn ? "Stop Share" : "Share",
            meeting.localScreenShareOn,
            toggleScreenShare
          )}

          <button
            onClick={() => {
              onLeave();
              meeting.leave();
            }}
            className="group flex flex-col items-center justify-center gap-1 touch-manipulation"
            title="Leave meeting"
          >
            <div className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-red-500 text-white transition-colors hover:bg-red-600">
              <Icon name="PhoneOff" className="h-5 w-5" />
            </div>
            <span className="text-[10px] text-[#94A3B8] transition-colors group-hover:text-white">
              Leave
            </span>
          </button>
        </div>

        <div className="relative sm:hidden" ref={moreRef}>
          <button
            onClick={() => setShowMore((current) => !current)}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            title="More"
          >
            <Icon name="MoreHorizontal" className="h-5 w-5" />
          </button>
          {showMore ? (
            <div className="absolute bottom-full left-1/2 mb-2 flex -translate-x-1/2 items-center gap-2 rounded-2xl border border-white/10 bg-black/80 px-4 py-3 shadow-xl backdrop-blur-xl">
              <button
                onClick={() => {
                  onParticipantsOpenChange(!participantsOpen);
                  setShowMore(false);
                }}
                className="flex flex-col items-center gap-1"
              >
                <div className="relative flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-white/10 text-white">
                  <Icon name="Users" className="h-4 w-4" />
                  <span className="absolute -right-0.5 -top-0.5 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-[#0B5CFF] px-1 text-[9px] font-bold text-white">
                    {participantCount}
                  </span>
                </div>
                <span className="text-[9px] text-[#94A3B8]">People</span>
              </button>
              <button
                onClick={() => {
                  onChatOpenChange(!chatOpen);
                  setShowMore(false);
                }}
                className="flex flex-col items-center gap-1"
              >
                <div className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-white/10 text-white">
                  <Icon name="MessageSquare" className="h-4 w-4" />
                </div>
                <span className="text-[9px] text-[#94A3B8]">Chat</span>
              </button>
              <button
                onClick={() => {
                  toggleScreenShare();
                  setShowMore(false);
                }}
                className="flex flex-col items-center gap-1"
              >
                <div className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-white/10 text-white">
                  <Icon name="MonitorUp" className="h-4 w-4" />
                </div>
                <span className="text-[9px] text-[#94A3B8]">Share</span>
              </button>
              <button
                onClick={() => {
                  onLeave();
                  meeting.leave();
                }}
                className="flex flex-col items-center gap-1"
              >
                <div className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-red-500 text-white">
                  <Icon name="PhoneOff" className="h-4 w-4" />
                </div>
                <span className="text-[9px] text-[#94A3B8]">Leave</span>
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
