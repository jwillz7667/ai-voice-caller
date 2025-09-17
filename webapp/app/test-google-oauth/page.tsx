"use client";

import { useState } from "react";
import { GoogleSignInButton } from "@/components/auth/google-signin-button";

export default function TestGoogleOAuth() {
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string>("");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Test Google OAuth
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Click the button below to test Google sign-in
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <GoogleSignInButton
            className="w-full"
            onSuccess={(user) => {
              setStatus(`Successfully signed in as ${user.email}`);
              setError("");
            }}
          />

          {status && (
            <div className="rounded-md bg-green-50 p-4">
              <div className="text-sm text-green-800">{status}</div>
            </div>
          )}

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}
        </div>

        <div className="mt-6 border-t pt-6">
          <h3 className="text-sm font-medium text-gray-900">Debug Info:</h3>
          <ul className="mt-2 text-xs text-gray-600 space-y-1">
            <li>• Server running on: http://localhost:3000</li>
            <li>• OAuth endpoint: /api/auth/google</li>
            <li>• Callback URL: /api/auth/google/callback</li>
            <li>• Check console for debug logs</li>
          </ul>
        </div>

        <div className="mt-6 border-t pt-6">
          <h3 className="text-sm font-medium text-gray-900">Troubleshooting:</h3>
          <ol className="mt-2 text-xs text-gray-600 space-y-1 list-decimal list-inside">
            <li>Open browser DevTools (F12) and check Console tab</li>
            <li>Click the Google sign-in button</li>
            <li>Check for any errors in the console</li>
            <li>Check Network tab for API calls to /api/auth/google</li>
            <li>Verify redirect to Google OAuth page</li>
            <li>After Google auth, check callback handling</li>
          </ol>
        </div>
      </div>
    </div>
  );
}