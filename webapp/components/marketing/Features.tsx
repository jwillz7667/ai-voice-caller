"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import {
  Mic,
  Clock,
  BarChart3,
  Workflow,
  Plug,
  Shield,
  Globe,
  Zap
} from "lucide-react";

const features = [
  {
    icon: Mic,
    title: "Natural Voice",
    description: "Human-like conversations with advanced voice synthesis and emotion detection",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: Clock,
    title: "24/7 Availability",
    description: "Always-on AI agents that never sleep, ensuring round-the-clock coverage",
    gradient: "from-indigo-500 to-purple-500",
  },
  {
    icon: BarChart3,
    title: "Real-Time Analytics",
    description: "Track performance, sentiment, and insights with comprehensive dashboards",
    gradient: "from-green-500 to-emerald-500",
  },
  {
    icon: Workflow,
    title: "Automated Workflows",
    description: "Seamlessly integrate with your existing systems and automate processes",
    gradient: "from-orange-500 to-red-500",
  },
  {
    icon: Plug,
    title: "Easy Integrations",
    description: "Connect with Twilio, CRMs, and popular business tools in minutes",
    gradient: "from-pink-500 to-rose-500",
  },
];

const stats = [
  { value: "300%", label: "Efficiency Increase" },
  { value: "50%", label: "Cost Reduction" },
  { value: "24/7", label: "Intelligent Support" },
];

export default function Features() {
  return (
    <section className="py-20 bg-gradient-to-b from-white to-blue-50/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 mb-4">
              Everything your voice platform should be
            </h2>
            <p className="text-xl text-gray-600">
              Without the complexity
            </p>
          </motion.div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="group"
              >
                <div className="h-full p-6 rounded-2xl bg-white shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Hero Image with Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="rounded-3xl overflow-hidden glass-effect p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                {/* Image */}
                <div className="relative h-96 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-100 to-indigo-100">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                        <Mic className="w-16 h-16 text-white" />
                      </div>
                      <p className="text-2xl font-bold text-gray-800">AI Voice Agent</p>
                      <p className="text-gray-600 mt-2">Powered by Verbio</p>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="space-y-6">
                  <h3 className="text-3xl font-bold text-gray-900">
                    Transform Your Customer Experience
                  </h3>
                  <p className="text-gray-600">
                    Join thousands of businesses using Verbio to handle millions of conversations with unprecedented efficiency.
                  </p>

                  <div className="grid grid-cols-3 gap-4 pt-6">
                    {stats.map((stat, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
                        className="text-center"
                      >
                        <div className="inline-flex items-center justify-center px-4 py-2 bg-green-100 text-green-800 rounded-xl">
                          <span className="text-2xl font-bold">{stat.value}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">{stat.label}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Additional Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <div className="flex items-center gap-4 p-4 rounded-xl bg-white shadow-md">
              <Shield className="w-10 h-10 text-blue-500" />
              <div>
                <h4 className="font-semibold text-gray-900">Enterprise Security</h4>
                <p className="text-sm text-gray-600">SOC 2 compliant with end-to-end encryption</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl bg-white shadow-md">
              <Globe className="w-10 h-10 text-green-500" />
              <div>
                <h4 className="font-semibold text-gray-900">Global Scale</h4>
                <p className="text-sm text-gray-600">Support for 30+ languages and dialects</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl bg-white shadow-md">
              <Zap className="w-10 h-10 text-orange-500" />
              <div>
                <h4 className="font-semibold text-gray-900">Lightning Fast</h4>
                <p className="text-sm text-gray-600">Sub-300ms response time globally</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}