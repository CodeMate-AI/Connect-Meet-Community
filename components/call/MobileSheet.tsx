"use client";

import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import Icon from "@/components/Icon";

interface MobileSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export default function MobileSheet({
  open,
  onOpenChange,
  title,
  children,
  className,
}: MobileSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number>(0);
  const currentY = useRef<number>(0);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
    currentY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    currentY.current = e.touches[0].clientY;
    const delta = currentY.current - startY.current;
    if (sheetRef.current && delta > 0) {
      sheetRef.current.style.transform = `translateY(${delta}px)`;
    }
  };

  const handleTouchEnd = () => {
    const delta = currentY.current - startY.current;
    if (sheetRef.current) {
      sheetRef.current.style.transform = "";
    }
    if (delta > 100) {
      onOpenChange(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/50 transition-opacity duration-200 sm:hidden",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => onOpenChange(false)}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 bg-[#0F172A] rounded-t-2xl border-t border-white/[0.08] shadow-2xl shadow-black/40 transition-transform duration-300 ease-in-out flex flex-col max-h-[85vh] sm:hidden",
          open ? "translate-y-0" : "translate-y-full",
          className
        )}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag handle */}
        <div className="flex items-center justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3">
          <h2 className="font-heading text-base font-semibold text-[#E2E8F0]">
            {title}
          </h2>
          <button
            onClick={() => onOpenChange(false)}
            className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-full hover:bg-white/10 transition-colors text-[#94A3B8] hover:text-white"
          >
            <Icon name="X" className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {children}
        </div>
      </div>
    </>
  );
}
