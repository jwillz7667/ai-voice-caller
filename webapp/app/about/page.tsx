import { Metadata } from "next";
import AboutHero from "@/components/about/AboutHero";
import MissionSection from "@/components/about/MissionSection";
import TeamSection from "@/components/about/TeamSection";
import ValuesSection from "@/components/about/ValuesSection";
import TimelineSection from "@/components/about/TimelineSection";
import JoinUsSection from "@/components/about/JoinUsSection";
import Header from "@/components/marketing/Header";
import FooterSection from "@/components/marketing/FooterSection";

export const metadata: Metadata = {
  title: "About - Verbio AI Voice Platform",
  description: "Learn about Verbio's mission to revolutionize voice communication with AI technology.",
  openGraph: {
    title: "About Verbio - Our Story",
    description: "Building the future of voice intelligence",
    url: "https://verbio.app/about",
  },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <AboutHero />
        <MissionSection />
        <ValuesSection />
        <TimelineSection />
        <TeamSection />
        <JoinUsSection />
      </main>
      <FooterSection />
    </div>
  );
}

