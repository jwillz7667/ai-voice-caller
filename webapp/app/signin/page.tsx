"use client";

import CustomLoginForm from "@/components/auth/CustomLoginForm";
import Link from "next/link";

export default function SigninPage() {
  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-indigo-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-950 dark:to-indigo-950">
      <div className="w-full max-w-md rounded-2xl border border-white/20 bg-white/60 p-6 shadow-xl backdrop-blur dark:bg-white/10">
        <h1 className="text-2xl font-bold tracking-tight">Sign in to Verbio</h1>
        <p className="mt-1 text-sm text-muted-foreground">Welcome back. We’re glad you’re here.</p>
        <div className="mt-6">
          <CustomLoginForm />
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          New here? <Link href="/signup" className="font-medium text-primary hover:underline">Create an account</Link>
        </p>
      </div>
    </div>
  );
}

