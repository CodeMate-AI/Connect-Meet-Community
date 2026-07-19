"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import { Button } from "@/components/ui/button";
import { Meeting, getMeetings, formatMeetingDate, removeMeeting } from "@/lib/meetings";

export default function MeetingList() {
  const router = useRouter();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [today, setToday] = useState<Date | null>(null);

  useEffect(() => {
    setMeetings(getMeetings());
    setToday(new Date());
  }, []);

  const handleCopyLink = async (link: string, id: string) => {
    await navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleStart = (id: string) => {
    router.push(`/meeting/${id}/lobby`);
  };

  const handleDelete = (id: string) => {
    removeMeeting(id);
    setMeetings(getMeetings());
  };

  const todayStart = today ? new Date(today.getFullYear(), today.getMonth(), today.getDate()) : null;

  const sortedMeetings = [...meetings].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 md:px-5 md:py-4 border-b border-[#E2E8F0]">
        <h2 className="font-heading text-base font-semibold text-[#0F172A]">
          Upcoming Meetings
        </h2>
        <Button variant="ghost" size="sm" className="text-[#0B5CFF] text-xs font-medium">
          View all
          <Icon name="ChevronRight" className="w-4 h-4 ml-1" />
        </Button>
      </div>

      <div className="divide-y divide-[#E2E8F0]">
        {sortedMeetings.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <div className="w-12 h-12 rounded-full bg-[#F1F5F9] flex items-center justify-center mb-3">
              <Icon name="Calendar" className="w-6 h-6 text-[#94A3B8]" />
            </div>
            <p className="text-sm text-[#64748B]">No upcoming meetings</p>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              Schedule or start a new meeting.
            </p>
          </div>
        )}

        {sortedMeetings.map((meeting) => {
          const { day, month } = formatMeetingDate(meeting.date);
          const meetingDate = new Date(meeting.date);
          const meetingStart = new Date(meetingDate.getFullYear(), meetingDate.getMonth(), meetingDate.getDate());
          const isToday = todayStart ? meetingStart.getTime() === todayStart.getTime() : false;
          const isPast = todayStart ? meetingStart.getTime() < todayStart.getTime() : false;

          return (
            <div
              key={meeting.id}
              className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-4 py-4 md:px-5 hover:bg-[#F9FAFB] transition-colors"
            >
              <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0 flex-1">
                {/* Date Badge */}
                <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-[#F1F5F9] border border-[#E2E8F0] shrink-0">
                  <span className="text-[10px] font-bold text-[#64748B] leading-none uppercase tracking-wider">
                    {month}
                  </span>
                  <span className="text-lg font-heading font-bold text-[#0F172A] leading-none mt-0.5">
                    {day}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start sm:items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-medium text-[#0F172A] truncate">
                      {meeting.title}
                    </h3>
                    {isToday && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#0B5CFF]/10 text-[#0B5CFF]">
                        Today
                      </span>
                    )}
                    {isPast && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#F1F5F9] text-[#94A3B8]">
                        Past
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="text-xs text-[#64748B] flex items-center gap-1">
                      <Icon name="Clock" className="w-3 h-3" />
                      {meeting.time}
                    </span>
                    <span className="text-xs text-[#64748B] flex items-center gap-1">
                      <Icon name="Timer" className="w-3 h-3" />
                      {meeting.duration}
                    </span>
                    <span className="text-xs text-[#64748B] flex items-center gap-1">
                      <Icon name="Users" className="w-3 h-3" />
                      {meeting.participants}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 shrink-0 self-end sm:self-auto w-full sm:w-auto border-t border-[#E2E8F0]/30 pt-2 sm:pt-0 sm:border-0">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-[#64748B] hover:text-[#0B5CFF]"
                  onClick={() => handleCopyLink(meeting.link, meeting.id)}
                  title="Copy link"
                >
                  <Icon
                    name={copiedId === meeting.id ? "Check" : "Copy"}
                    className="w-4 h-4"
                  />
                </Button>
                <Button
                  variant={isPast ? "ghost" : "default"}
                  size="sm"
                  className={
                    isPast
                      ? "text-[#64748B]"
                      : "bg-[#0B5CFF] hover:bg-[#0B5CFF]/90 text-white"
                  }
                  onClick={() => handleStart(meeting.id)}
                >
                  <Icon name={isPast ? "Eye" : "Play"} className="w-4 h-4 mr-1" />
                  {isPast ? "View" : "Start"}
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-[#94A3B8] hover:text-destructive"
                  onClick={() => handleDelete(meeting.id)}
                  title="Delete"
                >
                  <Icon name="Trash2" className="w-4 h-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
