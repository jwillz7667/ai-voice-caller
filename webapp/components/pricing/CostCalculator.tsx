"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Calculator, TrendingUp, DollarSign, Clock } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";

export default function CostCalculator() {
  const [minutes, setMinutes] = useState([5000]);
  const [avgCallDuration, setAvgCallDuration] = useState([3]);

  // Calculate costs
  const callsPerMonth = Math.floor(minutes[0] / avgCallDuration[0]);
  const baseCost = minutes[0] * 0.02;

  // Apply volume discounts
  let discount = 0;
  if (minutes[0] >= 10000) discount = 0.15;
  else if (minutes[0] >= 5000) discount = 0.10;
  else if (minutes[0] >= 2000) discount = 0.05;

  const finalCost = baseCost * (1 - discount);
  const savings = baseCost - finalCost;

  // Determine recommended plan
  const getRecommendedPlan = () => {
    if (minutes[0] <= 1500) return { name: "Starter", price: 29 };
    if (minutes[0] <= 6000) return { name: "Pro", price: 99 };
    if (minutes[0] <= 20000) return { name: "Scale", price: 299 };
    return { name: "Enterprise", price: "Custom" };
  };

  const recommendedPlan = getRecommendedPlan();

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
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 text-sm font-medium mb-6">
              <Calculator className="w-4 h-4" />
              Interactive Calculator
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 mb-4">
              Estimate your monthly costs
            </h2>
            <p className="text-xl text-gray-600">
              Adjust the sliders to see how much you'll save with Verbio
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Calculator Controls */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <Card className="p-8 shadow-xl border-gray-100">
                <h3 className="text-2xl font-bold text-gray-900 mb-8">
                  Your Usage
                </h3>

                {/* Minutes Slider */}
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-sm font-medium text-gray-700">
                      Total minutes per month
                    </label>
                    <span className="text-2xl font-bold text-blue-600">
                      {minutes[0].toLocaleString()}
                    </span>
                  </div>
                  <Slider
                    value={minutes}
                    onValueChange={setMinutes}
                    min={100}
                    max={50000}
                    step={100}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>100</span>
                    <span>50,000</span>
                  </div>
                </div>

                {/* Average Call Duration */}
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-sm font-medium text-gray-700">
                      Average call duration (minutes)
                    </label>
                    <span className="text-2xl font-bold text-blue-600">
                      {avgCallDuration[0]}
                    </span>
                  </div>
                  <Slider
                    value={avgCallDuration}
                    onValueChange={setAvgCallDuration}
                    min={1}
                    max={15}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>1 min</span>
                    <span>15 min</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-gray-50">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Calls/month</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {callsPerMonth.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-gray-50">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Discount</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {(discount * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Cost Breakdown */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="p-8 shadow-xl border-gray-100 h-full">
                <h3 className="text-2xl font-bold text-gray-900 mb-8">
                  Your Estimated Cost
                </h3>

                {/* Pricing Breakdown */}
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                    <span className="text-gray-600">Base cost</span>
                    <span className="text-lg text-gray-900">
                      ${baseCost.toFixed(2)}
                    </span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                      <span className="text-gray-600">Volume discount</span>
                      <span className="text-lg text-green-600">
                        -${savings.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-xl font-semibold text-gray-900">
                      Total monthly cost
                    </span>
                    <span className="text-3xl font-bold gradient-text">
                      ${finalCost.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Recommended Plan */}
                <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="w-5 h-5 text-blue-600" />
                    <h4 className="font-semibold text-gray-900">
                      Recommended Plan
                    </h4>
                  </div>
                  <p className="text-2xl font-bold text-blue-600 mb-2">
                    {recommendedPlan.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    {typeof recommendedPlan.price === 'number'
                      ? `$${recommendedPlan.price}/month includes ${minutes[0] <= 20000 ? 'all' : 'most of'} your usage`
                      : 'Contact us for custom pricing'}
                  </p>
                </div>

                {/* Comparison */}
                <div className="mt-6 p-4 rounded-xl bg-green-50 border border-green-200">
                  <p className="text-sm text-green-800">
                    <span className="font-semibold">You save vs competitors:</span>{' '}
                    Approximately ${(finalCost * 0.4).toFixed(0)}/month with Verbio's efficient pricing
                  </p>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}