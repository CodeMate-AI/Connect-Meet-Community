"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMeetingStore } from "@/lib/store";
import { startScreenShare, replaceTrack } from "@/lib/webrtc";
import Icon from "@/components/Icon";
import type { IconName } from "@/components/Icon";
import { cn } from "@/lib/utils";

const REACTIONS = ["👍", "❤️", "🎉", "😂", "👏"];

export default function ControlBar() {
  const router = useRouter();

  const localParticipant = useMeetingStore((s) => s.localParticipant);
  const localStream = useMeetingStore((s) => s.localStream);
  const screenStream = useMeetingStore((s) => s.screenStream);
  const remotePeers = useMeetingStore((s) => s.remotePeers);
  const settings = useMeetingStore((s) => s.settings);
  const isChatOpen = useMeetingStore((s) => s.isChatOpen);
  const isParticipantsOpen = useMeetingStore((s) => s.isParticipantsOpen);
  const setLocalParticipant = useMeetingStore((s) => s.setLocalParticipant);
  const setScreenStream = useMeetingStore((s) => s.setScreenStream);
  const setChatOpen = useMeetingStore((s) => s.setChatOpen);
  const setParticipantsOpen = useMeetingStore((s) => s.setParticipantsOpen);
  const setHostSettingsOpen = useMeetingStore((s) => s.setHostSettingsOpen);
  const reset = useMeetingStore((s) => s.reset);

  const [showReactions, setShowReactions] = useState(false);
  const [showMore, setShowMore] = useState(false);

  const reactionsRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        reactionsRef.current &&
        !reactionsRef.current.contains(e.target as Node)
      ) {
        setShowReactions(false);
      }
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setShowMore(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggleMic = useCallback(() => {
    if (!localStream) return;
    const next = !localParticipant.muted;
    if (next && !settings.isUnmuteAllowed) return;
    localStream.getAudioTracks().forEach((t) => {
      t.enabled = !next;
    });
    setLocalParticipant({ muted: next });
  }, [localStream, localParticipant.muted, settings.isUnmuteAllowed, setLocalParticipant]);

  const toggleCamera = useCallback(() => {
    if (!localStream) return;
    const next = !localParticipant.videoOff;
    if (next && !settings.isVideoAllowed) return;
    localStream.getVideoTracks().forEach((t) => {
      t.enabled = !next;
    });
    setLocalParticipant({ videoOff: next });
  }, [localStream, localParticipant.videoOff, settings.isVideoAllowed, setLocalParticipant]);

  const stopScreenShare = useCallback(() => {
    if (!screenStream) return;
    screenStream.getTracks().forEach((t) => t.stop());
    setScreenStream(null);
    setLocalParticipant({ screenSharing: false });

    const camStream = useMeetingStore.getState().localStream;
    if (camStream) {
      const videoTrack = camStream.getVideoTracks()[0];
      if (videoTrack) {
        Object.values(useMeetingStore.getState().remotePeers).forEach((peer) => {
          replaceTrack(peer.connection, videoTrack);
        });
      }
    }
  }, [screenStream, setScreenStream, setLocalParticipant]);

  const toggleScreenShare = useCallback(async () => {
    if (screenStream) {
      stopScreenShare();
      return;
    }

    if (!settings.isScreenShareAllowed) return;

    try {
      const sStream = await startScreenShare();
      setScreenStream(sStream);
      setLocalParticipant({ screenSharing: true });

      const vTrack = sStream.getVideoTracks()[0];
      if (vTrack) {
        Object.values(useMeetingStore.getState().remotePeers).forEach((peer) => {
          replaceTrack(peer.connection, vTrack);
        });
        vTrack.onended = () => {
          stopScreenShare();
        };
      }
    } catch (err) {
      console.error("Screen share failed:", err);
    }
  }, [screenStream, settings.isScreenShareAllowed, setScreenStream, setLocalParticipant, stopScreenShare]);

  const toggleHand = useCallback(() => {
    setLocalParticipant({ handRaised: !localParticipant.handRaised });
  }, [localParticipant.handRaised, setLocalParticipant]);

  const sendReaction = useCallback(
    (emoji: string) => {
      setLocalParticipant({ reaction: emoji });
      setShowReactions(false);
      setTimeout(() => setLocalParticipant({ reaction: null }), 3000);
    },
    [setLocalParticipant]
  );

  const handleLeave = useCallback(() => {
    reset();
    router.push("/");
  }, [reset, router]);

  const participantCount = 1 + Object.keys(remotePeers).length;

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
          "flex items-center justify-center rounded-full transition-colors min-h-[44px] min-w-[44px]",
          active
            ? "bg-white/10 text-white hover:bg-white/20"
            : "bg-red-500/80 text-white hover:bg-red-500",
          disabled && "hover:bg-white/10"
        )}
      >
        <Icon name={icon} className="w-5 h-5" />
      </div>
      <span className="hidden sm:block text-[10px] text-[#94A3B8] group-hover:text-white transition-colors">
        {label}
      </span>
    </button>
  );

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-1 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-full bg-black/60 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/40">
        {/* AV Controls */}
        {avBtn(
          localParticipant.muted ? "MicOff" : "Mic",
          localParticipant.muted ? "Unmute" : "Mute",
          !localParticipant.muted,
          toggleMic,
          localParticipant.muted && !settings.isUnmuteAllowed
        )}
        {avBtn(
          localParticipant.videoOff ? "VideoOff" : "Video",
          localParticipant.videoOff ? "Start Video" : "Stop Video",
          !localParticipant.videoOff,
          toggleCamera,
          localParticipant.videoOff && !settings.isVideoAllowed
        )}

        <div className="hidden sm:block w-px h-8 bg-white/10 mx-1" />

        {/* Meeting Controls — Desktop */}
        <div className="hidden sm:flex items-center gap-1 sm:gap-2">
          {/* Participants */}
          <button
            onClick={() => setParticipantsOpen(!isParticipantsOpen)}
            className="flex flex-col items-center justify-center gap-1 group relative touch-manipulation"
            title="Participants"
          >
            <div className="flex items-center justify-center min-h-[44px] min-w-[44px] rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors">
              <Icon name="Users" className="w-5 h-5" />
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-[#0B5CFF] text-white text-[10px] font-bold px-1">
                {participantCount}
              </span>
            </div>
            <span className="text-[10px] text-[#94A3B8] group-hover:text-white transition-colors">
              People
            </span>
          </button>

          {/* Chat */}
          <button
            onClick={() => setChatOpen(!isChatOpen)}
            className="flex flex-col items-center justify-center gap-1 group touch-manipulation"
            title="Chat"
            disabled={!settings.isChatAllowed}
          >
            <div className={cn(
              "flex items-center justify-center min-h-[44px] min-w-[44px] rounded-full text-white transition-colors",
              settings.isChatAllowed ? "bg-white/10 hover:bg-white/20" : "bg-white/5"
            )}>
              <Icon name="MessageSquare" className="w-5 h-5" />
            </div>
            <span className="text-[10px] text-[#94A3B8] group-hover:text-white transition-colors">
              Chat
            </span>
          </button>

          {/* Reactions */}
          <div className="relative" ref={reactionsRef}>
            <button
              onClick={() => setShowReactions(!showReactions)}
              className="flex flex-col items-center justify-center gap-1 group touch-manipulation"
              title="Reactions"
            >
              <div className="flex items-center justify-center min-h-[44px] min-w-[44px] rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors">
                <Icon name="Smile" className="w-5 h-5" />
              </div>
              <span className="text-[10px] text-[#94A3B8] group-hover:text-white transition-colors">
                React
              </span>
            </button>
            {showReactions && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 flex items-center gap-1 px-3 py-2 rounded-full bg-black/80 backdrop-blur-xl border border-white/10 shadow-xl">
                {REACTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => sendReaction(emoji)}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center text-xl hover:scale-125 transition-transform select-none"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Share Screen */}
          {avBtn(
            "MonitorUp",
            localParticipant.screenSharing ? "Stop Share" : "Share",
            !localParticipant.screenSharing,
            toggleScreenShare,
            !localParticipant.screenSharing && !settings.isScreenShareAllowed
          )}

          {/* Host Shield */}
          {localParticipant.isHost && (
            <button
              onClick={() => setHostSettingsOpen(true)}
              className="flex flex-col items-center justify-center gap-1 group touch-manipulation"
              title="Host Controls"
            >
              <div className="flex items-center justify-center min-h-[44px] min-w-[44px] rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors">
                <Icon name="Shield" className="w-5 h-5" />
              </div>
              <span className="text-[10px] text-[#94A3B8] group-hover:text-white transition-colors">
                Host
              </span>
            </button>
          )}

          {/* Raise Hand */}
          {avBtn(
            "Hand",
            localParticipant.handRaised ? "Lower Hand" : "Raise Hand",
            !localParticipant.handRaised,
            toggleHand
          )}
        </div>

        {/* More — Mobile overflow */}
        <div className="relative sm:hidden" ref={moreRef}>
          <button
            onClick={() => setShowMore(!showMore)}
            className="flex items-center justify-center min-h-[44px] min-w-[44px] rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            title="More"
          >
            <Icon name="MoreHorizontal" className="w-5 h-5" />
          </button>
          {showMore && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 flex items-center gap-2 px-4 py-3 rounded-2xl bg-black/80 backdrop-blur-xl border border-white/10 shadow-xl">
              <button
                onClick={() => {
                  setParticipantsOpen(!isParticipantsOpen);
                  setShowMore(false);
                }}
                className="flex flex-col items-center gap-1"
              >
                <div className="relative flex items-center justify-center min-h-[44px] min-w-[44px] rounded-full bg-white/10 text-white">
                  <Icon name="Users" className="w-4 h-4" />
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] flex items-center justify-center rounded-full bg-[#0B5CFF] text-white text-[9px] font-bold px-1">
                    {participantCount}
                  </span>
                </div>
                <span className="text-[9px] text-[#94A3B8]">People</span>
              </button>
              <button
                onClick={() => {
                  if (settings.isChatAllowed) {
                    setChatOpen(!isChatOpen);
                  }
                  setShowMore(false);
                }}
                className="flex flex-col items-center gap-1"
                disabled={!settings.isChatAllowed}
              >
                <div className={cn(
                  "flex items-center justify-center min-h-[44px] min-w-[44px] rounded-full text-white",
                  settings.isChatAllowed ? "bg-white/10" : "bg-white/5"
                )}>
                  <Icon name="MessageSquare" className="w-4 h-4" />
                </div>
                <span className="text-[9px] text-[#94A3B8]">Chat</span>
              </button>
              <button
                onClick={() => {
                  toggleScreenShare();
                  setShowMore(false);
                }}
                className="flex flex-col items-center gap-1"
                disabled={!settings.isScreenShareAllowed && !localParticipant.screenSharing}
              >
                <div className="flex items-center justify-center min-h-[44px] min-w-[44px] rounded-full bg-white/10 text-white">
                  <Icon name="MonitorUp" className="w-4 h-4" />
                </div>
                <span className="text-[9px] text-[#94A3B8]">Share</span>
              </button>
              {localParticipant.isHost && (
                <button
                  onClick={() => {
                    setHostSettingsOpen(true);
                    setShowMore(false);
                  }}
                  className="flex flex-col items-center gap-1"
                >
                  <div className="flex items-center justify-center min-h-[44px] min-w-[44px] rounded-full bg-white/10 text-white">
                    <Icon name="Shield" className="w-4 h-4" />
                  </div>
                  <span className="text-[9px] text-[#94A3B8]">Host</span>
                </button>
              )}
              <button
                onClick={() => {
                  toggleHand();
                  setShowMore(false);
                }}
                className="flex flex-col items-center gap-1"
              >
                <div className="flex items-center justify-center min-h-[44px] min-w-[44px] rounded-full bg-white/10 text-white">
                  <Icon name="Hand" className="w-4 h-4" />
                </div>
                <span className="text-[9px] text-[#94A3B8]">Hand</span>
              </button>
            </div>
          )}
        </div>

        <div className="w-px h-8 bg-white/10 mx-1" />

        {/* End Call */}
        <button
          onClick={handleLeave}
          className="flex flex-col items-center justify-center gap-1 group touch-manipulation"
          title="End Call"
        >
          <div className="flex items-center justify-center min-h-[44px] min-w-[44px] rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors">
            <Icon name="PhoneOff" className="w-5 h-5" />
          </div>
          <span className="hidden sm:block text-[10px] text-[#94A3B8] group-hover:text-white transition-colors">
            Leave
          </span>
        </button>
      </div>
    </div>
  );
}
