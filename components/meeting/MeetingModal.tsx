"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth-context";
import { addMeeting, createVideoSDKRoom, generateMeetingLink } from "@/lib/meetings";

const DISPLAY_NAME_KEY = "connectmeet_display_name";

interface MeetingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: "join" | "new";
}

function getDisplayName(): string {
  if (typeof window === "undefined") return "Guest";
  return localStorage.getItem(DISPLAY_NAME_KEY) || "Guest";
}

export default function MeetingModal({
  open,
  onOpenChange,
  defaultTab = "join",
}: MeetingModalProps) {
  const { user } = useAuth();
  const userId = user?.id || user?.email || "guest";
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>(defaultTab);

  // Join tab state
  const [joinId, setJoinId] = useState("");
  const [joinName, setJoinName] = useState("");
  const [joinAudio, setJoinAudio] = useState(true);
  const [joinErrors, setJoinErrors] = useState<Record<string, string>>({});

  // New tab state
  const [newId, setNewId] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newScheduleDate, setNewScheduleDate] = useState("");
  const [newScheduleTime, setNewScheduleTime] = useState("");
  const [newErrors, setNewErrors] = useState<Record<string, string>>({});
  const [newCopied, setNewCopied] = useState(false);
  const [creatingNewRoom, setCreatingNewRoom] = useState(false);

  useEffect(() => {
    if (open) {
      setActiveTab(defaultTab);
      setJoinId("");
      setJoinName("");
      setJoinAudio(true);
      setJoinErrors({});
      setNewTitle("");
      setNewScheduleDate("");
      setNewScheduleTime("");
      setNewErrors({});
      setNewCopied(false);
      setNewId("");
      setCreatingNewRoom(false);
    }
  }, [open, defaultTab]);

  useEffect(() => {
    let cancelled = false;

    const prepareRoom = async () => {
      if (activeTab !== "new" || newId || creatingNewRoom) return;

      setCreatingNewRoom(true);
      try {
        const roomId = await createVideoSDKRoom();
        if (!cancelled) {
          setNewId(roomId);
        }
      } catch (error) {
        console.error("Failed to create VideoSDK room:", error);
      } finally {
        if (!cancelled) {
          setCreatingNewRoom(false);
        }
      }
    };

    void prepareRoom();

    return () => {
      cancelled = true;
    };
  }, [activeTab, newId, creatingNewRoom]);

  const validateJoin = useCallback(() => {
    const errors: Record<string, string> = {};
    const id = joinId.trim();
    if (!id) {
      errors.id = "Meeting ID is required.";
    } else if (!/^cm-[a-z0-9]{8}$/.test(id)) {
      errors.id = "Enter a valid meeting ID (e.g. cm-abc12345).";
    }
    if (!joinName.trim()) {
      errors.name = "Display name is required.";
    }
    setJoinErrors(errors);
    return Object.keys(errors).length === 0;
  }, [joinId, joinName]);

  const validateNew = useCallback(() => {
    const errors: Record<string, string> = {};
    if (!newTitle.trim()) {
      errors.title = "Meeting title is required.";
    }
    if (newScheduleDate || newScheduleTime) {
      if (!newScheduleDate) {
        errors.schedule = "Please select both date and time.";
      } else if (!newScheduleTime) {
        errors.schedule = "Please select both date and time.";
      }
    }
    if (!newId) {
      errors.id = "Meeting room is still being created.";
    }
    setNewErrors(errors);
    return Object.keys(errors).length === 0;
  }, [newTitle, newScheduleDate, newScheduleTime, newId]);

  const handleJoin = () => {
    if (!validateJoin()) return;

    // Persist joined meeting to localStorage (lightweight record)
    const link = generateMeetingLink(joinId.trim());
    addMeeting(
      {
        id: joinId.trim(),
        title: joinName.trim() || "Joined Meeting",
        date: new Date().toISOString(),
        time: new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        duration: "30 min",
        link,
        host: joinName.trim() || getDisplayName(),
        participants: 1,
        userId,
      },
      userId
    );

    if (typeof window !== "undefined") {
      localStorage.setItem(DISPLAY_NAME_KEY, joinName.trim());
    }

    onOpenChange(false);
    router.push(`/meeting/${joinId.trim()}/lobby`);
  };

  const handleCreate = () => {
    if (!validateNew()) return;

    const hasSchedule = newScheduleDate && newScheduleTime;
    const dateObj = hasSchedule
      ? new Date(`${newScheduleDate}T${newScheduleTime}`)
      : new Date();
    const displayName = getDisplayName();

    addMeeting(
      {
        id: newId,
        title: newTitle.trim(),
        date: dateObj.toISOString(),
        time: hasSchedule
          ? newScheduleTime
          : new Date().toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            }),
        duration: "30 min",
        link: generateMeetingLink(newId),
        host: displayName,
        participants: 1,
        userId,
      },
      userId
    );

    onOpenChange(false);
    if (hasSchedule) {
      window.location.reload();
    } else {
      router.push(`/meeting/${newId}/lobby`);
    }
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(generateMeetingLink(newId));
    setNewCopied(true);
    setTimeout(() => setNewCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-2xl p-0 overflow-hidden gap-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="font-heading text-lg font-semibold text-[#0F172A]">
            Meeting
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList variant="line" className="w-full px-6 border-b border-[#E2E8F0] rounded-none bg-transparent">
            <TabsTrigger
              value="join"
              className="flex-1 rounded-none data-active:after:bg-[#0B5CFF] data-active:after:opacity-100 data-active:text-[#0B5CFF] text-[#64748B] pb-3"
            >
              <Icon name="LogIn" className="w-4 h-4 mr-1.5" />
              Join Meeting
            </TabsTrigger>
            <TabsTrigger
              value="new"
              className="flex-1 rounded-none data-active:after:bg-[#0B5CFF] data-active:after:opacity-100 data-active:text-[#0B5CFF] text-[#64748B] pb-3"
            >
              <Icon name="Video" className="w-4 h-4 mr-1.5" />
              New Meeting
            </TabsTrigger>
          </TabsList>

          {/* Join Tab */}
          <TabsContent value="join" className="px-6 py-5 space-y-4 min-w-0">
            <div>
              <label className="block text-xs font-medium text-[#64748B] mb-1.5">
                Meeting ID
              </label>
              <Input
                placeholder="e.g. cm-abc12345"
                value={joinId}
                onChange={(e) => {
                  setJoinId(e.target.value);
                  if (joinErrors.id) {
                    setJoinErrors((prev) => ({ ...prev, id: "" }));
                  }
                }}
                className={joinErrors.id ? "border-destructive focus-visible:ring-destructive/20" : ""}
              />
              {joinErrors.id && (
                <p className="mt-1 text-xs text-destructive">{joinErrors.id}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-[#64748B] mb-1.5">
                Display Name
              </label>
              <Input
                placeholder="Your name"
                value={joinName}
                onChange={(e) => {
                  setJoinName(e.target.value);
                  if (joinErrors.name) {
                    setJoinErrors((prev) => ({ ...prev, name: "" }));
                  }
                }}
                className={joinErrors.name ? "border-destructive focus-visible:ring-destructive/20" : ""}
              />
              {joinErrors.name && (
                <p className="mt-1 text-xs text-destructive">{joinErrors.name}</p>
              )}
            </div>

            <div className="flex items-center justify-between py-2">
              <label htmlFor="join-audio" className="text-sm text-[#0F172A]">
                Join with computer audio
              </label>
              <Switch
                id="join-audio"
                checked={joinAudio}
                onCheckedChange={setJoinAudio}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleJoin}
                className="bg-[#0B5CFF] hover:bg-[#0B5CFF]/90 text-white"
              >
                <Icon name="LogIn" className="w-4 h-4 mr-1.5" />
                Join
              </Button>
            </div>
          </TabsContent>

          {/* New Tab */}
          <TabsContent value="new" className="px-6 py-5 space-y-4 min-w-0">
            <div>
              <label className="block text-xs font-medium text-[#64748B] mb-1.5">
                Meeting Title
              </label>
              <Input
                placeholder="e.g. Weekly Team Standup"
                value={newTitle}
                onChange={(e) => {
                  setNewTitle(e.target.value);
                  if (newErrors.title) {
                    setNewErrors((prev) => ({ ...prev, title: "" }));
                  }
                }}
                className={newErrors.title ? "border-destructive focus-visible:ring-destructive/20" : ""}
              />
              {newErrors.title && (
                <p className="mt-1 text-xs text-destructive">{newErrors.title}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#64748B] mb-1.5">
                  Schedule Date
                </label>
                <Input
                  type="date"
                  value={newScheduleDate}
                  onChange={(e) => {
                    setNewScheduleDate(e.target.value);
                    if (newErrors.schedule) {
                      setNewErrors((prev) => ({ ...prev, schedule: "" }));
                    }
                  }}
                  className={newErrors.schedule ? "border-destructive focus-visible:ring-destructive/20" : ""}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#64748B] mb-1.5">
                  Schedule Time
                </label>
                <Input
                  type="time"
                  value={newScheduleTime}
                  onChange={(e) => {
                    setNewScheduleTime(e.target.value);
                    if (newErrors.schedule) {
                      setNewErrors((prev) => ({ ...prev, schedule: "" }));
                    }
                  }}
                  className={newErrors.schedule ? "border-destructive focus-visible:ring-destructive/20" : ""}
                />
              </div>
            </div>
            {newErrors.schedule && (
              <p className="text-xs text-destructive -mt-2">{newErrors.schedule}</p>
            )}

            <div className="p-3 rounded-lg bg-[#F1F5F9] border border-[#E2E8F0]">
              <div className="text-xs text-[#64748B] mb-1">Meeting ID</div>
              <code className="text-sm font-mono text-[#0F172A]">
                {newId || (creatingNewRoom ? "Creating room..." : "Pending...")}
              </code>
              <div className="text-xs text-[#64748B] mt-2 mb-1">Shareable Link</div>
              <div className="flex items-center gap-2 min-w-0">
                <code className="flex-1 text-sm text-[#0F172A] truncate min-w-0">
                  {newId ? generateMeetingLink(newId) : "Creating meeting link..."}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyLink}
                  className="shrink-0"
                  disabled={!newId}
                >
                  <Icon
                    name={newCopied ? "Check" : "Copy"}
                    className="w-4 h-4 mr-1.5"
                  />
                  {newCopied ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                className="bg-[#0B5CFF] hover:bg-[#0B5CFF]/90 text-white"
                disabled={creatingNewRoom || !newId}
              >
                <Icon name="Video" className="w-4 h-4 mr-1.5" />
                Create Meeting
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
