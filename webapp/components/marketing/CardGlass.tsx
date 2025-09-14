import React from "react";
import { cn } from "@/lib/utils";

export default function CardGlass({
  className,
  children,
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={cn(
        // Solid "tech blue" card with white text
        "relative z-0 bg-blue-700 text-white border border-blue-500/40",
        // Jump effect on hover with depth
        "rounded-2xl shadow-lg transition-all duration-300 will-change-transform",
        "hover:-translate-y-1 hover:scale-[1.01] hover:shadow-2xl hover:z-20",
        // Subtle colored elevation
        "hover:shadow-blue-400/30 hover:ring-1 hover:ring-blue-300/40",
        className
      )}
    >
      {children}
    </div>
  );
}
