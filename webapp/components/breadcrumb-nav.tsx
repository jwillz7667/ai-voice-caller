"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

const routeLabels: Record<string, string> = {
  "/ai-dashboard": "AI Dashboard",
  "/recordings": "Recordings",
  "/logs": "Logs",
  "/settings": "Settings",
};

export default function BreadcrumbNav() {
  const pathname = usePathname();

  const pathSegments = pathname.split("/").filter(Boolean);

  const breadcrumbs = pathSegments.map((segment, index) => {
    const path = "/" + pathSegments.slice(0, index + 1).join("/");
    const label = routeLabels[path] || segment.charAt(0).toUpperCase() + segment.slice(1);
    return { path, label };
  });

  if (breadcrumbs.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center space-x-1 text-sm">
      <Link
        href="/ai-dashboard"
        className="flex items-center text-gray-500 hover:text-gray-700 transition-colors"
      >
        <Home className="h-4 w-4" />
        <span className="sr-only">Home</span>
      </Link>

      {breadcrumbs.map((crumb, index) => (
        <div key={crumb.path} className="flex items-center">
          <ChevronRight className="h-4 w-4 text-gray-400 mx-1" />
          {index === breadcrumbs.length - 1 ? (
            <span className="text-gray-900 font-medium">{crumb.label}</span>
          ) : (
            <Link
              href={crumb.path}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              {crumb.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}