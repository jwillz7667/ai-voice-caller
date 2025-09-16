"use client";

import { motion } from "framer-motion";
import { Mic, Users, Globe, Award } from "lucide-react";

export default function AboutHero() {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white to-purple-50/30" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-purple-200 rounded-full opacity-10 blur-3xl animate-float" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-200 rounded-full opacity-10 blur-3xl animate-float-delayed" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-5xl mx-auto">
          {/* Hero Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 text-sm font-medium mb-6">
              <Users className="w-4 h-4" />
              Our Story
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
              Building the future of
              <span className="block mt-2 gradient-text">voice intelligence</span>
            </h1>

            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We're on a mission to make every conversation more meaningful,
              efficient, and human-centered through cutting-edge AI technology.
            </p>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16"
          >
            {[
              { icon: Globe, label: "Countries", value: "47+" },
              { icon: Users, label: "Team Members", value: "150+" },
              { icon: Mic, label: "Daily Calls", value: "1M+" },
              { icon: Award, label: "Awards", value: "12" },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 text-blue-600 mb-3">
                  <stat.icon className="w-6 h-6" />
                </div>
                <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* Hero Image/Visual */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-16"
          >
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-blue-100 to-purple-100 p-1">
              <div className="rounded-3xl bg-white p-12 text-center">
                <div className="flex justify-center gap-8 flex-wrap">
                  {["San Francisco", "London", "Tokyo", "Berlin"].map((city, index) => (
                    <div key={index} className="text-center">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 mb-3 mx-auto flex items-center justify-center text-white font-bold text-xl">
                        {city[0]}
                      </div>
                      <p className="text-sm text-gray-600">{city}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-8 text-gray-600 font-medium">
                  Global team. Local impact. Universal vision.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}