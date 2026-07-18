export const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export function createPeerConnection(config?: RTCConfiguration): RTCPeerConnection {
  return new RTCPeerConnection(config ?? ICE_SERVERS);
}

export async function negotiateOffer(
  pc: RTCPeerConnection
): Promise<RTCSessionDescriptionInit> {
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  return pc.localDescription!;
}

export async function handleOffer(
  pc: RTCPeerConnection,
  offer: RTCSessionDescriptionInit
): Promise<RTCSessionDescriptionInit> {
  await pc.setRemoteDescription(offer);
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  return pc.localDescription!;
}

export async function handleAnswer(
  pc: RTCPeerConnection,
  answer: RTCSessionDescriptionInit
): Promise<void> {
  await pc.setRemoteDescription(answer);
}

export async function addIceCandidate(
  pc: RTCPeerConnection,
  candidate: RTCIceCandidateInit
): Promise<void> {
  await pc.addIceCandidate(candidate);
}

export function setupDataChannel(
  pc: RTCPeerConnection,
  onMessage: (data: unknown) => void,
  label = "state-sync"
): RTCDataChannel {
  const dc = pc.createDataChannel(label, { ordered: true });
  dc.onopen = () => {
    console.log("[WebRTC] Data channel open:", label);
  };
  dc.onmessage = (ev) => {
    try {
      const data = JSON.parse(ev.data);
      onMessage(data);
    } catch {
      onMessage(ev.data);
    }
  };
  dc.onerror = (err) => {
    console.error("[WebRTC] Data channel error:", err);
  };
  return dc;
}

export function listenDataChannel(
  pc: RTCPeerConnection,
  onMessage: (data: unknown) => void
): void {
  pc.ondatachannel = (ev) => {
    const dc = ev.channel;
    dc.onopen = () => {
      console.log("[WebRTC] Remote data channel open");
    };
    dc.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        onMessage(data);
      } catch {
        onMessage(e.data);
      }
    };
    dc.onerror = (err) => {
      console.error("[WebRTC] Remote data channel error:", err);
    };
  };
}

export async function startScreenShare(): Promise<MediaStream> {
  return await navigator.mediaDevices.getDisplayMedia({
    video: { cursor: "always" as const } as MediaTrackConstraints,
    audio: true,
  });
}

export function replaceTrack(
  pc: RTCPeerConnection,
  newTrack: MediaStreamTrack
): void {
  const sender = pc
    .getSenders()
    .find((s) => s.track?.kind === newTrack.kind);
  if (sender) {
    sender.replaceTrack(newTrack);
  }
}

export function addTracksToConnection(
  pc: RTCPeerConnection,
  stream: MediaStream
): void {
  stream.getTracks().forEach((track) => {
    const exists = pc.getSenders().some((s) => s.track?.id === track.id);
    if (!exists) {
      pc.addTrack(track, stream);
    }
  });
}
