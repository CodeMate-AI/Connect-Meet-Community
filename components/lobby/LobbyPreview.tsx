"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import AnonymousAvatar from "@/components/ui/AnonymousAvatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Icon from "@/components/Icon";

interface LobbyPreviewProps {
  userName: string;
}

type MediaDeviceOption = {
  deviceId: string;
  label: string;
};

const MIC_ENABLED_KEY = "connectmeet_mic_enabled";
const WEBCAM_ENABLED_KEY = "connectmeet_webcam_enabled";
const MIC_DEVICE_KEY = "connectmeet_selected_mic_device_id";
const WEBCAM_DEVICE_KEY = "connectmeet_selected_webcam_device_id";

function getStoredBoolean(key: string, fallback: boolean) {
  if (typeof window === "undefined") return fallback;
  const stored = window.localStorage.getItem(key);
  if (stored === null) return fallback;
  return stored !== "false";
}

function getStoredString(key: string) {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(key) || "";
}

function normalizeDevices(devices: MediaDeviceInfo[], fallbackLabel: string): MediaDeviceOption[] {
  const seen = new Set<string>();
  const next = devices
    .filter((device) => device.deviceId)
    .map((device) => ({
      deviceId: device.deviceId,
      label: device.label || fallbackLabel,
    }))
    .filter((device) => {
      if (seen.has(device.deviceId)) return false;
      seen.add(device.deviceId);
      return true;
    });

  return next;
}

