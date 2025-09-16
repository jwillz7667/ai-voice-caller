"use client";

import { motion } from "framer-motion";
import { Sparkles, CreditCard, TrendingUp } from "lucide-react";

export default function PricingHero() {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white to-indigo-50/30" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full opacity-10 blur-3xl animate-float" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-200 rounded-full opacity-10 blur-3xl animate-float-delayed" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-4xl mx-auto text-center">
          {/* Hero Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 text-sm font-medium mb-6"
          >
            <Sparkles className="w-4 h-4" />
            Simple, Usage-Based Pricing
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6"
          >
            Pay for what you use,
            <span className="block mt-2 gradient-text">scale as you grow</span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto"
          >
            No hidden fees. No complex tiers. Just credits for AI voice minutes.
            Start free, upgrade anytime, and cancel without hassle.
          </motion.p>

          {/* Value Props */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto"
          >
            <div className="flex items-center justify-center gap-3 p-4 rounded-xl bg-white shadow-md border border-gray-100">
              <CreditCard className="w-5 h-5 text-blue-500" />
              <div className="text-left">
                <p className="font-semibold text-gray-900">$0.02/min</p>
                <p className="text-sm text-gray-600">Voice AI calls</p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 p-4 rounded-xl bg-white shadow-md border border-gray-100">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <div className="text-left">
                <p className="font-semibold text-gray-900">Volume discounts</p>
                <p className="text-sm text-gray-600">Up to 40% off</p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 p-4 rounded-xl bg-white shadow-md border border-gray-100">
              <Sparkles className="w-5 h-5 text-purple-500" />
              <div className="text-left">
                <p className="font-semibold text-gray-900">100 free credits</p>
                <p className="text-sm text-gray-600">To get started</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}