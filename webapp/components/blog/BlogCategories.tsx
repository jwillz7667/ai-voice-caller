"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Code,
  TrendingUp,
  Users,
  BookOpen,
  Lightbulb,
  Megaphone,
  FileText
} from "lucide-react";

const categories = [
  { id: "all", name: "All Posts", icon: Sparkles, count: 156 },
  { id: "tutorials", name: "Tutorials", icon: Code, count: 42 },
  { id: "case-studies", name: "Case Studies", icon: TrendingUp, count: 28 },
  { id: "product", name: "Product Updates", icon: Megaphone, count: 31 },
  { id: "engineering", name: "Engineering", icon: Lightbulb, count: 24 },
  { id: "insights", name: "Industry Insights", icon: BookOpen, count: 18 },
  { id: "company", name: "Company News", icon: Users, count: 13 },
];

export default function BlogCategories() {
  const [activeCategory, setActiveCategory] = useState("all");

  return (
    <section className="py-8 bg-white border-b border-gray-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((category, index) => (
              <motion.button
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveCategory(category.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${
                  activeCategory === category.id
                    ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <category.icon className="w-4 h-4" />
                <span>{category.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  activeCategory === category.id
                    ? "bg-white/20 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}>
                  {category.count}
                </span>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}