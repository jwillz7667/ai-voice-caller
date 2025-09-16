"use client";

import { motion } from "framer-motion";
import { ArrowRight, Users, Rocket, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function JoinUsSection() {
  return (
    <section className="py-20 bg-gradient-to-b from-white to-blue-50/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            {/* Main CTA Card */}
            <div className="relative p-12 rounded-3xl bg-gradient-to-br from-purple-500 via-blue-600 to-indigo-700 text-white overflow-hidden">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-0 w-60 h-60 bg-white rounded-full blur-3xl" />
              </div>

              <div className="relative z-10">
                {/* Header */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="text-center mb-8"
                >
                  <h2 className="text-4xl md:text-5xl font-bold mb-4">
                    Be part of something bigger
                  </h2>
                  <p className="text-xl text-blue-100 max-w-2xl mx-auto">
                    Join us in revolutionizing how the world communicates through voice AI
                  </p>
                </motion.div>

                {/* Benefits */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-3">
                      <Users className="w-6 h-6" />
                    </div>
                    <h3 className="font-semibold mb-1">Global Impact</h3>
                    <p className="text-sm text-blue-100">
                      Work on products used by millions worldwide
                    </p>
                  </div>
                  <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-3">
                      <Rocket className="w-6 h-6" />
                    </div>
                    <h3 className="font-semibold mb-1">Career Growth</h3>
                    <p className="text-sm text-blue-100">
                      Learn from the best and grow rapidly
                    </p>
                  </div>
                  <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-3">
                      <Heart className="w-6 h-6" />
                    </div>
                    <h3 className="font-semibold mb-1">Great Culture</h3>
                    <p className="text-sm text-blue-100">
                      Work with passionate, talented people
                    </p>
                  </div>
                </motion.div>

                {/* CTA Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="flex flex-col sm:flex-row gap-4 justify-center"
                >
                  <Button
                    size="lg"
                    className="bg-white text-purple-600 hover:bg-purple-50 px-8 py-6 text-lg shadow-xl hover:shadow-2xl transition-all"
                  >
                    View Open Roles
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white/30 bg-white/10 text-white hover:bg-white/20 px-8 py-6 text-lg backdrop-blur-sm"
                  >
                    Learn About Culture
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 text-center"
          >
            {[
              { value: "100%", label: "Remote First" },
              { value: "$180k", label: "Avg Salary" },
              { value: "30", label: "Open Positions" },
              { value: "4.9/5", label: "Glassdoor Rating" },
            ].map((stat, index) => (
              <div key={index}>
                <div className="text-3xl font-bold gradient-text mb-1">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}