"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";
import CardGlass from "./CardGlass";

export default function Testimonials() {
  const items = [
    { quote: "Verbio cut our call handling time by 40%.", author: "COO, Fintech" },
    { quote: "Integration took hours, not weeks.", author: "CTO, Healthcare" },
    { quote: "The voice quality is stunning.", author: "Head of CX, SaaS" },
  ];

  return (
    <section className="container mx-auto px-4 py-32 relative z-10 overflow-visible">
      <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-center mb-14">What customers say</h2>
      <Swiper modules={[Autoplay]} autoplay={{ delay: 3000 }} spaceBetween={16} slidesPerView={1.1} loop>
        {items.map((t, i) => (
          <SwiperSlide key={i}>
            <CardGlass className="p-6">
              <p className="text-lg text-white">“{t.quote}”</p>
              <p className="mt-3 text-sm text-blue-100">{t.author}</p>
            </CardGlass>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}
