"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";

interface ReactionBubbleProps {
  emoji?: string | null;
}

interface BubbleItem {
  id: string;
  emoji: string;
}

export function useReactionBubbles(incoming: string | null | undefined) {
  const [bubbles, setBubbles] = useState<BubbleItem[]>([]);
  const lastSeenRef = useRef<string | null>(null);
  const timersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  useEffect(() => {
    if (!incoming) {
      lastSeenRef.current = null;
      return;
    }

    if (incoming === lastSeenRef.current) return;

    lastSeenRef.current = incoming;
    const bubbleId = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setBubbles((prev) => [...prev, { id: bubbleId, emoji: incoming }]);

    const timer = setTimeout(() => {
      setBubbles((prev) => prev.filter((b) => b.id !== bubbleId));
      timersRef.current.delete(timer);
    }, 3000);

    timersRef.current.add(timer);
  }, [incoming]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
      timersRef.current.clear();
    };
  }, []);

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
