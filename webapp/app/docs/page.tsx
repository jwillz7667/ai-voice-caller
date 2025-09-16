import { Metadata } from "next";
import Header from "@/components/marketing/Header";
import FooterSection from "@/components/marketing/FooterSection";

export const metadata: Metadata = {
  title: "Documentation - Verbio AI Voice Platform",
  description: "Complete documentation for integrating and using Verbio's AI voice platform.",
};

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="pt-32 pb-20">
        <section className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 mb-4">Documentation</h1>
          <p className="text-xl text-gray-600 max-w-2xl mb-12">Get started quickly. Explore auth, Twilio webhooks, and OpenAI Realtime integration.</p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 max-w-6xl">
            <a className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg hover:shadow-xl hover:border-blue-500 transition-all group" href="#">
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 mb-2">Quickstart →</h3>
              <p className="text-sm text-gray-600">Get up and running in 5 minutes</p>
            </a>
            <a className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg hover:shadow-xl hover:border-blue-500 transition-all group" href="#">
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 mb-2">Webhooks →</h3>
              <p className="text-sm text-gray-600">Configure Twilio webhooks</p>
            </a>
            <a className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg hover:shadow-xl hover:border-blue-500 transition-all group" href="#">
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 mb-2">Realtime API →</h3>
              <p className="text-sm text-gray-600">OpenAI integration guide</p>
            </a>
            <a className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg hover:shadow-xl hover:border-blue-500 transition-all group" href="#">
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 mb-2">Components →</h3>
              <p className="text-sm text-gray-600">UI component library</p>
            </a>
          </div>
        </section>
      </main>
      <FooterSection />
    </div>
  );
}

