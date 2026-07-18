"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useMeetingStore } from "@/lib/store";
import VideoTile from "./VideoTile";

interface Participant {
  id: string;
  name: string;
  stream: MediaStream | null;
  muted: boolean;
  videoOff: boolean;
  screenSharing: boolean;
  handRaised: boolean;
  reaction: string | null;
}

function useAudioLevels(participants: Participant[]) {
  const [levels, setLevels] = useState<Record<string, number>>({});
  const ctxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<
    Map<string, { source: MediaStreamAudioSourceNode; analyser: AnalyserNode }>
  >(new Map());
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const ctx = new AudioContext();
    ctxRef.current = ctx;

    const tick = () => {
      const newLevels: Record<string, number> = {};
      nodesRef.current.forEach((node, id) => {
        const data = new Uint8Array(node.analyser.frequencyBinCount);
        node.analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        newLevels[id] = avg;
      });
      setLevels(newLevels);
      rafRef.current = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(rafRef.current);
      nodesRef.current.forEach((node) => {
        try {
          node.source.disconnect();
        } catch {}
      });
      ctx.close().catch(() => {});
    };
  }, []);

  useEffect(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    const currentIds = new Set(participants.map((p) => p.id));

    nodesRef.current.forEach((node, id) => {
      if (!currentIds.has(id)) {
        try {
          node.source.disconnect();
        } catch {}
        nodesRef.current.delete(id);
      }
    });

    participants.forEach((p) => {
      if (!p.stream || nodesRef.current.has(p.id)) return;
      const audioTracks = p.stream.getAudioTracks();
      if (audioTracks.length === 0) return;

      try {
        const source = ctx.createMediaStreamSource(p.stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8;
        source.connect(analyser);
        nodesRef.current.set(p.id, { source, analyser });
      } catch {
        // AudioContext may not be allowed
      }
    });
  }, [participants]);

  return levels;
}

