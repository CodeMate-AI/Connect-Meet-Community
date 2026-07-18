"use client";

import { useRouter } from "next/navigation";
import { useMeetingStore } from "@/lib/store";
import Icon from "@/components/Icon";

interface ReconnectBannerProps {
  status: "connected" | "reconnecting" | "lost";
  retryCount: number;
}

export default function ReconnectBanner({
  status,
  retryCount,
}: ReconnectBannerProps) {
  const router = useRouter();
  const reset = useMeetingStore((s) => s.reset);

  if (status === "connected") return null;

  const handleReturn = () => {
    reset();
    router.push("/");
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] flex items-center justify-center pointer-events-none">
      <div
        className="mt-4 mx-4 flex items-center gap-3 px-5 py-2.5 rounded-full bg-[#0F172A]/90 backdrop-blur-xl border border-white/[0.08] shadow-2xl shadow-black/40 pointer-events-auto"
      >
        {status === "reconnecting" ? (
          <>
            <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-[#0B5CFF] animate-spin shrink-0" />
            <span className="text-sm font-medium text-[#E2E8F0]">
              Reconnecting
            </span>
            <span className="text-xs text-[#64748B]">
              Attempt {Math.min(retryCount, 5)} / 5
            </span>
          </>
        ) : (
          <>
            <Icon
              name="WifiOff"
              className="w-4 h-4 text-red-400 shrink-0"
            />
            <span className="text-sm font-medium text-[#E2E8F0]">
              Connection lost
            </span>
            <button
              onClick={handleReturn}
              className="ml-2 text-xs font-medium text-[#0B5CFF] hover:text-[#3B82F6] hover:underline transition-colors"
            >
              Return to dashboard
            </button>
          </>
        )}
      </div>
    </div>
  );
}
