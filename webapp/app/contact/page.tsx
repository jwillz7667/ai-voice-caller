import Navbar from "@/components/marketing/Navbar";
import Footer from "@/components/marketing/Footer";
import ContactForm from "@/components/marketing/ContactForm";

export default function ContactPage() {
  return (
    <div>
      <Navbar />
      <section className="container mx-auto px-4 py-16">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Contact</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">Tell us about your use case and we’ll follow up quickly.</p>
        <div className="mt-8">
          <ContactForm />
        </div>
      </section>
      <Footer />
    </div>
  );
}

