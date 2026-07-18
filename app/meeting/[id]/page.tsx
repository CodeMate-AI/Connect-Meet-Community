"use client";

import dynamic from "next/dynamic";

const MeetingRoomPageClient = dynamic(
  () => import("./MeetingRoomPageClient"),
  { ssr: false }
);

export default function Page() {
  return <MeetingRoomPageClient />;
}
