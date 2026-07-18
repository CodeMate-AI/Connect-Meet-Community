"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import LobbyPreview from "@/components/lobby/LobbyPreview";
import Icon from "@/components/Icon";

const DISPLAY_NAME_KEY = "connectmeet_display_name";

export default function LobbyPage() {
  const params = useParams();
  const router = useRouter();
  const meetingId = (params.id as string) || "";

  const [displayName, setDisplayName] = useState("");
  const [nameError, setNameError] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(DISPLAY_NAME_KEY);
      if (saved) {
        setDisplayName(saved);
      }
    }
  }, []);

  const handleJoin = useCallback(() => {
    const name = displayName.trim();
    if (!name) {
      setNameError("Please enter your display name.");
      return;
    }
    setNameError("");
    if (typeof window !== "undefined") {
      localStorage.setItem(DISPLAY_NAME_KEY, name);
    }
    router.push(`/meeting/${meetingId}`);
  }, [displayName, meetingId, router]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        handleJoin();
      }
    },
    [handleJoin]
  );

  return (
    <div className="dark min-h-screen bg-[#0B1120] flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="font-heading text-2xl font-bold text-[#E2E8F0]">
            Ready to join?
          </h1>
          <p className="text-sm text-[#94A3B8]">
            Meeting ID: <span className="font-mono text-[#E2E8F0]">{meetingId}</span>
          </p>
        </div>

        {/* Camera Preview */}
        <LobbyPreview userName={displayName || "Guest"} />

        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 max-w-xl mx-auto">
          <div className="flex-1">
            <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">
              Display Name
            </label>
            <Input
              placeholder="Enter your name"
              value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value);
                if (nameError) setNameError("");
              }}
              onKeyDown={handleKeyDown}
              className={
                nameError
                  ? "border-destructive focus-visible:ring-destructive/20 bg-[#1E293B] border-white/10 text-[#E2E8F0] placeholder:text-[#64748B]"
                  : "bg-[#1E293B] border-white/10 text-[#E2E8F0] placeholder:text-[#64748B]"
              }
            />
            {nameError && (
              <p className="mt-1 text-xs text-destructive">{nameError}</p>
            )}
          </div>

          <Button
            onClick={handleJoin}
            className="bg-[#0B5CFF] hover:bg-[#0B5CFF]/90 text-white h-8 px-5"
          >
            <Icon name="LogIn" className="w-4 h-4 mr-1.5" />
            Join Meeting
          </Button>
        </div>

        {/* Footer hint */}
        <p className="text-center text-xs text-[#64748B]">
          You can toggle your camera and microphone before joining.
        </p>
      </div>
    </div>
  );
}
