"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useMeetingStore } from "@/lib/store";

type ConnectionStatus = "connected" | "reconnecting" | "lost";

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 1000;

export function useConnectionState(meetingId: string) {
  const [status, setStatus] = useState<ConnectionStatus>("connected");
  const [retryCount, setRetryCount] = useState(0);

  const remotePeers = useMeetingStore((s) => s.remotePeers);
  const localParticipant = useMeetingStore((s) => s.localParticipant);
  const removeRemotePeer = useMeetingStore((s) => s.removeRemotePeer);

  const channelRef = useRef<BroadcastChannel | null>(null);
  const myIdRef = useRef<string>(localParticipant.id || "");
  const retryTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const retryCounts = useRef<Map<string, number>>(new Map());
  const hasLostRef = useRef(false);

  // Create or get BroadcastChannel
  useEffect(() => {
    if (!meetingId) return;
    const ch = new BroadcastChannel(`connectmeet-meeting-${meetingId}`);
    channelRef.current = ch;
    return () => {
      ch.close();
      channelRef.current = null;
    };
  }, [meetingId]);

  // Update myId when localParticipant.id changes
  useEffect(() => {
    if (localParticipant.id) {
      myIdRef.current = localParticipant.id;
    }
  }, [localParticipant.id]);

  const sendDiscover = useCallback(() => {
    const channel = channelRef.current;
    if (!channel || !myIdRef.current) return;
    channel.postMessage({
      type: "discover",
      from: myIdRef.current,
    });
  }, []);

  const scheduleReconnect = useCallback(
    (peerId: string) => {
      const currentRetries = retryCounts.current.get(peerId) || 0;
      if (currentRetries >= MAX_RETRIES) {
        hasLostRef.current = true;
        setStatus("lost");
        return;
      }

      setStatus("reconnecting");
      setRetryCount(currentRetries + 1);

      // Remove old peer first
      removeRemotePeer(peerId);

      const delay = BASE_DELAY_MS * Math.pow(2, currentRetries);

      const timer = setTimeout(() => {
        retryCounts.current.set(peerId, currentRetries + 1);
        sendDiscover();
      }, delay);

      retryTimers.current.set(peerId, timer);
    },
    [removeRemotePeer, sendDiscover]
  );

  // Monitor peer connection states for disconnects
  useEffect(() => {
    const handlers = new Map<string, () => void>();

    Object.entries(remotePeers).forEach(([peerId, peer]) => {
      if (handlers.has(peerId)) return;

      const onStateChange = () => {
        const connState = peer.connection.connectionState;
        const iceState = peer.connection.iceConnectionState;

        const isConnected =
          connState === "connected" || iceState === "connected";
        const isDisconnected =
          connState === "disconnected" ||
          connState === "failed" ||
          connState === "closed" ||
          iceState === "disconnected" ||
          iceState === "failed";

        if (isConnected) {
          // Reset retry count on successful connection
          retryCounts.current.set(peerId, 0);
          const existingTimer = retryTimers.current.get(peerId);
          if (existingTimer) {
            clearTimeout(existingTimer);
            retryTimers.current.delete(peerId);
          }
          if (hasLostRef.current) {
            hasLostRef.current = false;
          }
          setStatus("connected");
          return;
        }

        if (isDisconnected) {
          const existingTimer = retryTimers.current.get(peerId);
          if (existingTimer) return; // Already scheduled for reconnect

          const currentRetries = retryCounts.current.get(peerId) || 0;
          if (currentRetries >= MAX_RETRIES) {
            hasLostRef.current = true;
            setStatus("lost");
            return;
          }

          scheduleReconnect(peerId);
        }
      };

      peer.connection.addEventListener("connectionstatechange", onStateChange);
      peer.connection.addEventListener("iceconnectionstatechange", onStateChange);
      handlers.set(peerId, onStateChange);
    });

    return () => {
      handlers.forEach((fn, peerId) => {
        const peer = remotePeers[peerId];
        if (peer) {
          peer.connection.removeEventListener("connectionstatechange", fn);
          peer.connection.removeEventListener("iceconnectionstatechange", fn);
        }
      });
    };
  }, [remotePeers, scheduleReconnect]);

  // Mid-call join: when total peer count changes, reset connection status
  useEffect(() => {
    const peerCount = Object.keys(remotePeers).length;
    if (peerCount > 0 && status === "lost") {
      setStatus("connected");
      retryCounts.current.clear();
      retryTimers.current.forEach((t) => clearTimeout(t));
      retryTimers.current.clear();
    }
  }, [remotePeers, status]);

  // Clean up all timers on unmount
  useEffect(() => {
    return () => {
      retryTimers.current.forEach((timer) => clearTimeout(timer));
      retryTimers.current.clear();
    };
  }, []);

  const resetConnectionState = useCallback(() => {
    retryTimers.current.forEach((timer) => clearTimeout(timer));
    retryTimers.current.clear();
    retryCounts.current.clear();
    hasLostRef.current = false;
    setStatus("connected");
    setRetryCount(0);
  }, []);

  return { status, retryCount, resetConnectionState };
}
