"use client";

import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Sarah Chen",
    role: "COO",
    company: "Fintech Solutions",
    quote: "Verbio cut our call handling time by 40%. The AI understands context better than any system we've used.",
    rating: 5,
    avatar: "SC",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    name: "Michael Rodriguez",
    role: "CTO",
    company: "Healthcare Plus",
    quote: "Integration took hours, not weeks. We're now handling 3x more patient inquiries with the same team.",
    rating: 5,
    avatar: "MR",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    name: "Emily Thompson",
    role: "Head of CX",
    company: "SaaS Platform",
    quote: "The voice quality is stunning. Our customers can't tell they're talking to an AI.",
    rating: 5,
    avatar: "ET",
    gradient: "from-green-500 to-emerald-500",
  },
];

export default function TestimonialsSection() {
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
              Trusted by Industry Leaders
            </h2>
            <p className="text-xl text-gray-600">
              See what our customers have to say about Verbio
            </p>
          </motion.div>

          {/* Testimonials Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="h-full"
              >
                <div className="h-full p-8 rounded-3xl bg-white shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 flex flex-col">
                  {/* Quote Icon */}
                  <div className="mb-4">
                    <Quote className="w-8 h-8 text-blue-500 opacity-50" />
                  </div>

                  {/* Rating */}
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-5 h-5 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>

                  {/* Quote */}
                  <p className="text-gray-700 mb-6 flex-grow italic">
                    "{testimonial.quote}"
                  </p>

                  {/* Author */}
                  <div className="flex items-center gap-4 pt-6 border-t border-gray-100">
                    <div
                      className={`w-12 h-12 rounded-full bg-gradient-to-br ${testimonial.gradient} flex items-center justify-center text-white font-semibold`}
                    >
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {testimonial.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {testimonial.role}, {testimonial.company}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Additional Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-16 text-center"
          >
            <div className="inline-flex items-center gap-8 px-8 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-full">
              <div>
                <p className="text-2xl font-bold text-gray-900">500+</p>
                <p className="text-sm text-gray-600">Happy Customers</p>
              </div>
              <div className="w-px h-12 bg-gray-300" />
              <div>
                <p className="text-2xl font-bold text-gray-900">10M+</p>
                <p className="text-sm text-gray-600">Calls Handled</p>
              </div>
              <div className="w-px h-12 bg-gray-300" />
              <div>
                <p className="text-2xl font-bold text-gray-900">4.9/5</p>
                <p className="text-sm text-gray-600">Average Rating</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}