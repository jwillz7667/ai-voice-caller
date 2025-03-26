'use client';

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Phone, Headset, Zap, Shield } from "lucide-react";
import Header from "@/components/layout/Header";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50">
      <Header />
      
      {/* Hero Section */}
      <header className="container mx-auto px-4 py-24 flex flex-col items-center text-center">
        <div className="animate-fade-in-up">
          <h1 className="text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-blue-500 mb-10">
            Jingle.AI Voice Calling
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-12">
            Leverage advanced AI technology to create intelligent, responsive voice experiences that feel natural and human-like.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard">
              <Button className="group bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-700 hover:to-blue-600 text-white px-8 py-6 rounded-full text-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
            </Link>
            <a href="https://github.com/yourusername/openai-realtime-twilio-demo" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="px-8 py-6 rounded-full text-lg font-medium border-2">
                View on GitHub
              </Button>
            </a>
          </div>
        </div>
      </header>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-16 text-gray-800">
          Powerful Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            {
              icon: <Phone className="h-10 w-10 text-indigo-500" />,
              title: "Natural Voice Calls",
              description: "Create voice experiences that sound and respond like real humans."
            },
            {
              icon: <Headset className="h-10 w-10 text-indigo-500" />,
              title: "Real-time Responses",
              description: "Minimal latency for natural conversation flow with advanced AI technology."
            },
            {
              icon: <Zap className="h-10 w-10 text-indigo-500" />,
              title: "Function Calling",
              description: "Execute complex functions during calls for advanced integrations."
            },
            {
              icon: <Shield className="h-10 w-10 text-indigo-500" />,
              title: "Secure Infrastructure",
              description: "End-to-end encryption with enterprise-grade security protocols."
            }
          ].map((feature, index) => (
            <div 
              key={index} 
              className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100"
            >
              <div className="bg-indigo-50 rounded-full w-16 h-16 flex items-center justify-center mb-6">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-800">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-16 text-gray-800">
          Simple, Transparent Pricing
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {[
            {
              name: "Starter",
              price: "$9.99",
              credits: 100,
              description: "Perfect for casual users and testing",
              features: [
                "100 voice credits",
                "Approximately 20 minutes of calls",
                "Standard support",
              ],
            },
            {
              name: "Professional",
              price: "$19.99",
              credits: 250,
              description: "Most popular for regular users",
              featured: true,
              features: [
                "250 voice credits",
                "Approximately 50 minutes of calls",
                "Priority support",
                "Advanced call analytics"
              ],
            },
            {
              name: "Enterprise",
              price: "$49.99",
              credits: 750,
              description: "Ideal for business users",
              features: [
                "750 voice credits",
                "Approximately 150 minutes of calls",
                "Premium support",
                "Advanced call analytics",
                "Custom voice settings"
              ],
            },
            {
              name: "Unlimited",
              price: "$99.99",
              credits: 2000,
              description: "Best value for power users",
              features: [
                "2000 voice credits",
                "Approximately 400 minutes of calls",
                "24/7 Support",
                "Advanced call analytics",
                "Custom voice settings",
                "Priority processing"
              ],
            },
          ].map((plan, index) => (
            <div 
              key={index} 
              className={`rounded-2xl p-8 transition-all duration-300 transform hover:-translate-y-1 flex flex-col h-full
                ${plan.featured 
                  ? 'bg-gradient-to-b from-indigo-500 to-blue-600 text-white shadow-xl' 
                  : 'bg-white shadow-lg border border-gray-100'}`}
            >
              <h3 className={`text-2xl font-bold mb-2 ${!plan.featured ? 'text-gray-800' : ''}`}>
                {plan.name}
              </h3>
              <div className="flex items-baseline mb-6">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className={`${plan.featured ? 'text-indigo-100' : 'text-gray-500'} ml-2`}>
                  / package
                </span>
              </div>
              <p className={`mb-6 ${plan.featured ? 'text-indigo-100' : 'text-gray-600'}`}>
                {plan.description}
              </p>
              <ul className="mb-8 flex-1">
                {plan.features.map((feature, fIndex) => (
                  <li key={fIndex} className="mb-3 flex items-center">
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className={`h-5 w-5 mr-2 ${plan.featured ? 'text-indigo-200' : 'text-indigo-500'}`} 
                      viewBox="0 0 20 20" 
                      fill="currentColor"
                    >
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className={`${plan.featured ? 'text-indigo-100' : 'text-gray-600'}`}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
              <Link 
                href="/login" 
                className={`text-center py-3 px-4 rounded-lg font-medium transition-colors ${
                  plan.featured
                    ? 'bg-white text-indigo-600 hover:bg-gray-100'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                Choose Plan
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-indigo-600 to-blue-600 py-20 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to transform your voice experiences?</h2>
          <p className="text-xl mb-10 max-w-2xl mx-auto opacity-90">
            Get started with our platform and create intelligent voice applications in minutes.
          </p>
          <Link href="/register">
            <Button className="bg-white text-indigo-600 hover:bg-gray-100 px-8 py-6 rounded-full text-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl">
              Create Account
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 py-12 text-gray-600">
        <div className="container mx-auto px-4 text-center">
          <p>© {new Date().getFullYear()} Jingle.AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
