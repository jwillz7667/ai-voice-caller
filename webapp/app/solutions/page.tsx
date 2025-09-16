import { Metadata } from "next";
import Header from "@/components/marketing/Header";
import FooterSection from "@/components/marketing/FooterSection";

export const metadata: Metadata = {
  title: "Solutions - Verbio AI Voice Platform",
  description: "Tailored voice AI solutions for support, sales, operations, and product experiences.",
};

export default function SolutionsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="pt-32 pb-20">
        <section className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 mb-4">Solutions</h1>
          <p className="text-xl text-gray-600 max-w-2xl mb-12">Tailored voice AI flows for support, sales, operations, and product experiences.</p>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl">
            <div className="p-6 rounded-2xl bg-white shadow-lg border border-gray-100">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Customer Support</h3>
              <p className="text-gray-600">24/7 intelligent support that resolves issues instantly</p>
            </div>
            <div className="p-6 rounded-2xl bg-white shadow-lg border border-gray-100">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Sales Automation</h3>
              <p className="text-gray-600">Qualify leads and book meetings automatically</p>
            </div>
            <div className="p-6 rounded-2xl bg-white shadow-lg border border-gray-100">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Operations</h3>
              <p className="text-gray-600">Streamline internal processes with voice AI</p>
            </div>
          </div>
        </section>
      </main>
      <FooterSection />
    </div>
  );
}

