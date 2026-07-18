"use client";

import { useMeetingStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import Icon from "@/components/Icon";

export default function HostSettingsModal() {
  const open = useMeetingStore((s) => s.isHostSettingsOpen);
  const settings = useMeetingStore((s) => s.settings);
  const setHostSettingsOpen = useMeetingStore((s) => s.setHostSettingsOpen);
  const setSettings = useMeetingStore((s) => s.setSettings);
  const remotePeers = useMeetingStore((s) => s.remotePeers);

  const broadcastSettings = (nextSettings: Partial<typeof settings>) => {
    const merged = { ...settings, ...nextSettings };
    setSettings(nextSettings);
    Object.values(remotePeers).forEach((peer) => {
      if (peer.dataChannel?.readyState === "open") {
        peer.dataChannel.send(
          JSON.stringify({
            type: "settings-sync",
            settings: {
              screenShareAllowed: merged.isScreenShareAllowed,
              unmuteAllowed: merged.isUnmuteAllowed,
              chatAllowed: merged.isChatAllowed,
            },
          })
        );
      }
    });
  };

  const handleMuteAll = () => {
    Object.values(remotePeers).forEach((peer) => {
      if (peer.dataChannel?.readyState === "open") {
        peer.dataChannel.send(
          JSON.stringify({ type: "command", action: "mute", targetId: peer.id })
        );
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setHostSettingsOpen}>
      <DialogContent className="sm:max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg font-semibold text-[#0F172A]">
            Host Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <div>
              <p className="text-sm font-medium text-[#0F172A]">Lock Meeting</p>
              <p className="text-xs text-[#64748B]">Prevent new peers from discovering this room.</p>
            </div>
            <Switch
              checked={settings.meetingLocked}
              onCheckedChange={(checked) => broadcastSettings({ meetingLocked: checked })}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <div>
                <p className="text-sm font-medium text-[#0F172A]">Allow participants to share screen</p>
              </div>
              <Switch
                checked={settings.isScreenShareAllowed}
                onCheckedChange={(checked) => broadcastSettings({ isScreenShareAllowed: checked })}
              />
            </div>
            <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <div>
                <p className="text-sm font-medium text-[#0F172A]">Allow participants to start video</p>
              </div>
              <Switch
                checked={settings.isVideoAllowed}
                onCheckedChange={(checked) => broadcastSettings({ isVideoAllowed: checked })}
              />
            </div>
            <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <div>
                <p className="text-sm font-medium text-[#0F172A]">Allow participants to unmute</p>
              </div>
              <Switch
                checked={settings.isUnmuteAllowed}
                onCheckedChange={(checked) => broadcastSettings({ isUnmuteAllowed: checked })}
              />
            </div>
            <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <div>
                <p className="text-sm font-medium text-[#0F172A]">Allow participants to send chat messages</p>
              </div>
              <Switch
                checked={settings.isChatAllowed}
                onCheckedChange={(checked) => broadcastSettings({ isChatAllowed: checked })}
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
            <Button variant="outline" onClick={handleMuteAll} className="gap-2">
              <Icon name="MicOff" className="w-4 h-4" />
              Mute All
            </Button>
            <Button onClick={() => setHostSettingsOpen(false)} className="bg-[#0B5CFF]">
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
