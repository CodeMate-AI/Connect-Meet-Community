import React from "react";
import { cn } from "@/lib/utils";

interface AnonymousAvatarProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

export default function AnonymousAvatar({ className, ...props }: AnonymousAvatarProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-full w-full select-none", className)}
      {...props}
    >
      {/* Background container with rounded corners */}
      <rect width="100" height="100" rx="28" fill="#EBF3FE" />
      {/* Head circle */}
      <circle cx="50" cy="38" r="18" fill="#2B7FFF" />
      {/* Torso/Shoulder curve */}
      <path
        d="M23 86 C23 66, 35 60, 50 60 C65 60, 77 66, 77 86 Z"
        fill="#2B7FFF"
      />
    </svg>
  );
}
