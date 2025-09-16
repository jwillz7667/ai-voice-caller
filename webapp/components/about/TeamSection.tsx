"use client";

import { motion } from "framer-motion";
import { Linkedin, Twitter, Github } from "lucide-react";

const team = [
  {
    name: "Alex Chen",
    role: "CEO & Co-Founder",
    bio: "Former OpenAI researcher, building the future of voice AI",
    avatar: "AC",
    gradient: "from-blue-500 to-purple-600",
    social: {
      linkedin: "#",
      twitter: "#",
    },
  },
  {
    name: "Sarah Rodriguez",
    role: "CTO & Co-Founder",
    bio: "Ex-Google Brain, specializing in real-time AI systems",
    avatar: "SR",
    gradient: "from-purple-500 to-pink-600",
    social: {
      linkedin: "#",
      github: "#",
    },
  },
  {
    name: "Michael Park",
    role: "VP of Engineering",
    bio: "15+ years building scalable voice infrastructure",
    avatar: "MP",
    gradient: "from-green-500 to-emerald-600",
    social: {
      linkedin: "#",
      twitter: "#",
    },
  },
  {
    name: "Emily Watson",
    role: "Head of AI Research",
    bio: "PhD in NLP, pioneering conversational AI",
    avatar: "EW",
    gradient: "from-orange-500 to-red-600",
    social: {
      linkedin: "#",
      github: "#",
    },
  },
  {
    name: "David Kumar",
    role: "VP of Product",
    bio: "Building products that users love at scale",
    avatar: "DK",
    gradient: "from-pink-500 to-rose-600",
    social: {
      linkedin: "#",
      twitter: "#",
    },
  },
  {
    name: "Lisa Thompson",
    role: "VP of Sales",
    bio: "Helping businesses transform with voice AI",
    avatar: "LT",
    gradient: "from-indigo-500 to-blue-600",
    social: {
      linkedin: "#",
      twitter: "#",
    },
  },
];

export default function TeamSection() {
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
              Meet the team
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Brilliant minds from the world's leading tech companies, united by a shared vision
            </p>
          </motion.div>

          {/* Team Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="group"
              >
                <div className="h-full p-8 rounded-3xl bg-white shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 text-center">
                  {/* Avatar */}
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="mb-6"
                  >
                    <div className={`w-24 h-24 mx-auto rounded-full bg-gradient-to-br ${member.gradient} flex items-center justify-center text-white text-2xl font-bold shadow-lg`}>
                      {member.avatar}
                    </div>
                  </motion.div>

                  {/* Info */}
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">
                    {member.name}
                  </h3>
                  <p className="text-sm font-medium text-blue-600 mb-3">
                    {member.role}
                  </p>
                  <p className="text-gray-600 text-sm mb-6">
                    {member.bio}
                  </p>

                  {/* Social Links */}
                  <div className="flex justify-center gap-3">
                    {member.social.linkedin && (
                      <a
                        href={member.social.linkedin}
                        className="w-9 h-9 rounded-full bg-gray-100 hover:bg-blue-100 flex items-center justify-center text-gray-600 hover:text-blue-600 transition-all"
                        aria-label="LinkedIn"
                      >
                        <Linkedin className="w-4 h-4" />
                      </a>
                    )}
                    {member.social.twitter && (
                      <a
                        href={member.social.twitter}
                        className="w-9 h-9 rounded-full bg-gray-100 hover:bg-blue-100 flex items-center justify-center text-gray-600 hover:text-blue-600 transition-all"
                        aria-label="Twitter"
                      >
                        <Twitter className="w-4 h-4" />
                      </a>
                    )}
                    {member.social.github && (
                      <a
                        href={member.social.github}
                        className="w-9 h-9 rounded-full bg-gray-100 hover:bg-blue-100 flex items-center justify-center text-gray-600 hover:text-blue-600 transition-all"
                        aria-label="GitHub"
                      >
                        <Github className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Join Team CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-16 text-center p-8 rounded-3xl bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100"
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Want to join our mission?
            </h3>
            <p className="text-gray-600 mb-6">
              We're always looking for talented people who share our vision
            </p>
            <a
              href="/careers"
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 transition-all font-medium"
            >
              View Open Positions
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}