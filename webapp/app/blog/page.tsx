import { Metadata } from "next";
import BlogHero from "@/components/blog/BlogHero";
import BlogGrid from "@/components/blog/BlogGrid";
import BlogCategories from "@/components/blog/BlogCategories";
import NewsletterSection from "@/components/blog/NewsletterSection";
import Header from "@/components/marketing/Header";
import FooterSection from "@/components/marketing/FooterSection";

export const metadata: Metadata = {
  title: "Blog - Verbio AI Voice Platform",
  description: "Insights, tutorials, and updates from the Verbio team about AI voice technology.",
  openGraph: {
    title: "Verbio Blog - Voice AI Insights",
    description: "Learn about the latest in voice AI technology",
    url: "https://verbio.app/blog",
  },
};

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <BlogHero />
        <BlogCategories />
        <BlogGrid />
        <NewsletterSection />
      </main>
      <FooterSection />
    </div>
  );
}