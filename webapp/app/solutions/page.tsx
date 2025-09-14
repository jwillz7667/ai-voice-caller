import Navbar from "@/components/marketing/Navbar";
import Footer from "@/components/marketing/Footer";
import UseCaseCarousel from "@/components/marketing/UseCaseCarousel";

export default function SolutionsPage() {
  return (
    <div>
      <Navbar />
      <section className="container mx-auto px-4 pt-12">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Solutions</h1>
        <p className="mt-3 text-muted-foreground max-w-2xl">Tailored voice LLM flows for support, sales, operations, and product experiences.</p>
      </section>
      <UseCaseCarousel />
      <Footer />
    </div>
  );
}

