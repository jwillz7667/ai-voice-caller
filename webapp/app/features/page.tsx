import Navbar from "@/components/marketing/Navbar";
import Footer from "@/components/marketing/Footer";
import FeatureGrid from "@/components/marketing/FeatureGrid";

export default function FeaturesPage() {
  return (
    <div>
      <Navbar />
      <section className="container mx-auto px-4 pt-12">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Features</h1>
        <p className="mt-3 text-muted-foreground max-w-2xl">Everything you need to build world‑class voice experiences with OpenAI and Twilio.</p>
      </section>
      <FeatureGrid />
      <Footer />
    </div>
  );
}

