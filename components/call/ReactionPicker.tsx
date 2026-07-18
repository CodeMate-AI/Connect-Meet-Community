"use client";

import { cn } from "@/lib/utils";

const EMOJI_GRID = [
  "👍", "❤️", "🎉", "😂", "👏", "🔥",
  "😮", "👋", "🥳", "💯", "🚀", "🙌",
  "😢", "🤔", "😡", "🤝", "💡", "🎊",
];

interface ReactionPickerProps {
  onSelect: (emoji: string) => void;
  className?: string;
}

export default function ReactionPicker({
  onSelect,
  className,
}: ReactionPickerProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-6 gap-1.5 p-3 rounded-2xl bg-[#1E293B] border border-white/[0.08] shadow-xl shadow-black/30",
        className
      )}
    >
      {EMOJI_GRID.map((emoji) => (
        <button
          key={emoji}
          onClick={() => onSelect(emoji)}
          className="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-white/10 hover:scale-110 active:scale-95 transition-all text-xl select-none"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}

export { EMOJI_GRID };