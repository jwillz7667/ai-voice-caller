import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/lib/theme-provider";
import { ToastProvider } from "@/lib/toast-provider";
import { AuthProvider } from "@/lib/auth-context";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Jingle.AI - Powered by OpenAI & Twilio",
  description: "An intelligent voice assistant using OpenAI's Realtime API and Twilio",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>
          <ThemeProvider defaultTheme="light" storageKey="jingle-theme-mode">
            <ToastProvider />
            {children}
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
