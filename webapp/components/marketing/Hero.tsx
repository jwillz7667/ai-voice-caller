"use client";

import { motion } from "framer-motion";
import ButtonNeo from "./ButtonNeo";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative z-0 overflow-visible bg-blue-700 text-white">
      <div className="container mx-auto px-4 pt-20 pb-16 md:pt-28 md:pb-24">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl md:text-6xl font-extrabold tracking-tight"
        >
          AI Voice Calls, Built for Scale
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-5 max-w-2xl text-lg text-blue-100"
        >
          Verbio powers inbound and outbound conversations with low latency, natural voice, and deep integrations.
        </motion.p>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-8 flex items-center gap-3"
        >
          <Link href="/signup"><ButtonNeo>Start free</ButtonNeo></Link>
          <Link href="/pricing" className="text-sm font-semibold text-primary hover:underline">See pricing →</Link>
        </motion.div>
      </div>
    </section>
  );
}
