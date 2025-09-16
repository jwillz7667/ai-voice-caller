"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

interface GoogleSignInButtonProps {
  className?: string;
  onSuccess?: (user: any) => void;
}

export function GoogleSignInButton({ className, onSuccess }: GoogleSignInButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);

      // Call the Google OAuth endpoint
      const response = await fetch("/api/auth/google", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to sign in with Google");
      }

      // Redirect to Google OAuth URL
      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        // Handle successful authentication
        toast.success("Successfully signed in with Google!");
        if (onSuccess) {
          onSuccess(data.user);
        }
        router.push("/ai-dashboard");
      }
    } catch (error: any) {
      console.error("Google sign-in error:", error);
      toast.error(error.message || "Failed to sign in with Google");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleGoogleSignIn}
      disabled={loading}
      variant="outline"
      className={className}
    >
      <svg
        className="mr-2 h-4 w-4"
        aria-hidden="true"
        focusable="false"
        data-prefix="fab"
        data-icon="google"
        role="img"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 488 512"
      >
        <path
          fill="currentColor"
          d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
        />
      </svg>
      {loading ? "Signing in..." : "Continue with Google"}
    </Button>
  );
}