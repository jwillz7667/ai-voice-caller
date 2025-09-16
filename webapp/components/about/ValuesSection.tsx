"use client";

import { motion } from "framer-motion";
import {
  Sparkles,
  Users,
  Shield,
  Zap,
  Heart,
  Globe
} from "lucide-react";

const values = [
  {
    icon: Sparkles,
    title: "Innovation First",
    description: "We constantly push boundaries and challenge the status quo to deliver breakthrough solutions.",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    icon: Users,
    title: "Customer Obsession",
    description: "Every decision we make starts with asking 'How does this benefit our customers?'",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: Shield,
    title: "Trust & Security",
    description: "We handle sensitive conversations with the highest standards of privacy and security.",
    gradient: "from-green-500 to-emerald-500",
  },
  {
    icon: Zap,
    title: "Speed & Efficiency",
    description: "We move fast, iterate quickly, and deliver value at the speed of thought.",
    gradient: "from-orange-500 to-red-500",
  },
  {
    icon: Heart,
    title: "Empathy at Scale",
    description: "We build technology that understands and responds with genuine care and understanding.",
    gradient: "from-pink-500 to-rose-500",
  },
  {
    icon: Globe,
    title: "Global Impact",
    description: "We're building for a world without language or communication barriers.",
    gradient: "from-indigo-500 to-purple-500",
  },
];

export default function ValuesSection() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 mb-4">
              Values that guide us
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              These principles shape our culture, drive our decisions, and define who we are
            </p>
          </motion.div>

          {/* Values Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="group"
              >
                <div className="h-full p-8 rounded-3xl bg-white shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${value.gradient} text-white flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <value.icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {value.title}
                  </h3>
                  <p className="text-gray-600">
                    {value.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}