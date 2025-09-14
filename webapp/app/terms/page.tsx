import Navbar from "@/components/marketing/Navbar";
import Footer from "@/components/marketing/Footer";

export default function TermsPage() {
  return (
    <div>
      <Navbar />
      <section className="container mx-auto px-4 py-16 prose prose-slate max-w-3xl">
        <h1>Terms of Service</h1>
        <p>By using Verbio, you agree to these terms. Use the service responsibly and comply with Twilio and OpenAI policies.</p>
        <h2>Usage</h2>
        <p>No abuse, fraud, or unauthorized access. We may suspend accounts for violations.</p>
        <h2>Liability</h2>
        <p>Service is provided as-is with no guarantees; limitations apply as permitted by law.</p>
      </section>
      <Footer />
    </div>
  );
}

