"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import CardGlass from "./CardGlass";

const useCases = [
  {
    title: "Inbound Support",
    desc: "Triage, route, and resolve with an AI receptionist.",
  },
  {
    title: "Outbound Campaigns",
    desc: "Proactive outreach, surveys, and appointment reminders.",
  },
  {
    title: "Agent Assist",
    desc: "Real‑time notes, suggestions, and tool execution.",
  },
  {
    title: "Voice API",
    desc: "Embed calling into your product with simple APIs.",
  },
];

export default function UseCaseCarousel() {
  return (
    <section className="relative z-10 overflow-visible">
      <div className="container mx-auto px-4 py-32 overflow-visible">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-center mb-14">Use Cases</h2>
        <div className="relative overflow-visible pt-8">
        <Swiper
          modules={[Pagination]}
          pagination={{ clickable: true }}
          spaceBetween={16}
          slidesPerView={1}
          breakpoints={{
            640: { slidesPerView: 1.2 },
            768: { slidesPerView: 2 },
            1024: { slidesPerView: 3 },
          }}
        >
        {useCases.map((c) => (
          <SwiperSlide key={c.title}>
            <CardGlass className="p-6 h-full">
              <h3 className="font-semibold text-lg text-white">{c.title}</h3>
              <p className="mt-2 text-sm text-blue-100">{c.desc}</p>
            </CardGlass>
          </SwiperSlide>
        ))}
      </Swiper>
      </div>
      </div>
    </section>
  );
}
