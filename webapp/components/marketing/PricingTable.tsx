import CardGlass from "./CardGlass";
import Link from "next/link";

const plans = [
  {
    name: "Starter",
    price: "$9",
    items: ["100 credits", "Basic analytics", "Email support"],
  },
  {
    name: "Pro",
    price: "$29",
    featured: true,
    items: ["1,000 credits", "Realtime events", "Priority support"],
  },
  {
    name: "Scale",
    price: "Contact",
    items: ["Custom limits", "SLA", "Dedicated support"],
  },
];

export default function PricingTable() {
  return (
    <section className="container mx-auto px-4 py-28 relative z-10 overflow-visible">
      <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-center mb-14">Simple, transparent pricing</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {plans.map((p) => (
          <CardGlass
            key={p.name}
            className={`p-6 ${p.featured ? "ring-2 ring-white/30" : ""}`}
          >
            <h3 className="text-lg font-semibold text-white">{p.name}</h3>
            <p className="mt-1 text-3xl font-extrabold text-white">{p.price}</p>
            <ul className="mt-4 space-y-2 text-sm text-blue-100">
              {p.items.map((it) => (
                <li key={it}>• {it}</li>
              ))}
            </ul>
            <Link
              href="/signup"
              className="mt-6 inline-flex items-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-gray-100"
            >
              Get started
            </Link>
          </CardGlass>
        ))}
      </div>
    </section>
  );
}
