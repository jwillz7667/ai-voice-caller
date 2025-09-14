import Navbar from "@/components/marketing/Navbar";
import Footer from "@/components/marketing/Footer";

export default function AboutPage() {
  return (
    <div>
      <Navbar />
      <section className="container mx-auto px-4 py-16">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">About Verbio</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">We’re a team of engineers and designers building the next generation of AI voice experiences. Our mission is simple: make every conversation efficient, natural, and delightful.</p>
      </section>
      <Footer />
    </div>
  );
}

