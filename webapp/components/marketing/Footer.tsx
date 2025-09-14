import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-white/60 backdrop-blur dark:bg-black/40">
      <div className="container mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Verbio. All rights reserved.</p>
          <nav className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground">Terms</Link>
            <a href="https://twitter.com" target="_blank" rel="noreferrer" className="hover:text-foreground">Twitter</a>
          </nav>
        </div>
      </div>
    </footer>
  );
}

