import Navbar from "@/components/marketing/Navbar";
import Hero from "@/components/marketing/Hero";
import FeatureGrid from "@/components/marketing/FeatureGrid";
import UseCaseCarousel from "@/components/marketing/UseCaseCarousel";
import Testimonials from "@/components/marketing/Testimonials";
import PricingTable from "@/components/marketing/PricingTable";
import CTA from "@/components/marketing/CTA";
import Footer from "@/components/marketing/Footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <UseCaseCarousel />
      <FeatureGrid />
      <Testimonials />
      <PricingTable />
      <CTA />
      <Footer />
    </div>
  );
}
