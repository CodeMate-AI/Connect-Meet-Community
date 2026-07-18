"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import Icon from "@/components/Icon";

interface LobbyPreviewProps {
  userName: string;
}

export default function LobbyPreview({ userName }: LobbyPreviewProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [loading, setLoading] = useState(true);

  const startMedia = useCallback(async () => {
    setLoading(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setCameraOn(true);
      setMicOn(true);
      setPermissionDenied(false);
    } catch (err) {
      console.error("Media permission denied:", err);
      setPermissionDenied(true);
      setCameraOn(false);
      setMicOn(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    startMedia();

    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [startMedia]);

  const toggleCamera = useCallback(() => {
    if (!streamRef.current) {
      if (permissionDenied) {
        startMedia();
      }
      return;
    }

    const videoTracks = streamRef.current.getVideoTracks();
    if (videoTracks.length === 0) {
      setCameraOn(false);
      return;
    }

    const next = !cameraOn;
    videoTracks.forEach((track) => {
      track.enabled = next;
    });
    setCameraOn(next);
  }, [cameraOn, permissionDenied, startMedia]);

  const toggleMic = useCallback(() => {
    if (!streamRef.current) {
      if (permissionDenied) {
        startMedia();
      }
      return;
    }

    const audioTracks = streamRef.current.getAudioTracks();
    if (audioTracks.length === 0) {
      setMicOn(false);
      return;
    }

    const next = !micOn;
    audioTracks.forEach((track) => {
      track.enabled = next;
    });
    setMicOn(next);
  }, [micOn, permissionDenied, startMedia]);

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      {/* Preview Tile */}
      <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-[#111827] border border-white/[0.08]">
        {loading && !permissionDenied && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
          </div>
        )}

        {!permissionDenied && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`absolute inset-0 w-full h-full object-cover ${cameraOn ? "opacity-100" : "opacity-0"}`}
          />
        )}

        {(!cameraOn || permissionDenied) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <Avatar size="lg" className="w-20 h-20">
              <AvatarImage src={`https://i.pravatar.cc/150?u=${encodeURIComponent(userName)}`} alt={userName} />
              <AvatarFallback className="text-2xl bg-[#1E293B] text-[#E2E8F0]">
                {userName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            {permissionDenied && (
              <div className="text-center px-4">
                <p className="text-sm text-[#94A3B8]">
                  Camera and microphone access denied.
                </p>
                <button
                  onClick={startMedia}
                  className="mt-2 text-xs text-[#3B82F6] hover:underline"
                >
                  Retry permission
                </button>
              </div>
            )}
            {!permissionDenied && !cameraOn && (
              <p className="text-sm text-[#94A3B8]">Camera is off</p>
            )}
          </div>
        )}

        {/* Glassmorphic Controls Overlay */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-2.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
          <button
            onClick={toggleMic}
            className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${
              micOn
                ? "bg-white/10 text-white hover:bg-white/20"
                : "bg-red-500/80 text-white hover:bg-red-500"
            }`}
            title={micOn ? "Mute microphone" : "Unmute microphone"}
          >
            <Icon name={micOn ? "Mic" : "MicOff"} className="w-5 h-5" />
          </button>

          <button
            onClick={toggleCamera}
            className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${
              cameraOn
                ? "bg-white/10 text-white hover:bg-white/20"
                : "bg-red-500/80 text-white hover:bg-red-500"
            }`}
            title={cameraOn ? "Turn off camera" : "Turn on camera"}
          >
            <Icon name={cameraOn ? "Video" : "VideoOff"} className="w-5 h-5" />
          </button>
        </div>

        {/* Name Label */}
        <div className="absolute top-4 left-4 px-3 py-1.5 rounded-lg bg-black/40 backdrop-blur-md border border-white/10">
          <span className="text-xs font-medium text-white/90">{userName || "Guest"}</span>
        </div>
      </div>
    </div>
  );
}