function useOrientation() {
  const [isLandscape, setIsLandscape] = useState(false);

  useEffect(() => {
    const update = () => {
      setIsLandscape(
        typeof window !== "undefined" && window.innerWidth > window.innerHeight
      );
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);

    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  return isLandscape;
}

export default function VideoGrid() {
  const isLandscape = useOrientation();
  const localStream = useMeetingStore((s) => s.localStream);
  const screenStream = useMeetingStore((s) => s.screenStream);
  const remotePeers = useMeetingStore((s) => s.remotePeers);
  const localParticipant = useMeetingStore((s) => s.localParticipant);
  const setLocalParticipant = useMeetingStore((s) => s.setLocalParticipant);

  const handlePin = (id: string) => {
    const current = localParticipant.pinnedId;
    setLocalParticipant({ pinnedId: current === id ? null : id });
  };

  const participants: Participant[] = useMemo(() => {
    const list: Participant[] = [
      {
        id: localParticipant.id || "local",
        name: localParticipant.name,
        stream:
          localParticipant.screenSharing && screenStream
            ? screenStream
            : localStream,
        muted: localParticipant.muted,
        videoOff: localParticipant.videoOff,
        screenSharing: localParticipant.screenSharing,
        handRaised: localParticipant.handRaised,
        reaction: localParticipant.reaction,
      },
    ];

    Object.values(remotePeers).forEach((peer) => {
      list.push({
        id: peer.id,
        name: peer.state.name,
        stream: peer.stream,
        muted: peer.state.muted,
        videoOff: peer.state.videoOff,
        screenSharing: peer.state.screenSharing,
        handRaised: peer.state.handRaised,
        reaction: peer.state.reaction,
      });
    });

    return list;
  }, [
    localParticipant,
    localStream,
    screenStream,
    remotePeers,
  ]);

  const levels = useAudioLevels(participants);

  const screenSharer = participants.find((p) => p.screenSharing && p.stream);
  const pinned = participants.find((p) => p.id === localParticipant.pinnedId);

  const activeSpeakerId = useMemo(() => {
    if (participants.length <= 1) return null;
    const threshold = 15;
    let maxId: string | null = null;
    let maxLevel = 0;
    participants.forEach((p) => {
      if (p.muted) return;
      const level = levels[p.id] || 0;
      if (level > threshold && level > maxLevel) {
        maxLevel = level;
        maxId = p.id;
      }
    });
    return maxId;
  }, [levels, participants]);

  const layoutMode = useMemo(() => {
    if (screenSharer) return "screen-share" as const;
    if (pinned) return "single" as const;
    if (activeSpeakerId && participants.length > 1) return "single" as const;
    return "gallery" as const;
  }, [screenSharer, pinned, activeSpeakerId, participants.length]);

  // --- Screen Share Focus ---
  if (layoutMode === "screen-share" && screenSharer) {
    const others = participants.filter((p) => p.id !== screenSharer.id);
    return (
      <div className="flex flex-col h-full gap-3">
        <div className="flex-1 relative min-h-0">
          <VideoTile
            stream={screenSharer.stream}
            name={screenSharer.name}
            isMuted={screenSharer.muted}
            isCameraOff={false}
            isScreenShare
            isHandRaised={screenSharer.handRaised}
            reaction={screenSharer.reaction}
            className="absolute inset-0"
          />
        </div>
        {others.length > 0 && (
          <div className="flex gap-2 h-28 shrink-0 overflow-x-auto pb-1">
            {others.map((p) => (
              <VideoTile
                key={p.id}
                stream={p.stream}
                name={p.name}
                isMuted={p.muted}
                isCameraOff={p.videoOff}
                isPinned={localParticipant.pinnedId === p.id}
                isHandRaised={p.handRaised}
                reaction={p.reaction}
                onPin={() => handlePin(p.id)}
                className="h-28 w-40 shrink-0"
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // --- Single Speaker ---
  if (layoutMode === "single" && (pinned || activeSpeakerId)) {
    const main =
      pinned ||
      participants.find((p) => p.id === activeSpeakerId) ||
      participants[0];
    if (!main) return null;

    const others = participants.filter((p) => p.id !== main.id);

    return (
      <div className="flex flex-col h-full gap-3">
        <div className="flex-1 relative min-h-0">
          <VideoTile
            stream={main.stream}
            name={main.name}
            isMuted={main.muted}
            isCameraOff={main.videoOff}
            isPinned={localParticipant.pinnedId === main.id}
            isActiveSpeaker={main.id === activeSpeakerId}
            isHandRaised={main.handRaised}
            reaction={main.reaction}
            onPin={() => handlePin(main.id)}
            className="absolute inset-0"
          />
        </div>
        {others.length > 0 && (
          <div className="flex gap-2 h-28 shrink-0 overflow-x-auto pb-1">
            {others.map((p) => (
              <VideoTile
                key={p.id}
                stream={p.stream}
                name={p.name}
                isMuted={p.muted}
                isCameraOff={p.videoOff}
                isPinned={localParticipant.pinnedId === p.id}
                isHandRaised={p.handRaised}
                reaction={p.reaction}
                onPin={() => handlePin(p.id)}
                className="h-28 w-40 shrink-0"
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // --- Gallery Grid ---
  // Mobile portrait: 1 col, mobile landscape: 2 cols
  const gridClasses = isLandscape
    ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3"
    : "grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3";

  return (
    <div className={gridClasses}>
      {participants.map((p) => (
        <VideoTile
          key={p.id}
          stream={p.stream}
          name={p.name}
          isMuted={p.muted}
          isCameraOff={p.videoOff}
          isPinned={localParticipant.pinnedId === p.id}
          isHandRaised={p.handRaised}
          reaction={p.reaction}
          onPin={() => handlePin(p.id)}
          className="aspect-video"
        />
      ))}
    </div>
  );
}
