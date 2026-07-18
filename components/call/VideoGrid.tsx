"use client";

import { useMemo } from "react";
import { useMeeting } from "@videosdk.live/react-sdk";
import VideoTile from "./VideoTile";

type VideoGridProps = {
  raisedHands?: Record<string, boolean>;
  reactions?: Record<string, string | null>;
};

export default function VideoGrid({
  raisedHands = {},
  reactions = {},
}: VideoGridProps) {
  const meeting = useMeeting();
  const participants = useMemo(
    () => Array.from(meeting.participants.values()),
    [meeting.participants]
  );
  const presenterId = meeting.presenterId || meeting.activeSpeakerId || null;
  const localParticipantId = meeting.localParticipant?.id || "";

  const screenSharers = useMemo(
    () =>
      participants.filter((participant) => {
        const meta = participant.metaData as { isScreenSharing?: boolean } | undefined;
        return Boolean(meta?.isScreenSharing || participant.screenShareOn);
      }),
    [participants]
  );

  const focusedParticipantId =
    screenSharers[0]?.id || presenterId || meeting.mainParticipant?.id || null;

  const spotlightIds = new Set<string>([...screenSharers.map((p) => p.id)]);
  if (focusedParticipantId) spotlightIds.add(focusedParticipantId);

  if (screenSharers.length > 0) {
    const primary = screenSharers[0];
    const others = participants.filter((participant) => participant.id !== primary.id);

    return (
      <div className="flex h-full min-h-0 flex-col gap-3">
        <div className="min-h-0 flex-1">
          <VideoTile
            participantId={primary.id}
            mode="share"
            className="h-full min-h-[24rem]"
            classNameVideo="object-contain"
            spotlight
          />
        </div>
        {others.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {others.map((participant) => (
              <VideoTile
                key={participant.id}
                participantId={participant.id}
                raisedHand={raisedHands[participant.id]}
                reaction={reactions[participant.id] || null}
                spotlight={spotlightIds.has(participant.id)}
                className="aspect-video min-h-[10rem]"
              />
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  if (participants.length === 0) {
    return null;
  }

  if (participants.length === 1) {
    const participant = participants[0];
    return (
      <div className="flex h-full min-h-0">
        <VideoTile
          participantId={participant.id}
          raisedHand={raisedHands[participant.id]}
          reaction={reactions[participant.id] || null}
          spotlight={participant.id === localParticipantId || participant.id === focusedParticipantId}
          className="h-full min-h-[24rem] w-full"
        />
      </div>
    );
  }

  const galleryLayout = participants.length <= 4 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3";

  return (
    <div className={`grid h-full min-h-0 gap-3 ${galleryLayout}`}>
      {participants.map((participant) => (
        <VideoTile
          key={participant.id}
          participantId={participant.id}
          raisedHand={raisedHands[participant.id]}
          reaction={reactions[participant.id] || null}
          spotlight={participant.id === localParticipantId || participant.id === focusedParticipantId}
          className="aspect-video min-h-[12rem]"
        />
      ))}
    </div>
  );
}
