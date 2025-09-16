"use client";

import { motion } from "framer-motion";
import { Target, Heart, Lightbulb } from "lucide-react";

export default function MissionSection() {
  return (
    <section className="py-20 bg-gradient-to-b from-white to-blue-50/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Text Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 mb-6">
                Our mission is simple yet
                <span className="gradient-text"> transformative</span>
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                We believe every business deserves access to world-class voice AI technology.
                By democratizing advanced voice intelligence, we're enabling companies of all
                sizes to deliver exceptional customer experiences that were once only possible
                for tech giants.
              </p>
              <p className="text-lg text-gray-600">
                From small startups to Fortune 500 companies, we're powering millions of
                conversations daily, helping businesses save time, reduce costs, and most
                importantly, delight their customers with natural, intelligent voice interactions.
              </p>
            </motion.div>

            {/* Mission Cards */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="space-y-6"
            >
              {[
                {
                  icon: Target,
                  title: "Our Vision",
                  description: "A world where AI enhances every voice interaction, making communication more efficient and human.",
                  color: "from-blue-500 to-cyan-500",
                },
                {
                  icon: Heart,
                  title: "Our Purpose",
                  description: "To empower businesses with voice AI that truly understands and responds with empathy and intelligence.",
                  color: "from-purple-500 to-pink-500",
                },
                {
                  icon: Lightbulb,
                  title: "Our Innovation",
                  description: "Pushing the boundaries of what's possible with voice AI through continuous research and development.",
                  color: "from-green-500 to-emerald-500",
                },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: 0.2 + index * 0.1 }}
                  whileHover={{ x: 5 }}
                  className="flex gap-4 p-6 rounded-2xl bg-white shadow-lg border border-gray-100 hover:shadow-xl transition-all"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} text-white flex items-center justify-center flex-shrink-0`}>
                    <item.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-gray-600 text-sm">{item.description}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}