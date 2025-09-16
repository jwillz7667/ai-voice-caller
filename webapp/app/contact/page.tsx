import { Metadata } from "next";
import Header from "@/components/marketing/Header";
import FooterSection from "@/components/marketing/FooterSection";
import ContactFormModern from "@/components/contact/ContactFormModern";

export const metadata: Metadata = {
  title: "Contact - Verbio AI Voice Platform",
  description: "Get in touch with our team to learn how Verbio can transform your voice operations.",
  openGraph: {
    title: "Contact Verbio",
    description: "Let's discuss your voice AI needs",
    url: "https://verbio.app/contact",
  },
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="pt-24">
        <ContactFormModern />
      </main>
      <FooterSection />
    </div>
  );
}

