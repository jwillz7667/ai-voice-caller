"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/features", label: "Features" },
  { href: "/solutions", label: "Solutions" },
  { href: "/pricing", label: "Pricing" },
  { href: "/docs", label: "Docs" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <header
      className={
        isHome
          ? "sticky top-0 z-40 w-full border-b border-blue-700 bg-blue-700"
          : "sticky top-0 z-40 w-full border-b border-white/10 bg-white/70 backdrop-blur-xl dark:bg-black/40"
      }
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link
          href="/"
          className={`font-bold tracking-tight text-lg ${isHome ? "text-white" : ""}`}
        >
          Verbio
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={
                isHome
                  ? `${pathname === l.href ? "text-white" : "text-white/80 hover:text-white"} transition-colors`
                  : `transition-colors hover:text-primary ${
                      pathname === l.href ? "text-foreground" : "text-muted-foreground"
                    }`
              }
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/signin"
            className={
              isHome
                ? "hidden md:inline-flex h-9 items-center rounded-lg border border-white/30 bg-white/10 px-4 text-sm font-medium text-white shadow-sm hover:bg-white/20"
                : "hidden md:inline-flex h-9 items-center rounded-lg border border-white/20 bg-white/40 px-4 text-sm font-medium text-foreground shadow-sm backdrop-blur hover:bg-white/60"
            }
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className={
              isHome
                ? "inline-flex h-9 items-center rounded-lg bg-white px-4 text-sm font-semibold text-blue-700 shadow hover:bg-gray-100"
                : "inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90"
            }
          >
            Start free
          </Link>
        </div>
      </div>
    </header>
  );
}
