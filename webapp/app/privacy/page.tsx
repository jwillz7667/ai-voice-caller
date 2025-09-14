import Navbar from "@/components/marketing/Navbar";
import Footer from "@/components/marketing/Footer";

export default function PrivacyPage() {
  return (
    <div>
      <Navbar />
      <section className="container mx-auto px-4 py-16 prose prose-slate max-w-3xl">
        <h1>Privacy Policy</h1>
        <p>We respect your privacy. We collect only the data required to provide our service and never sell personal information.</p>
        <h2>Data</h2>
        <p>Account data, usage events, and call metadata are processed for functionality, billing, and security.</p>
        <h2>Contact</h2>
        <p>Questions? Email privacy@verbio.example</p>
      </section>
      <Footer />
    </div>
  );
}

