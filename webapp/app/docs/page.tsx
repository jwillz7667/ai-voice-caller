import Navbar from "@/components/marketing/Navbar";
import Footer from "@/components/marketing/Footer";

export default function DocsPage() {
  return (
    <div>
      <Navbar />
      <section className="container mx-auto px-4 py-16">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Docs Overview</h1>
        <p className="mt-3 text-muted-foreground max-w-2xl">Get started quickly. Explore auth, Twilio webhooks, and OpenAI Realtime integration.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <a className="rounded-xl border bg-white/70 p-5 backdrop-blur hover:bg-white" href="#">Quickstart →</a>
          <a className="rounded-xl border bg-white/70 p-5 backdrop-blur hover:bg-white" href="#">Webhooks →</a>
          <a className="rounded-xl border bg-white/70 p-5 backdrop-blur hover:bg-white" href="#">Realtime API →</a>
          <a className="rounded-xl border bg-white/70 p-5 backdrop-blur hover:bg-white" href="#">Components →</a>
        </div>
      </section>
      <Footer />
    </div>
  );
}

