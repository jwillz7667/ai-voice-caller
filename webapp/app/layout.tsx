import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/lib/theme-provider";
import { ToastProvider } from "@/lib/toast-provider";
import { AuthProvider } from "@/lib/auth-context";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Verbio - AI Voice Call Solutions",
  description: "AI-powered inbound and outbound voice calling with OpenAI Realtime and Twilio.",
  openGraph: {
    title: "Verbio - AI Voice Call Solutions",
    description:
      "AI-powered inbound and outbound voice calling with OpenAI Realtime and Twilio.",
    type: "website",
  },
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
          <ThemeProvider defaultTheme="light" storageKey="verbio-theme-mode">
            <ToastProvider />
            {children}
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
