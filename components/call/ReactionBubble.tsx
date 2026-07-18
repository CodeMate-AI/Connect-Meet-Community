"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface ReactionBubbleProps {
  emoji?: string | null;
}

interface BubbleItem {
  id: string;
  emoji: string;
}

export function useReactionBubbles(incoming: string | null | undefined) {
  const [bubbles, setBubbles] = useState<BubbleItem[]>([]);
  const [lastSeen, setLastSeen] = useState<string | null>(null);

  useEffect(() => {
    if (!incoming || incoming === lastSeen) return;
    setLastSeen(incoming);
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setBubbles((prev) => [...prev, { id, emoji: incoming }]);
    const timer = setTimeout(() => {
      setBubbles((prev) => prev.filter((b) => b.id !== id));
    }, 3000);
    return () => clearTimeout(timer);
  }, [incoming, lastSeen]);

  return bubbles;
}

export function ReactionBubbleContainer({
  emoji,
}: ReactionBubbleProps) {
  const bubbles = useReactionBubbles(emoji);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
      <AnimatePresence>
        {bubbles.map((b) => (
          <motion.div
            key={b.id}
            initial={{ opacity: 0, y: 10, scale: 0.6 }}
            animate={{ opacity: 1, y: -80, scale: 1.1 }}
            exit={{ opacity: 0, y: -100, scale: 0.8 }}
            transition={{
              duration: 3,
              ease: [0.16, 1, 0.3, 1] as const,
            }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 text-4xl drop-shadow-lg"
          >
            {b.emoji}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
