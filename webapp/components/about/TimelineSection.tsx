"use client";

import { motion } from "framer-motion";
import { Rocket, Building, Globe, Trophy, Star, TrendingUp } from "lucide-react";

const milestones = [
  {
    year: "2021",
    icon: Rocket,
    title: "The Beginning",
    description: "Founded in a San Francisco garage with a vision to democratize voice AI",
    color: "from-blue-500 to-cyan-500",
  },
  {
    year: "2022",
    icon: Building,
    title: "First Major Client",
    description: "Secured our first enterprise client and processed 1M+ calls",
    color: "from-purple-500 to-pink-500",
  },
  {
    year: "2023",
    icon: Globe,
    title: "Global Expansion",
    description: "Expanded to 30+ countries and launched multi-language support",
    color: "from-green-500 to-emerald-500",
  },
  {
    year: "2024",
    icon: Trophy,
    title: "Industry Recognition",
    description: "Named 'Best AI Voice Platform' by TechCrunch and raised Series B",
    color: "from-orange-500 to-red-500",
  },
  {
    year: "2025",
    icon: Star,
    title: "OpenAI Partnership",
    description: "Integrated GPT-4o Realtime API, setting new standards for voice AI",
    color: "from-indigo-500 to-purple-500",
  },
  {
    year: "Future",
    icon: TrendingUp,
    title: "The Journey Continues",
    description: "Building towards AGI-powered conversations that feel truly human",
    color: "from-pink-500 to-rose-500",
  },
];

export default function TimelineSection() {
  return (
    <section className="py-20 bg-gradient-to-b from-white to-blue-50/30">
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
              Our journey so far
            </h2>
            <p className="text-xl text-gray-600">
              From humble beginnings to industry leadership
            </p>
          </motion.div>

          {/* Timeline */}
          <div className="relative">
            {/* Vertical Line - Hidden on mobile */}
            <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 w-0.5 h-full bg-gradient-to-b from-blue-200 via-purple-200 to-pink-200" />

            {/* Milestones */}
            <div className="space-y-12 md:space-y-16">
              {milestones.map((milestone, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={`flex flex-col md:flex-row items-center gap-8 ${
                    index % 2 === 0 ? "md:flex-row-reverse" : ""
                  }`}
                >
                  {/* Content Card */}
                  <div className="flex-1 w-full md:w-auto">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className={`p-6 rounded-2xl bg-white shadow-lg border border-gray-100 hover:shadow-xl transition-all ${
                        index % 2 === 0 ? "md:ml-8" : "md:mr-8"
                      }`}
                    >
                      <div className="flex items-center gap-4 mb-4">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${milestone.color} text-white flex items-center justify-center`}>
                          <milestone.icon className="w-6 h-6" />
                        </div>
                        <span className="text-2xl font-bold gradient-text">
                          {milestone.year}
                        </span>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {milestone.title}
                      </h3>
                      <p className="text-gray-600">
                        {milestone.description}
                      </p>
                    </motion.div>
                  </div>

                  {/* Center Dot */}
                  <div className="hidden md:flex items-center justify-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: index * 0.1 + 0.2 }}
                      className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 border-4 border-white shadow-lg"
                    />
                  </div>

                  {/* Spacer */}
                  <div className="flex-1 hidden md:block" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}