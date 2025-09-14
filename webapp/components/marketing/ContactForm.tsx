"use client";

import { useState } from "react";

export default function ContactForm() {
  const [status, setStatus] = useState<string | null>(null);
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("Thanks! We'll be in touch.");
  };
  return (
    <form onSubmit={onSubmit} className="space-y-4 max-w-xl">
      <input required placeholder="Name" className="w-full rounded-lg border bg-white/70 p-3 backdrop-blur" />
      <input required type="email" placeholder="Email" className="w-full rounded-lg border bg-white/70 p-3 backdrop-blur" />
      <textarea required placeholder="How can we help?" className="w-full rounded-lg border bg-white/70 p-3 backdrop-blur h-32" />
      <button className="rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90">Send</button>
      {status && <p className="text-sm text-green-600">{status}</p>}
    </form>
  );
}

