import { Phone, Bot, Signal, Zap, Shield, Workflow } from "lucide-react";
import CardGlass from "./CardGlass";

const features = [
  { icon: Phone, title: "Natural Calls", desc: "Inbound and outbound with human‑like latency." },
  { icon: Bot, title: "LLM Tools", desc: "Function calling and retrieval during live calls." },
  { icon: Signal, title: "Twilio Ready", desc: "Webhook and SIP integrations out of the box." },
  { icon: Zap, title: "Real‑time", desc: "Streaming transcripts and events for instant reactions." },
  { icon: Workflow, title: "Workflows", desc: "Compose flows for IVR, routing, and follow‑ups." },
  { icon: Shield, title: "Secure", desc: "Best practices for auth, secrets, and PII handling." },
];

export default function FeatureGrid() {
  return (
    <section className="relative z-10 overflow-visible">
      <div className="container mx-auto px-4 py-32 overflow-visible">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-center mb-14">Powerful Features</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 relative overflow-visible pt-6">
        {features.map((f) => (
          <CardGlass key={f.title} className="p-6">
            <div className="flex items-center gap-3">
              <f.icon className="h-6 w-6 text-white" />
              <h3 className="font-semibold text-white">{f.title}</h3>
            </div>
            <p className="mt-3 text-sm text-blue-100">{f.desc}</p>
          </CardGlass>
        ))}
        </div>
      </div>
    </section>
  );
}
