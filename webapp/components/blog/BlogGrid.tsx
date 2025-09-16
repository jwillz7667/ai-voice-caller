"use client";

import { motion } from "framer-motion";
import { Calendar, Clock, ArrowRight, User, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const blogPosts = [
  {
    id: 1,
    title: "Implementing Real-Time Voice AI with OpenAI's GPT-4o",
    excerpt: "A comprehensive guide to building production-ready voice applications using the latest OpenAI Realtime API.",
    category: "Engineering",
    author: "Alex Chen",
    date: "Jan 15, 2025",
    readTime: "8 min read",
    image: "/blog-1.jpg",
    featured: true,
    tags: ["OpenAI", "Tutorial", "Voice AI"],
  },
  {
    id: 2,
    title: "How Verbio Helped TechCorp Reduce Call Center Costs by 60%",
    excerpt: "Learn how TechCorp transformed their customer service with AI voice agents, handling 10x more calls.",
    category: "Case Study",
    author: "Sarah Rodriguez",
    date: "Jan 12, 2025",
    readTime: "5 min read",
    image: "/blog-2.jpg",
    featured: false,
    tags: ["Success Story", "ROI"],
  },
  {
    id: 3,
    title: "The Future of Voice AI: 2025 Predictions",
    excerpt: "Our expert predictions on where voice AI technology is heading and what it means for businesses.",
    category: "Insights",
    author: "Michael Park",
    date: "Jan 10, 2025",
    readTime: "6 min read",
    image: "/blog-3.jpg",
    featured: false,
    tags: ["Trends", "Future"],
  },
  {
    id: 4,
    title: "Announcing Multi-Language Support for 30+ Languages",
    excerpt: "Verbio now supports over 30 languages with native-level fluency, enabling global communication.",
    category: "Product Update",
    author: "Emily Watson",
    date: "Jan 8, 2025",
    readTime: "3 min read",
    image: "/blog-4.jpg",
    featured: false,
    tags: ["Product", "Features"],
  },
  {
    id: 5,
    title: "Best Practices for Training Custom Voice Models",
    excerpt: "Step-by-step guide to creating and fine-tuning voice models that match your brand's personality.",
    category: "Tutorial",
    author: "David Kumar",
    date: "Jan 5, 2025",
    readTime: "10 min read",
    image: "/blog-5.jpg",
    featured: false,
    tags: ["Tutorial", "ML"],
  },
  {
    id: 6,
    title: "Voice AI Security: Protecting Customer Data",
    excerpt: "Essential security measures and compliance considerations for voice AI implementations.",
    category: "Engineering",
    author: "Lisa Thompson",
    date: "Jan 3, 2025",
    readTime: "7 min read",
    image: "/blog-6.jpg",
    featured: false,
    tags: ["Security", "Compliance"],
  },
];

export default function BlogGrid() {
  return (
    <section className="py-20 bg-gradient-to-b from-white to-blue-50/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Featured Post */}
          {blogPosts.filter(post => post.featured).map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="mb-16"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8 rounded-3xl bg-white shadow-xl border border-gray-100 hover:shadow-2xl transition-all">
                {/* Image */}
                <div className="h-80 rounded-2xl bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
                      {post.title[0]}
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                      Featured
                    </Badge>
                  </div>
                </div>

                {/* Content */}
                <div className="flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-4">
                    <Badge variant="outline" className="text-blue-600 border-blue-200">
                      {post.category}
                    </Badge>
                    {post.tags.slice(0, 2).map((tag, idx) => (
                      <Badge key={idx} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <h2 className="text-3xl font-bold text-gray-900 mb-3 hover:gradient-text transition-colors">
                    {post.title}
                  </h2>

                  <p className="text-gray-600 mb-6 line-clamp-3">
                    {post.excerpt}
                  </p>

                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      <span>{post.author}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{post.date}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{post.readTime}</span>
                    </div>
                  </div>

                  <Button className="self-start bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
                    Read Article
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}

          {/* Regular Posts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.filter(post => !post.featured).map((post, index) => (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="group cursor-pointer"
              >
                <div className="h-full p-6 rounded-2xl bg-white shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 flex flex-col">
                  {/* Image Placeholder */}
                  <div className="h-48 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 mb-6 overflow-hidden">
                    <div className="h-full flex items-center justify-center">
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold group-hover:scale-110 transition-transform">
                        {post.title[0]}
                      </div>
                    </div>
                  </div>

                  {/* Category & Tags */}
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="outline" className="text-blue-600 border-blue-200 text-xs">
                      {post.category}
                    </Badge>
                    {post.tags.slice(0, 1).map((tag, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:gradient-text transition-colors line-clamp-2">
                    {post.title}
                  </h3>

                  {/* Excerpt */}
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-grow">
                    {post.excerpt}
                  </p>

                  {/* Meta */}
                  <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-3">
                      <span>{post.author}</span>
                      <span>•</span>
                      <span>{post.date}</span>
                    </div>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {post.readTime}
                    </span>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>

          {/* Load More */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-12 text-center"
          >
            <Button
              size="lg"
              variant="outline"
              className="border-gray-300 hover:border-blue-500 hover:text-blue-600"
            >
              Load More Articles
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}