"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMeetingStore } from "@/lib/store";
import { useSignaling } from "@/hooks/use-signaling";
import { useConnectionState } from "@/hooks/use-connection-state";
import { usePermissions } from "@/hooks/use-permissions";
import VideoGrid from "@/components/call/VideoGrid";
import ControlBar from "@/components/call/ControlBar";
import ParticipantsPanel from "@/components/call/ParticipantsPanel";
import ChatPanel from "@/components/call/ChatPanel";
import HostSettingsModal from "@/components/call/HostSettingsModal";
import ReconnectBanner from "@/components/call/ReconnectBanner";
import EmptyRoomState from "@/components/call/EmptyRoomState";
import Icon from "@/components/Icon";

export default function MeetingRoomPage() {
  const router = useRouter();
  const params = useParams();
  const meetingId = (params.id as string) || "";

  const [initialized, setInitialized] = useState(false);
  const [showHostLeft, setShowHostLeft] = useState(false);

  const setLocalStream = useMeetingStore((s) => s.setLocalStream);
  const setLocalParticipant = useMeetingStore((s) => s.setLocalParticipant);
  const setParticipantsOpen = useMeetingStore((s) => s.setParticipantsOpen);
  const setChatOpen = useMeetingStore((s) => s.setChatOpen);
  const reset = useMeetingStore((s) => s.reset);
  const remotePeers = useMeetingStore((s) => s.remotePeers);
  const localParticipant = useMeetingStore((s) => s.localParticipant);
  const isChatOpen = useMeetingStore((s) => s.isChatOpen);
  const isParticipantsOpen = useMeetingStore((s) => s.isParticipantsOpen);
  const settings = useMeetingStore((s) => s.settings);

  const { perms, isBlocked } = usePermissions();

  // Initialize local media stream
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      const name =
        typeof window !== "undefined"
          ? localStorage.getItem("connectmeet_display_name") || "Guest"
          : "Guest";

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        setLocalStream(stream);
        setLocalParticipant({ name });
      } catch {
        setLocalParticipant({ name, videoOff: true, muted: true });
      } finally {
        if (!cancelled) {
          setInitialized(true);
        }
      }
    };

    init();

    return () => {
      cancelled = true;
      reset();
    };
  }, [setLocalStream, setLocalParticipant, reset]);

  // Start signaling only after stream is ready
  const { myId } = useSignaling(initialized ? meetingId : "");

  // Monitor connection state for auto-reconnect
  const { status, retryCount } = useConnectionState(
    initialized ? meetingId : ""
  );

  // Sync myId into store participant id
  useEffect(() => {
    if (myId) {
      setLocalParticipant({ id: myId });
    }
  }, [myId, setLocalParticipant]);

  // Add tracks to any peer connections created before localStream arrived
  const localStream = useMeetingStore((s) => s.localStream);
  useEffect(() => {
    if (!localStream) return;
    Object.values(remotePeers).forEach((peer) => {
      localStream.getTracks().forEach((track) => {
        const exists = peer.connection
          .getSenders()
          .some((s) => s.track?.id === track.id);
        if (!exists) {
          peer.connection.addTrack(track, localStream);
        }
      });
    });
  }, [localStream, remotePeers]);

  // Host departure detection: if there is a host in remotePeers and they leave
  const hadHostRef = useState(false);
  useEffect(() => {
    const peers = Object.values(remotePeers);
    const hasHost = peers.some((p) => p.state.isHost);
    if (hasHost) {
      hadHostRef[1](true);
    } else if (hadHostRef[0] && !hasHost && peers.length > 0) {
      setShowHostLeft(true);
      const timer = setTimeout(() => setShowHostLeft(false), 15000);
      return () => clearTimeout(timer);
    }
  }, [remotePeers, hadHostRef]);

  const handleClaimHost = () => {
    setLocalParticipant({ isHost: true });
    setShowHostLeft(false);
  };

  const handleLeave = () => {
    reset();
    router.push("/");
  };

  const hasRemotePeers = Object.keys(remotePeers).length > 0;
  const mainContentClass = [
    "flex-1 min-h-0 p-4 pb-28 sm:pb-24 relative transition-all",
    isParticipantsOpen ? "sm:pr-80" : "",
    isChatOpen ? "sm:pl-0" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="dark min-h-screen bg-[#0B1120] flex flex-col">
      {/* Reconnect Banner */}
      <ReconnectBanner status={status} retryCount={retryCount} />

      {/* Permission Denied Banner */}
      {isBlocked && (
        <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-5 py-3 text-center">
          <p className="text-xs text-yellow-400/90">
            Camera or microphone access is blocked. Enable permissions in your
            browser settings to use full features.
          </p>
        </div>
      )}

      {/* Host Left Banner */}
      {showHostLeft && (
        <div className="bg-[#FEBD00]/10 border-b border-[#FEBD00]/20 px-5 py-3 text-center">
          <div className="flex items-center justify-center gap-3">
            <Icon name="Shield" className="w-4 h-4 text-[#FEBD00]" />
            <p className="text-xs text-[#FEBD00]">
              The host has left the meeting.
            </p>
            <button
              onClick={handleClaimHost}
              className="text-xs font-medium text-[#0B5CFF] hover:text-[#3B82F6] hover:underline transition-colors"
            >
              Claim host
            </button>
            <button
              onClick={handleLeave}
              className="text-xs font-medium text-[#94A3B8] hover:text-white hover:underline transition-colors"
            >
              Leave
            </button>
          </div>
        </div>
      )}

      {/* Main content area */}
      <div className={mainContentClass}>
        {hasRemotePeers ? (
          <VideoGrid />
        ) : (
          <EmptyRoomState meetingId={meetingId} />
        )}
      </div>

      {/* Floating Control Bar */}
      <ControlBar />

      {/* Side Panels & Modals */}
      <ParticipantsPanel
        open={isParticipantsOpen}
        onOpenChange={setParticipantsOpen}
      />
      <ChatPanel />
      <HostSettingsModal />

      {/* Meeting info strip */}
      <div className="flex items-center justify-between px-5 py-2 bg-[#0B1120] border-t border-white/[0.06]">
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#64748B]">Meeting ID</span>
          <code className="text-xs font-mono text-[#E2E8F0]">{meetingId}</code>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[#94A3B8]">
          <Icon name="Users" className="w-3.5 h-3.5" />
          <span>{1 + Object.keys(remotePeers).length} participants</span>
        </div>
      </div>
    </div>
  );
}
