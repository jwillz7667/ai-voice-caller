"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
};

export default function ButtonNeo({ className, children, ...props }: Props) {
  return (
    <motion.button
      whileHover={{ y: -1, boxShadow: "6px 6px 12px rgba(0,0,0,0.15), -6px -6px 12px rgba(255,255,255,0.4)" }}
      whileTap={{ y: 1, boxShadow: "inset 4px 4px 8px rgba(0,0,0,0.2), inset -4px -4px 8px rgba(255,255,255,0.5)" }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={cn(
        "rounded-xl px-6 py-3 text-sm font-semibold bg-gradient-to-br from-slate-50 to-slate-200 text-slate-800",
        "shadow-[6px_6px_12px_rgba(0,0,0,0.1),_-6px_-6px_12px_rgba(255,255,255,0.6)]",
        "hover:from-white hover:to-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
        className
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}

