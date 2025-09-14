"use client";

import ClientLayout from "@/components/client-layout";
import { useAuth } from "@/lib/auth-context";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AppSectionLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/signin");
  }, [loading, user, router]);

  if (loading) return <div className="p-6">Loading…</div>;
  if (!user) return null;
  if (user && user.emailVerified === false) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold">Verify your email</h1>
          <p className="mt-2 text-muted-foreground">Please verify your email address to access the app.</p>
        </div>
      </div>
    );
  }

  return <ClientLayout>{children}</ClientLayout>;
}

