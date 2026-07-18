"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  MeetingProvider,
  useMeeting,
  usePubSub,
} from "@videosdk.live/react-sdk";
import VideoGrid from "@/components/call/VideoGrid";
import ControlBar from "@/components/call/ControlBar";
import ParticipantsPanel from "@/components/call/ParticipantsPanel";
import ChatPanel from "@/components/call/ChatPanel";
import EmptyRoomState from "@/components/call/EmptyRoomState";
import Icon from "@/components/Icon";

const DISPLAY_NAME_KEY = "connectmeet_display_name";

type PresenceMap = Record<string, boolean>;
type ReactionMap = Record<string, string | null>;

function buildRaisedHands(
  messages: Array<{
    senderId: string;
    message: string;
    payload: object;
  }>,
  participantIds: string[]
): PresenceMap {
  const next: PresenceMap = {};
  const activeIds = new Set(participantIds);

  messages.forEach((entry) => {
    if (!activeIds.has(entry.senderId)) return;
    const payload = entry.payload as { raised?: boolean } | undefined;
    if (typeof payload?.raised === "boolean") {
      next[entry.senderId] = payload.raised;
      return;
    }
    next[entry.senderId] = entry.message === "raise";
  });

  return next;
}

function buildReactions(
  messages: Array<{
    senderId: string;
    message: string;
    timestamp: string;
    payload: object;
  }>,
  participantIds: string[],
  now: number
): ReactionMap {
  const next: ReactionMap = {};
  const activeIds = new Set(participantIds);

  messages.forEach((entry) => {
    if (!activeIds.has(entry.senderId)) return;
    const payload = entry.payload as { emoji?: string; expiresAt?: number };
    const emoji = payload?.emoji || entry.message;
    if (!emoji) return;

    const entryTimestamp = new Date(entry.timestamp).getTime();
    const expiresAt = payload?.expiresAt ?? entryTimestamp + 2200;
    if (expiresAt > now) {
      next[entry.senderId] = emoji;
    }
  });

  return next;
}

function ActiveMeetingRoom({
  meeting,
  isJoined,
  onLeave,
}: {
  meeting: ReturnType<typeof useMeeting>;
  isJoined: boolean;
  onLeave: () => void;
}) {
  const [clock, setClock] = useState(() => Date.now());
  const [participantsOpen, setParticipantsOpen] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);

  const participantIds = useMemo(
    () => Array.from(meeting.participants.keys()),
    [meeting.participants]
  );

  const localParticipantId = meeting.localParticipant?.id || "";

  const remoteCount = useMemo(() => {
    return participantIds.filter((id) => id !== localParticipantId).length;
  }, [participantIds, localParticipantId]);

  const totalParticipantCount = useMemo(() => {
    const set = new Set(participantIds);
    if (localParticipantId) {
      set.add(localParticipantId);
    }
    return set.size;
  }, [participantIds, localParticipantId]);

  const showMainGrid = remoteCount > 0;
  const showSidebar = participantsOpen || chatOpen;

  const { messages: raisedHandMessages } = usePubSub("RAISE_HAND");
  const { messages: reactionMessages } = usePubSub("REACTIONS");

  useEffect(() => {
    const timer = window.setInterval(() => setClock(Date.now()), 500);
    return () => window.clearInterval(timer);
  }, []);

  const raisedHands = useMemo(
    () => buildRaisedHands(raisedHandMessages, participantIds),
    [participantIds, raisedHandMessages]
  );

  const reactions = useMemo(
    () => buildReactions(reactionMessages, participantIds, clock),
    [clock, participantIds, reactionMessages]
  );

  const sidebar = showSidebar ? (
    <div className="hidden xl:flex min-h-0 flex-col gap-4">
      {participantsOpen && (
        <ParticipantsPanel
          open={participantsOpen}
          onOpenChange={setParticipantsOpen}
          raisedHands={raisedHands}
          className="min-h-0 flex-1"
        />
      )}
      {chatOpen && (
        <ChatPanel
          open={chatOpen}
          onOpenChange={setChatOpen}
          className="min-h-0 flex-1"
        />
      )}
    </div>
  ) : null;

  return (
    <div className="dark min-h-screen bg-[#0B1120] flex flex-col text-[#E2E8F0]">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.24em] text-[#64748B]">
            ConnectMeet Meeting
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-[#94A3B8]">
            <span className="font-medium text-[#E2E8F0]">
              {meeting.localParticipant?.displayName || "Guest"}
            </span>
            <span className="hidden sm:inline text-[#475569]">•</span>
            <span className="font-mono text-[#94A3B8]">{meeting.meetingId}</span>
            <span className="hidden sm:inline text-[#475569]">•</span>
            <span>{totalParticipantCount} participants</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
          <Icon name="Shield" className="h-4 w-4 text-[#0B5CFF]" />
          <span className="hidden sm:inline">Live connection</span>
        </div>
      </div>

      <div
        className={`grid flex-1 min-h-0 gap-4 px-4 py-4 pb-32 sm:px-6 lg:pb-28 ${
          showSidebar ? "xl:grid-cols-[minmax(0,1fr)_22rem]" : ""
        }`}
      >
        <main className="min-h-0 rounded-3xl border border-white/10 bg-[#0F172A]/90 p-3 shadow-2xl shadow-black/20 sm:p-4">
          {showMainGrid ? (
            <VideoGrid raisedHands={raisedHands} reactions={reactions} />
          ) : (
            <div className="h-full min-h-[28rem] rounded-2xl border border-dashed border-white/10 bg-[#0B1120]/70">
              <EmptyRoomState meetingId={meeting.meetingId} />
            </div>
          )}
        </main>

        {showSidebar && sidebar}
      </div>

      <ControlBar
        onLeave={onLeave}
        participantsOpen={participantsOpen}
        onParticipantsOpenChange={setParticipantsOpen}
        chatOpen={chatOpen}
        onChatOpenChange={setChatOpen}
        localParticipantId={localParticipantId}
        isJoined={isJoined}
      />
    </div>
  );
}

