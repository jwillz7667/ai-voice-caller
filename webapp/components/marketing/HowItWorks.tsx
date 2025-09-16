"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Phone, Settings, Zap } from "lucide-react";

const steps = [
  {
    title: "Step 1: Configure Your AI",
    description: "Create your custom voice intelligence agent with natural voice selection and personality",
    checklist: [
      "Choose a natural voice",
      "Name your AI agent",
      "Define conversation flows",
    ],
    icon: Settings,
  },
  {
    title: "Step 2: Set Up Integration",
    description: "Equip your AI with knowledge and connect to your systems",
    checklist: [
      "Add FAQs and knowledge base",
      "Integrate service details",
      "Update workflows",
    ],
    icon: Phone,
  },
  {
    title: "Step 3: Go Live",
    description: "Launch your AI agent and start handling calls immediately",
    checklist: [
      "Get a phone number",
      "Configure call routing",
      "Monitor in real-time",
    ],
    icon: Zap,
  },
];

export default function HowItWorks() {
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
              Get started in minutes
            </h2>
            <p className="text-xl text-gray-600">
              Our AI-powered voice platform is just 3 steps away
            </p>
          </motion.div>

          {/* Steps Grid */}
          <div className="space-y-16">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`flex flex-col lg:flex-row gap-8 items-center ${
                  index % 2 === 1 ? "lg:flex-row-reverse" : ""
                }`}
              >
                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-lg">
                      <step.icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      {step.title}
                    </h3>
                  </div>
                  <p className="text-gray-600 mb-6">{step.description}</p>

                  {/* Checklist */}
                  <ul className="space-y-3">
                    {step.checklist.map((item, itemIndex) => (
                      <motion.li
                        key={itemIndex}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{
                          duration: 0.3,
                          delay: index * 0.1 + itemIndex * 0.1,
                        }}
                        className="flex items-center gap-3"
                      >
                        <div className="flex-shrink-0">
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        </div>
                        <span className="text-gray-700">{item}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>

                {/* Visual Card */}
                <div className="flex-1">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="relative p-8 rounded-2xl glass-effect"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl" />
                    <div className="relative">
                      <div className="w-full h-64 bg-white rounded-xl shadow-inner flex items-center justify-center">
                        <step.icon className="w-24 h-24 text-blue-500 opacity-20" />
                      </div>
                      <div className="mt-4 flex justify-center gap-2">
                        {[...Array(3)].map((_, i) => (
                          <div
                            key={i}
                            className={`h-2 rounded-full transition-all duration-300 ${
                              i <= index
                                ? "w-8 bg-blue-500"
                                : "w-2 bg-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Bottom CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-16 text-center"
          >
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-green-50 text-green-700 rounded-full font-semibold">
              <CheckCircle2 className="w-5 h-5" />
              <span>Start with 100 free credits - No credit card required</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}