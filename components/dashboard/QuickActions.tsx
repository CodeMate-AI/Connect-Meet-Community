"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  addMeeting,
  generateMeetingId,
  generateMeetingLink,
} from "@/lib/meetings";

const DISPLAY_NAME_KEY = "connectmeet_display_name";

function getDisplayName(): string {
  if (typeof window === "undefined") return "Guest";
  return localStorage.getItem(DISPLAY_NAME_KEY) || "Guest";
}

export default function QuickActions() {
  const router = useRouter();
  const [newMeetingOpen, setNewMeetingOpen] = useState(false);
  const [joinMeetingOpen, setJoinMeetingOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [joinId, setJoinId] = useState("");
  const [scheduleTitle, setScheduleTitle] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [generatedId, setGeneratedId] = useState("");
  const [copied, setCopied] = useState(false);

  const handleNewMeeting = () => {
    const id = generateMeetingId();
    setGeneratedId(id);
    setNewMeetingOpen(true);
  };

  const handleStartNow = () => {
    router.push(`/meeting/${generatedId}/lobby`);
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(generateMeetingLink(generatedId));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoin = () => {
    if (joinId.trim()) {
      router.push(`/meeting/${joinId.trim()}/lobby`);
    }
  };

  const handleSchedule = () => {
    if (scheduleTitle && scheduleDate && scheduleTime) {
      const id = generateMeetingId();
      const dateObj = new Date(`${scheduleDate}T${scheduleTime}`);
      const displayName = getDisplayName();
      addMeeting({
        id,
        title: scheduleTitle,
        date: dateObj.toISOString(),
        time: scheduleTime,
        duration: "30 min",
        link: generateMeetingLink(id),
        host: displayName,
        participants: 1,
      });
      setScheduleOpen(false);
      setScheduleTitle("");
      setScheduleDate("");
      setScheduleTime("");
      window.location.reload();
    }
  };

  const actions = [
    {
      label: "New Meeting",
      description: "Start an instant meeting",
      icon: "Video",
      variant: "primary" as const,
      onClick: handleNewMeeting,
    },
    {
      label: "Join",
      description: "Join via meeting ID",
      icon: "LogIn",
      variant: "secondary" as const,
      onClick: () => setJoinMeetingOpen(true),
    },
    {
      label: "Schedule",
      description: "Plan a future meeting",
      icon: "Calendar",
      variant: "secondary" as const,
      onClick: () => setScheduleOpen(true),
    },
  ];

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={action.onClick}
            className={
              action.variant === "primary"
                ? "flex flex-col items-start gap-3 p-5 rounded-xl bg-[#0B5CFF] text-white shadow-sm hover:bg-[#0B5CFF]/90 transition-colors text-left"
                : "flex flex-col items-start gap-3 p-5 rounded-xl bg-white border border-[#E2E8F0] text-[#0F172A] shadow-sm hover:border-[#0B5CFF]/30 hover:shadow-md transition-all text-left"
            }
          >
            <div
              className={
                action.variant === "primary"
                  ? "flex items-center justify-center w-10 h-10 rounded-lg bg-white/20"
                  : "flex items-center justify-center w-10 h-10 rounded-lg bg-[#0B5CFF]/10"
              }
            >
              <Icon
                name={action.icon as "Video" | "LogIn" | "Calendar"}
                className={
                  action.variant === "primary"
                    ? "w-5 h-5 text-white"
                    : "w-5 h-5 text-[#0B5CFF]"
                }
              />
            </div>
            <div>
              <div className="font-heading text-sm font-semibold">
                {action.label}
              </div>
              <div
                className={
                  action.variant === "primary"
                    ? "text-xs text-white/80 mt-0.5"
                    : "text-xs text-[#64748B] mt-0.5"
                }
              >
                {action.description}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* New Meeting Dialog */}
      <Dialog open={newMeetingOpen} onOpenChange={setNewMeetingOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Meeting</DialogTitle>
            <DialogDescription>
              Your meeting is ready. Share the link or start now.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2 min-w-0">
            <div className="p-3 rounded-lg bg-[#F1F5F9] border border-[#E2E8F0]">
              <div className="text-xs text-[#64748B] mb-1">Meeting Link</div>
              <div className="flex items-center gap-2 min-w-0">
                <code className="flex-1 text-sm text-[#0F172A] truncate min-w-0">
                  {generateMeetingLink(generatedId)}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyLink}
                  className="shrink-0"
                >
                  <Icon name={copied ? "Check" : "Copy"} className="w-4 h-4 mr-1.5" />
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-[#F1F5F9] border border-[#E2E8F0]">
              <div className="text-xs text-[#64748B] mb-1">Meeting ID</div>
              <code className="text-sm font-mono text-[#0F172A]">{generatedId}</code>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewMeetingOpen(false)}>
              Close
            </Button>
            <Button onClick={handleStartNow} className="bg-[#0B5CFF]">
              <Icon name="Play" className="w-4 h-4 mr-1.5" />
              Start Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Join Meeting Dialog */}
      <Dialog open={joinMeetingOpen} onOpenChange={setJoinMeetingOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Join Meeting</DialogTitle>
            <DialogDescription>
              Enter the meeting ID to join.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Input
              placeholder="Meeting ID"
              value={joinId}
              onChange={(e) => setJoinId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setJoinMeetingOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleJoin} className="bg-[#0B5CFF]" disabled={!joinId.trim()}>
              <Icon name="LogIn" className="w-4 h-4 mr-1.5" />
              Join
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Meeting Dialog */}
      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule Meeting</DialogTitle>
            <DialogDescription>
              Set up a meeting for later.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <div>
              <label className="text-xs font-medium text-[#64748B] mb-1 block">Title</label>
              <Input
                placeholder="Meeting title"
                value={scheduleTitle}
                onChange={(e) => setScheduleTitle(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-[#64748B] mb-1 block">Date</label>
                <Input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[#64748B] mb-1 block">Time</label>
                <Input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSchedule}
              className="bg-[#0B5CFF]"
              disabled={!scheduleTitle || !scheduleDate || !scheduleTime}
            >
              <Icon name="Calendar" className="w-4 h-4 mr-1.5" />
              Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
