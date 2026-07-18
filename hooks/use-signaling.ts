"use client";

import { useEffect, useRef, useCallback } from "react";
import { useMeetingStore } from "@/lib/store";
import {
  createPeerConnection,
  negotiateOffer,
} from "@/lib/webrtc";

type SignalMessage =
  | { type: "discover"; from: string }
  | { type: "offer"; from: string; to: string; payload: RTCSessionDescriptionInit }
  | { type: "answer"; from: string; to: string; payload: RTCSessionDescriptionInit }
  | { type: "ice-candidate"; from: string; to: string; payload: RTCIceCandidateInit }
  | { type: "peer-left"; from: string };

function generatePeerId(): string {
  return `peer-${Math.random().toString(36).slice(2, 10)}`;
}

export function useSignaling(meetingId: string) {
  const channelRef = useRef<BroadcastChannel | null>(null);
  const myIdRef = useRef<string>(generatePeerId());

  const localParticipant = useMeetingStore((s) => s.localParticipant);

  const createPeer = useCallback((peerId: string, isInitiator: boolean) => {
    const pc = createPeerConnection();
    const store = useMeetingStore.getState();

    const stream = store.localStream;
    if (stream) {
      stream.getTracks().forEach((track) => {
        const exists = pc.getSenders().some((s) => s.track?.id === track.id);
        if (!exists) {
          pc.addTrack(track, stream);
        }
      });
    }

    pc.onicecandidate = (ev) => {
      if (ev.candidate && channelRef.current) {
        channelRef.current.postMessage({
          type: "ice-candidate",
          from: myIdRef.current,
          to: peerId,
          payload: ev.candidate.toJSON(),
        } as SignalMessage);
      }
    };

    pc.ontrack = (ev) => {
      if (ev.streams?.[0]) {
        useMeetingStore.getState().setRemotePeerStream(peerId, ev.streams[0]);
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`[Signaling] Peer ${peerId} state:`, pc.connectionState);
      if (
        pc.connectionState === "disconnected" ||
        pc.connectionState === "failed" ||
        pc.connectionState === "closed"
      ) {
        useMeetingStore.getState().removeRemotePeer(peerId);
      }
    };

    if (isInitiator) {
      const dc = pc.createDataChannel("state-sync", { ordered: true });
      dc.onopen = () => {
        console.log("[Signaling] Data channel open for", peerId);
      };
      dc.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data);
          useMeetingStore.getState().updateRemotePeerState(peerId, data);
        } catch {
          // non-JSON payload ignored
        }
      };
      dc.onerror = (err) => {
        console.error("[Signaling] Data channel error:", err);
      };

      store.addRemotePeer({
        id: peerId,
        connection: pc,
        stream: null,
        dataChannel: dc,
        state: {
          id: peerId,
          name: "Guest",
          muted: false,
          videoOff: false,
          handRaised: false,
          reaction: null,
          screenSharing: false,
          isHost: false,
        },
      });
    } else {
      pc.ondatachannel = (ev) => {
        const dc = ev.channel;
        dc.onopen = () => {
          console.log("[Signaling] Remote data channel open for", peerId);
        };
        dc.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data);
            useMeetingStore.getState().updateRemotePeerState(peerId, data);
          } catch {
            // non-JSON payload ignored
          }
        };
        dc.onerror = (err) => {
          console.error("[Signaling] Remote data channel error:", err);
        };

        useMeetingStore.getState().updateRemotePeerState(peerId, {});
        const peer = useMeetingStore.getState().remotePeers[peerId];
        if (peer) {
          useMeetingStore.getState().addRemotePeer({
            ...peer,
            dataChannel: dc,
          });
        }
      };

      store.addRemotePeer({
        id: peerId,
        connection: pc,
        stream: null,
        dataChannel: null,
        state: {
          id: peerId,
          name: "Guest",
          muted: false,
          videoOff: false,
          handRaised: false,
          reaction: null,
          screenSharing: false,
          isHost: false,
        },
      });
    }

    return pc;
  }, []);

  useEffect(() => {
    if (!meetingId) return;

    const myId = myIdRef.current;
    const channel = new BroadcastChannel(`connectmeet-meeting-${meetingId}`);
    channelRef.current = channel;

    const handleMessage = async (ev: MessageEvent<SignalMessage>) => {
      const msg = ev.data;
      if (!msg || msg.from === myId) return;

      switch (msg.type) {
        case "discover": {
          const existing = useMeetingStore.getState().remotePeers[msg.from];
          if (existing) return;

          const pc = createPeer(msg.from, true);
          const offer = await negotiateOffer(pc);
          channel.postMessage({
            type: "offer",
            from: myId,
            to: msg.from,
            payload: offer,
          } as SignalMessage);
          break;
        }

        case "offer": {
          if (msg.to !== myId) return;
          const existing = useMeetingStore.getState().remotePeers[msg.from];
          if (existing) return;

          const pc = createPeer(msg.from, false);
          await pc.setRemoteDescription(msg.payload);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          channel.postMessage({
            type: "answer",
            from: myId,
            to: msg.from,
            payload: answer,
          } as SignalMessage);
          break;
        }

        case "answer": {
          if (msg.to !== myId) return;
          const peer = useMeetingStore.getState().remotePeers[msg.from];
          if (!peer) return;
          await peer.connection.setRemoteDescription(msg.payload);
          break;
        }

        case "ice-candidate": {
          if (msg.to !== myId) return;
          const peer = useMeetingStore.getState().remotePeers[msg.from];
          if (!peer) return;
          try {
            await peer.connection.addIceCandidate(msg.payload);
          } catch (err) {
            console.warn("[Signaling] Failed to add ICE candidate:", err);
          }
          break;
        }

        case "peer-left": {
          useMeetingStore.getState().removeRemotePeer(msg.from);
          break;
        }
      }
    };

    channel.onmessage = handleMessage;

    // Announce presence to existing peers
    channel.postMessage({
      type: "discover",
      from: myId,
    } as SignalMessage);

    return () => {
      channel.postMessage({
        type: "peer-left",
        from: myId,
      } as SignalMessage);
      channel.close();
      channelRef.current = null;

      // Clean up all peer connections
      Object.values(useMeetingStore.getState().remotePeers).forEach((peer) => {
        if (peer.connection.signalingState !== "closed") {
          peer.dataChannel?.close();
          peer.connection.close();
        }
      });
      useMeetingStore.getState().remotePeers = {};
    };
  }, [meetingId, createPeer]);

  // Broadcast local participant state changes to all peers via data channels
  useEffect(() => {
    const state = {
      name: localParticipant.name,
      muted: localParticipant.muted,
      videoOff: localParticipant.videoOff,
      handRaised: localParticipant.handRaised,
      reaction: localParticipant.reaction,
      screenSharing: localParticipant.screenSharing,
      isHost: localParticipant.isHost,
    };

    const peers = useMeetingStore.getState().remotePeers;
    Object.values(peers).forEach((peer) => {
      if (peer.dataChannel?.readyState === "open") {
        peer.dataChannel.send(JSON.stringify(state));
      }
    });
  }, [
    localParticipant.name,
    localParticipant.muted,
    localParticipant.videoOff,
    localParticipant.handRaised,
    localParticipant.reaction,
    localParticipant.screenSharing,
    localParticipant.isHost,
  ]);

  return { myId: myIdRef.current };
}
