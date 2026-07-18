import { create } from "zustand";

export interface PeerState {
  id: string;
  name: string;
  muted: boolean;
  videoOff: boolean;
  handRaised: boolean;
  reaction: string | null;
  screenSharing: boolean;
  isHost: boolean;
}

export interface RemotePeer {
  id: string;
  connection: RTCPeerConnection;
  stream: MediaStream | null;
  dataChannel: RTCDataChannel | null;
  state: PeerState;
}

export interface LocalParticipant extends PeerState {
  pinnedId: string | null;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
}

export interface MeetingSettings {
  isScreenShareAllowed: boolean;
  isVideoAllowed: boolean;
  isUnmuteAllowed: boolean;
  isChatAllowed: boolean;
  meetingLocked: boolean;
}

interface MeetingStore {
  localStream: MediaStream | null;
  screenStream: MediaStream | null;
  remotePeers: Record<string, RemotePeer>;
  localParticipant: LocalParticipant;
  chatMessages: ChatMessage[];
  isChatOpen: boolean;
  isParticipantsOpen: boolean;
  isHostSettingsOpen: boolean;
  settings: MeetingSettings;

  setLocalStream: (stream: MediaStream | null) => void;
  setScreenStream: (stream: MediaStream | null) => void;
  setLocalParticipant: (participant: Partial<LocalParticipant>) => void;
  setChatOpen: (open: boolean) => void;
  setParticipantsOpen: (open: boolean) => void;
  setHostSettingsOpen: (open: boolean) => void;
  setSettings: (settings: Partial<MeetingSettings>) => void;
  addChatMessage: (message: ChatMessage) => void;

  addRemotePeer: (peer: RemotePeer) => void;
  removeRemotePeer: (id: string) => void;
  updateRemotePeerState: (id: string, state: Partial<PeerState>) => void;
  setRemotePeerStream: (id: string, stream: MediaStream | null) => void;

  reset: () => void;
}

const DEFAULT_PARTICIPANT: LocalParticipant = {
  id: "",
  name: "",
  muted: false,
  videoOff: false,
  handRaised: false,
  reaction: null,
  screenSharing: false,
  isHost: false,
  pinnedId: null,
};

const DEFAULT_SETTINGS: MeetingSettings = {
  isScreenShareAllowed: true,
  isVideoAllowed: true,
  isUnmuteAllowed: true,
  isChatAllowed: true,
  meetingLocked: false,
};

export const useMeetingStore = create<MeetingStore>((set, get) => ({
  localStream: null,
  screenStream: null,
  remotePeers: {},
  localParticipant: { ...DEFAULT_PARTICIPANT },
  chatMessages: [],
  isChatOpen: false,
  isParticipantsOpen: false,
  isHostSettingsOpen: false,
  settings: { ...DEFAULT_SETTINGS },

  setLocalStream: (stream) => set({ localStream: stream }),

  setScreenStream: (stream) => set({ screenStream: stream }),

  setLocalParticipant: (participant) =>
    set((state) => ({
      localParticipant: { ...state.localParticipant, ...participant },
    })),

  setChatOpen: (open) => set({ isChatOpen: open }),

  setParticipantsOpen: (open) => set({ isParticipantsOpen: open }),

  setHostSettingsOpen: (open) => set({ isHostSettingsOpen: open }),

  setSettings: (settings) =>
    set((state) => ({
      settings: { ...state.settings, ...settings },
    })),

  addChatMessage: (message) =>
    set((state) => ({
      chatMessages: [...state.chatMessages, message],
    })),

  addRemotePeer: (peer) =>
    set((state) => ({
      remotePeers: { ...state.remotePeers, [peer.id]: peer },
    })),

  removeRemotePeer: (id) =>
    set((state) => {
      const peers = { ...state.remotePeers };
      const peer = peers[id];
      if (!peer) return state;
      if (peer.connection.signalingState !== "closed") {
        peer.dataChannel?.close();
        peer.connection.close();
      }
      delete peers[id];
      return { remotePeers: peers };
    }),

  updateRemotePeerState: (id, partialState) =>
    set((state) => {
      const peer = state.remotePeers[id];
      if (!peer) return state;
      return {
        remotePeers: {
          ...state.remotePeers,
          [id]: {
            ...peer,
            state: { ...peer.state, ...partialState },
          },
        },
      };
    }),

  setRemotePeerStream: (id, stream) =>
    set((state) => {
      const peer = state.remotePeers[id];
      if (!peer) return state;
      return {
        remotePeers: {
          ...state.remotePeers,
          [id]: { ...peer, stream },
        },
      };
    }),

  reset: () => {
    const { remotePeers, localStream, screenStream } = get();
    Object.values(remotePeers).forEach((peer) => {
      if (peer.connection.signalingState !== "closed") {
        peer.dataChannel?.close();
        peer.connection.close();
      }
    });
    localStream?.getTracks().forEach((t) => t.stop());
    screenStream?.getTracks().forEach((t) => t.stop());
    set({
      localStream: null,
      screenStream: null,
      remotePeers: {},
      localParticipant: { ...DEFAULT_PARTICIPANT },
      chatMessages: [],
      isChatOpen: false,
      isParticipantsOpen: false,
      isHostSettingsOpen: false,
      settings: { ...DEFAULT_SETTINGS },
    });
  },
}));