export default function LobbyPreview({ userName }: LobbyPreviewProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const requestIdRef = useRef(0);

  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceOption[]>([]);
  const [availableMics, setAvailableMics] = useState<MediaDeviceOption[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState("");
  const [selectedMicId, setSelectedMicId] = useState("");

  const persistSettings = useCallback((next: {
    camera?: boolean;
    mic?: boolean;
    cameraId?: string;
    micId?: string;
  }) => {
    if (typeof window === "undefined") return;

    if (typeof next.camera === "boolean") {
      window.localStorage.setItem(WEBCAM_ENABLED_KEY, String(next.camera));
    }
    if (typeof next.mic === "boolean") {
      window.localStorage.setItem(MIC_ENABLED_KEY, String(next.mic));
    }
    if (typeof next.cameraId === "string") {
      window.localStorage.setItem(WEBCAM_DEVICE_KEY, next.cameraId);
    }
    if (typeof next.micId === "string") {
      window.localStorage.setItem(MIC_DEVICE_KEY, next.micId);
    }
  }, []);

  const refreshDevices = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.enumerateDevices) {
      return;
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      setAvailableCameras(normalizeDevices(devices.filter((device) => device.kind === "videoinput"), "Camera"));
      setAvailableMics(normalizeDevices(devices.filter((device) => device.kind === "audioinput"), "Microphone"));
    } catch (error) {
      console.warn("Unable to enumerate media devices in lobby preview:", error);
    }
  }, []);

  const stopPreviewStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startMedia = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setPermissionDenied(true);
      setLoading(false);
      return;
    }

    const currentRequestId = ++requestIdRef.current;
    setLoading(true);
    stopPreviewStream();

    const nextStream = new MediaStream();
    let hasMedia = false;
    let nextCameraOn = getStoredBoolean(WEBCAM_ENABLED_KEY, true);
    let nextMicOn = getStoredBoolean(MIC_ENABLED_KEY, true);

    if (nextCameraOn) {
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({
          video: selectedCameraId ? { deviceId: { exact: selectedCameraId } } : true,
          audio: false,
        });
        videoStream.getVideoTracks().forEach((track) => nextStream.addTrack(track));
        hasMedia = true;
      } catch (error) {
        console.warn("Unable to start camera preview, falling back to camera off:", error);
        nextCameraOn = false;
        persistSettings({ camera: false });
      }
    }

    if (nextMicOn) {
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: selectedMicId ? { deviceId: { exact: selectedMicId } } : true,
          video: false,
        });
        audioStream.getAudioTracks().forEach((track) => nextStream.addTrack(track));
        hasMedia = true;
      } catch (error) {
        console.warn("Unable to start microphone preview, falling back to mic off:", error);
        nextMicOn = false;
        persistSettings({ mic: false });
      }
    }

    if (requestIdRef.current !== currentRequestId) {
      nextStream.getTracks().forEach((track) => track.stop());
      return;
    }

    if (!hasMedia) {
      setPermissionDenied(true);
      setCameraOn(nextCameraOn);
      setMicOn(nextMicOn);
      setLoading(false);
      await refreshDevices();
      return;
    }

    streamRef.current = nextStream;
    if (videoRef.current) {
      videoRef.current.srcObject = nextStream;
      await videoRef.current.play().catch(() => undefined);
    }

    setCameraOn(nextCameraOn);
    setMicOn(nextMicOn);
    setPermissionDenied(false);
    setLoading(false);
    await refreshDevices();
  }, [persistSettings, refreshDevices, selectedCameraId, selectedMicId, stopPreviewStream]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setCameraOn(getStoredBoolean(WEBCAM_ENABLED_KEY, true));
    setMicOn(getStoredBoolean(MIC_ENABLED_KEY, true));
    setSelectedCameraId(getStoredString(WEBCAM_DEVICE_KEY));
    setSelectedMicId(getStoredString(MIC_DEVICE_KEY));
  }, []);

  useEffect(() => {
    void startMedia();

    const handleDeviceChange = () => {
      void refreshDevices();
    };

    navigator.mediaDevices?.addEventListener?.("devicechange", handleDeviceChange);

    return () => {
      navigator.mediaDevices?.removeEventListener?.("devicechange", handleDeviceChange);
      stopPreviewStream();
    };
  }, [refreshDevices, startMedia, stopPreviewStream]);

  const toggleCamera = useCallback(() => {
    const next = !cameraOn;
    setCameraOn(next);
    persistSettings({ camera: next });
    void startMedia();
  }, [cameraOn, persistSettings, startMedia]);

  const toggleMic = useCallback(() => {
    const next = !micOn;
    setMicOn(next);
    persistSettings({ mic: next });
    void startMedia();
  }, [micOn, persistSettings, startMedia]);

  const cameraOptions = useMemo(
    () => [
      { deviceId: "", label: availableCameras.length ? "System camera" : "Camera unavailable" },
      ...availableCameras,
    ],
    [availableCameras]
  );

  const micOptions = useMemo(
    () => [
      { deviceId: "", label: availableMics.length ? "System microphone" : "Microphone unavailable" },
      ...availableMics,
    ],
    [availableMics]
  );

  return (
    <div className="relative mx-auto w-full max-w-2xl">
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111827]">
        {loading && !permissionDenied && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
          </div>
        )}

        {!permissionDenied && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`absolute inset-0 h-full w-full object-cover ${cameraOn ? "opacity-100" : "opacity-0"}`}
          />
        )}

        {(!cameraOn || permissionDenied) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-4 text-center">
            <div className="h-20 w-20 rounded-2xl overflow-hidden shadow-lg border border-white/10 shrink-0">
              <AnonymousAvatar />
            </div>
            {permissionDenied && (
              <div>
                <p className="text-sm text-[#94A3B8]">
                  Camera or microphone access is unavailable.
                </p>
                <button
                  onClick={() => void startMedia()}
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

        <div className="absolute left-4 top-4 rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 backdrop-blur-md">
          <span className="text-xs font-medium text-white/90">{userName || "Guest"}</span>
        </div>
      </div>

      <div className="mt-4 flex w-full flex-col gap-3 rounded-2xl border border-white/10 bg-black/45 px-4 py-3 backdrop-blur-md sm:absolute sm:bottom-4 sm:left-1/2 sm:mt-0 sm:w-auto sm:-translate-x-1/2 sm:flex-row sm:items-center">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMic}
              className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                micOn ? "bg-white/10 text-white hover:bg-white/20" : "bg-red-500/80 text-white hover:bg-red-500"
              }`}
              title={micOn ? "Mute microphone" : "Unmute microphone"}
            >
              <Icon name={micOn ? "Mic" : "MicOff"} className="h-5 w-5" />
            </button>
            <Select
              value={selectedMicId}
              onValueChange={(value) => {
                setSelectedMicId(value);
                persistSettings({ micId: value });
                void startMedia();
              }}
            >
              <SelectTrigger className="h-10 min-w-0 max-w-[12rem] border-white/10 bg-white/5 text-xs text-white hover:bg-white/10 sm:max-w-[14rem]">
                <SelectValue placeholder="Select microphone" />
              </SelectTrigger>
              <SelectContent>
                {micOptions.map((device) => (
                  <SelectItem key={device.deviceId || "default-mic"} value={device.deviceId}>
                    {device.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <span className="text-center text-[10px] text-[#94A3B8] sm:text-left">
            Microphone
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleCamera}
              className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                cameraOn ? "bg-white/10 text-white hover:bg-white/20" : "bg-red-500/80 text-white hover:bg-red-500"
              }`}
              title={cameraOn ? "Turn off camera" : "Turn on camera"}
            >
              <Icon name={cameraOn ? "Video" : "VideoOff"} className="h-5 w-5" />
            </button>
            <Select
              value={selectedCameraId}
              onValueChange={(value) => {
                setSelectedCameraId(value);
                persistSettings({ cameraId: value });
                void startMedia();
              }}
            >
              <SelectTrigger className="h-10 min-w-0 max-w-[12rem] border-white/10 bg-white/5 text-xs text-white hover:bg-white/10 sm:max-w-[14rem]">
                <SelectValue placeholder="Select camera" />
              </SelectTrigger>
              <SelectContent>
                {cameraOptions.map((device) => (
                  <SelectItem key={device.deviceId || "default-camera"} value={device.deviceId}>
                    {device.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <span className="text-center text-[10px] text-[#94A3B8] sm:text-left">
            Camera
          </span>
        </div>
      </div>
    </div>
  );
}