function MeetingRoomContent() {
  const [isJoined, setIsJoined] = useState(false);

  const meeting = useMeeting({
    onMeetingJoined: () => {
      setTimeout(() => {
        setIsJoined(true);
      }, 500);
    },
    onMeetingLeft: () => {
      setIsJoined(false);
    },
  });

  const { join, leave } = meeting;
  const joinAttempted = useRef(false);

  const joinRef = useRef(join);
  const leaveRef = useRef(leave);
  const isJoinedRef = useRef(isJoined);

  useEffect(() => {
    joinRef.current = join;
    leaveRef.current = leave;
    isJoinedRef.current = isJoined;
  });

  useEffect(() => {
    if (!joinAttempted.current) {
      joinRef.current();
      joinAttempted.current = true;
    }
    return () => {
      if (isJoinedRef.current) {
        leaveRef.current();
      }
    };
  }, []);

  const handleLeave = useCallback(() => {
    meeting.leave();
    window.location.assign("/");
  }, [meeting]);

  if (!isJoined) {
    return (
      <div className="dark flex min-h-screen items-center justify-center bg-[#0B1120] px-6 text-center text-[#E2E8F0]">
        <div className="max-w-sm space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-[#0B5CFF]" />
          </div>
          <h1 className="text-xl font-semibold">Joining meeting</h1>
          <p className="text-sm text-[#94A3B8]">
            Establishing secure connection to the room...
          </p>
        </div>
      </div>
    );
  }

  return <ActiveMeetingRoom meeting={meeting} isJoined={isJoined} onLeave={handleLeave} />;
}

export default function MeetingRoomPageClient() {
  const router = useRouter();
  const params = useParams();
  const meetingId = (params.id as string) || "";

  const [displayName, setDisplayName] = useState("Guest");
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedName =
      typeof window !== "undefined"
        ? localStorage.getItem(DISPLAY_NAME_KEY) || "Guest"
        : "Guest";
    setDisplayName(savedName);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const fetchToken = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/videosdk/token", {
          method: "GET",
          signal: controller.signal,
        });

        const data = (await response.json()) as { token?: string; error?: string };
        if (!response.ok || !data.token) {
          throw new Error(data.error || "Unable to load VideoSDK token");
        }

        if (!cancelled) {
          setToken(data.token);
        }
      } catch (fetchError) {
        if (cancelled) return;
        const message
          = fetchError instanceof Error
            ? fetchError.message
            : "Unable to load VideoSDK token";
        setError(message);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchToken();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  const meetingConfig = useMemo(
    () => ({
      meetingId,
      name: displayName,
      micEnabled: true,
      webcamEnabled: true,
      autoConsume: true,
      debugMode: false,
      multiStream: true,
    }),
    [displayName, meetingId]
  );

  const handleReturn = useCallback(() => {
    router.push("/");
  }, [router]);

  if (loading) {
    return (
      <div className="dark flex min-h-screen items-center justify-center bg-[#0B1120] px-6 text-center text-[#E2E8F0]">
        <div className="max-w-sm space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-[#0B5CFF]" />
          </div>
          <h1 className="text-xl font-semibold">Connecting to meeting</h1>
          <p className="text-sm text-[#94A3B8]">
            Preparing your meeting session and joining as {displayName}.
          </p>
        </div>
      </div>
    );
  }

  if (error || !token) {
    return (
      <div className="dark flex min-h-screen items-center justify-center bg-[#0B1120] px-6 text-center text-[#E2E8F0]">
        <div className="max-w-md space-y-4 rounded-3xl border border-white/10 bg-[#0F172A]/90 p-6 shadow-2xl shadow-black/20">
          <Icon name="WifiOff" className="mx-auto h-10 w-10 text-red-400" />
          <div className="space-y-1">
            <h1 className="text-xl font-semibold">Unable to join meeting</h1>
            <p className="text-sm text-[#94A3B8]">
              {error || "The meeting token could not be loaded."}
            </p>
          </div>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleReturn}
              className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 text-sm font-medium text-[#E2E8F0] transition-colors hover:bg-white/10"
            >
              Return to dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <MeetingProvider config={meetingConfig} token={token}>
      <MeetingRoomContent />
    </MeetingProvider>
  );
}
