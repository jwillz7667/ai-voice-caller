"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle, ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "What exactly is a credit?",
    answer: "One credit equals one minute of AI voice call time. Credits are consumed only for actual call duration, rounded up to the nearest minute. Unused credits roll over to the next month for active subscriptions.",
  },
  {
    question: "Can I change my plan anytime?",
    answer: "Yes! You can upgrade, downgrade, or cancel your plan at any time. When upgrading, you'll be prorated for the remainder of the billing cycle. Downgrades take effect at the next billing cycle.",
  },
  {
    question: "Do you offer a free trial?",
    answer: "Every new account gets 100 free credits to test Verbio. No credit card required. This gives you about 100 minutes of AI voice calls to experience the platform fully.",
  },
  {
    question: "What happens if I run out of credits?",
    answer: "You can purchase additional credits at any time for $0.02 per credit. We'll also notify you when you're running low. For Scale and Enterprise plans, we can set up automatic top-ups.",
  },
  {
    question: "Are there any setup or hidden fees?",
    answer: "No hidden fees whatsoever. The price you see is what you pay. No setup fees, no termination fees, no minimum commitments. Phone numbers are included with all paid plans.",
  },
  {
    question: "How does billing work?",
    answer: "We bill monthly or annually (with 20% discount) via credit card. Invoices are sent automatically. Enterprise customers can request NET 30 terms and pay via ACH or wire transfer.",
  },
  {
    question: "Can I use my own phone numbers?",
    answer: "Yes! You can port existing numbers or use your own Twilio account. All plans include one phone number, and you can add more for $5/month each.",
  },
  {
    question: "What about data security and compliance?",
    answer: "We're SOC 2 Type II certified and GDPR compliant. All calls are encrypted end-to-end. Call recordings are stored securely and can be deleted anytime. We never train AI models on your data.",
  },
];

export default function PricingFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-20 bg-gradient-to-b from-white to-blue-50/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 text-sm font-medium mb-6">
              <HelpCircle className="w-4 h-4" />
              Frequently Asked Questions
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 mb-4">
              Everything you need to know
            </h2>
            <p className="text-xl text-gray-600">
              Can't find what you're looking for? Contact our support team.
            </p>
          </motion.div>

          {/* FAQ Items */}
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
              >
                <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
                  <button
                    onClick={() => setOpenIndex(openIndex === index ? null : index)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-semibold text-gray-900 pr-4">
                      {faq.question}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform duration-300 ${
                        openIndex === index ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  <AnimatePresence>
                    {openIndex === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="px-6 pb-5">
                          <p className="text-gray-600 leading-relaxed">
                            {faq.answer}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Contact Support */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-12 text-center"
          >
            <p className="text-gray-600 mb-4">
              Still have questions?
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/contact"
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Contact Support
              </a>
              <a
                href="/docs"
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 transition-all"
              >
                View Documentation
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}