import { Metadata } from "next";
import Header from "@/components/marketing/Header";
import HeroSection from "@/components/marketing/HeroSection";
import HowItWorks from "@/components/marketing/HowItWorks";
import Features from "@/components/marketing/Features";
import DemoSection from "@/components/marketing/DemoSection";
import TestimonialsSection from "@/components/marketing/TestimonialsSection";
import FooterSection from "@/components/marketing/FooterSection";

export const metadata: Metadata = {
  title: "Verbio - AI-Powered Voice Intelligence Platform",
  description: "Power inbound and outbound conversations 24/7 with our low-latency, natural AI voice platform that integrates seamlessly and scales effortlessly.",
  keywords: "AI voice, voice intelligence, call center AI, conversational AI, voice automation",
  openGraph: {
    title: "Verbio - AI-Powered Voice Intelligence Platform",
    description: "Transform your customer experience with AI voice intelligence",
    url: "https://verbio.app",
    siteName: "Verbio",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Verbio - AI Voice Intelligence",
    description: "Transform your customer experience with AI voice intelligence",
    images: ["/og-image.png"],
  },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <HeroSection />
        <HowItWorks />
        <Features />
        <DemoSection />
        <TestimonialsSection />
      </main>
      <FooterSection />
    </div>
  );
}