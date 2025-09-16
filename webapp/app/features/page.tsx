import { Metadata } from "next";
import Header from "@/components/marketing/Header";
import FooterSection from "@/components/marketing/FooterSection";
import Features from "@/components/marketing/Features";

export const metadata: Metadata = {
  title: "Features - Verbio AI Voice Platform",
  description: "Everything you need to build world-class voice experiences with OpenAI and Twilio.",
};

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="pt-24">
        <Features />
      </main>
      <FooterSection />
    </div>
  );
}

