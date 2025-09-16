import { Metadata } from "next";
import PricingHero from "@/components/pricing/PricingHero";
import PricingTiers from "@/components/pricing/PricingTiers";
import CostCalculator from "@/components/pricing/CostCalculator";
import PricingFAQ from "@/components/pricing/PricingFAQ";
import CTASection from "@/components/pricing/CTASection";
import Header from "@/components/marketing/Header";
import FooterSection from "@/components/marketing/FooterSection";

export const metadata: Metadata = {
  title: "Pricing - Verbio AI Voice Platform",
  description: "Simple, transparent pricing for AI voice intelligence. Pay as you grow with flexible plans.",
  openGraph: {
    title: "Verbio Pricing - Scale Your Voice AI",
    description: "Flexible pricing plans for businesses of all sizes",
    url: "https://verbio.app/pricing",
  },
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <PricingHero />
        <PricingTiers />
        <CostCalculator />
        <PricingFAQ />
        <CTASection />
      </main>
      <FooterSection />
    </div>
  );
}

