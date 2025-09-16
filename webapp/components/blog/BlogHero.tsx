"use client";

import { motion } from "framer-motion";
import { BookOpen, TrendingUp, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function BlogHero() {
  return (
    <section className="relative pt-32 pb-16 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 via-white to-blue-50/30" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-purple-200 rounded-full opacity-10 blur-3xl animate-float" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-200 rounded-full opacity-10 blur-3xl animate-float-delayed" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-4xl mx-auto text-center">
          {/* Hero Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 text-sm font-medium mb-6"
          >
            <BookOpen className="w-4 h-4" />
            Insights & Updates
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-6xl font-bold tracking-tight mb-6"
          >
            Voice AI insights from
            <span className="block mt-2 gradient-text">the experts</span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto"
          >
            Deep dives into voice technology, best practices, case studies, and product updates
          </motion.p>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="max-w-lg mx-auto"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="search"
                placeholder="Search articles..."
                className="pl-12 pr-4 py-6 text-lg rounded-2xl border-gray-200 shadow-lg hover:shadow-xl transition-shadow"
              />
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex justify-center gap-8 mt-12"
          >
            <div className="text-center">
              <div className="text-3xl font-bold gradient-text">150+</div>
              <div className="text-sm text-gray-600">Articles</div>
            </div>
            <div className="w-px bg-gray-200" />
            <div className="text-center">
              <div className="text-3xl font-bold gradient-text">50k+</div>
              <div className="text-sm text-gray-600">Monthly Readers</div>
            </div>
            <div className="w-px bg-gray-200" />
            <div className="text-center">
              <div className="text-3xl font-bold gradient-text">12</div>
              <div className="text-sm text-gray-600">Categories</div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}