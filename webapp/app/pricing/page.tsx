import Navbar from "@/components/marketing/Navbar";
import Footer from "@/components/marketing/Footer";
import PricingTable from "@/components/marketing/PricingTable";

export default function PricingPage() {
  return (
    <div>
      <Navbar />
      <section className="container mx-auto px-4 pt-12">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Pricing</h1>
        <p className="mt-3 text-muted-foreground max-w-2xl">Flexible plans for solo builders to enterprises. Pay for credits; scale as you grow.</p>
      </section>
      <PricingTable />
      <Footer />
    </div>
  );
}

