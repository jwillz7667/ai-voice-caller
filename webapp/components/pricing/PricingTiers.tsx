"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, X, Sparkles, Zap, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

const tiers = [
  {
    name: "Starter",
    icon: Sparkles,
    price: { monthly: 29, annually: 24 },
    credits: 1500,
    description: "Perfect for small businesses and testing",
    features: [
      { name: "1,500 credits/month", included: true },
      { name: "OpenAI GPT-4o voice", included: true },
      { name: "Call recordings", included: true },
      { name: "Basic analytics", included: true },
      { name: "Email support", included: true },
      { name: "Custom AI instructions", included: true },
      { name: "API access", included: false },
      { name: "Priority support", included: false },
      { name: "Custom voice cloning", included: false },
    ],
    cta: "Start Free Trial",
    popular: false,
  },
  {
    name: "Pro",
    icon: Zap,
    price: { monthly: 99, annually: 79 },
    credits: 6000,
    description: "For growing teams with higher volume",
    features: [
      { name: "6,000 credits/month", included: true },
      { name: "OpenAI GPT-4o voice", included: true },
      { name: "Call recordings", included: true },
      { name: "Advanced analytics", included: true },
      { name: "Priority email support", included: true },
      { name: "Custom AI instructions", included: true },
      { name: "API access", included: true },
      { name: "Priority support", included: true },
      { name: "Custom voice cloning", included: false },
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Scale",
    icon: Rocket,
    price: { monthly: 299, annually: 249 },
    credits: 20000,
    description: "Enterprise-ready with custom features",
    features: [
      { name: "20,000 credits/month", included: true },
      { name: "OpenAI GPT-4o voice", included: true },
      { name: "Call recordings", included: true },
      { name: "Enterprise analytics", included: true },
      { name: "24/7 phone support", included: true },
      { name: "Custom AI instructions", included: true },
      { name: "API access", included: true },
      { name: "Priority support", included: true },
      { name: "Custom voice cloning", included: true },
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

export default function PricingTiers() {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <section className="py-20 bg-gradient-to-b from-white to-blue-50/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 mb-4">
              Choose your plan
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              All plans include core features. Upgrade or downgrade anytime.
            </p>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4">
              <span className={`text-sm ${!isAnnual ? "font-semibold text-gray-900" : "text-gray-600"}`}>
                Monthly
              </span>
              <Switch
                checked={isAnnual}
                onCheckedChange={setIsAnnual}
                className="data-[state=checked]:bg-blue-600"
              />
              <span className={`text-sm ${isAnnual ? "font-semibold text-gray-900" : "text-gray-600"}`}>
                Annual
              </span>
              {isAnnual && (
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  Save 20%
                </Badge>
              )}
            </div>
          </motion.div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {tiers.map((tier, index) => (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="relative h-full"
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                    <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 px-4 py-1">
                      Most Popular
                    </Badge>
                  </div>
                )}

                <div
                  className={`h-full p-8 rounded-3xl bg-white transition-all duration-300 ${
                    tier.popular
                      ? "shadow-2xl border-2 border-blue-500"
                      : "shadow-xl border border-gray-100 hover:shadow-2xl"
                  }`}
                >
                  {/* Icon & Name */}
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        tier.popular
                          ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      <tier.icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">{tier.name}</h3>
                  </div>

                  {/* Description */}
                  <p className="text-gray-600 mb-6">{tier.description}</p>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-gray-900">
                        ${isAnnual ? tier.price.annually : tier.price.monthly}
                      </span>
                      <span className="text-gray-600">/month</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {tier.credits.toLocaleString()} credits included
                    </p>
                  </div>

                  {/* CTA Button */}
                  <Button
                    className={`w-full mb-8 ${
                      tier.popular
                        ? "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
                        : "bg-gray-900 hover:bg-gray-800 text-white"
                    }`}
                  >
                    {tier.cta}
                  </Button>

                  {/* Features */}
                  <div className="space-y-3">
                    {tier.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        {feature.included ? (
                          <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                        ) : (
                          <X className="w-5 h-5 text-gray-300 flex-shrink-0" />
                        )}
                        <span
                          className={`text-sm ${
                            feature.included ? "text-gray-700" : "text-gray-400"
                          }`}
                        >
                          {feature.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Additional Credits */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-12 text-center p-6 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100"
          >
            <p className="text-gray-900 font-semibold mb-1">
              Need more credits?
            </p>
            <p className="text-gray-600">
              Purchase additional credits anytime at $0.02 per credit. Volume discounts available.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}