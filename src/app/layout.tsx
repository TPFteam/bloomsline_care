import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/lib/providers/query-provider";
import { Toaster } from "sonner";
import { LanguageProvider } from "@/lib/i18n/context";
import { ThemeProvider } from "@/lib/theme/context";
import { FeedbackWrapper } from "@/components/feedback-wrapper";
import { CookieConsent } from "@/components/cookie-consent";
import { PostHogProvider } from "@/lib/analytics/posthog-provider";
import { BottomNavProvider } from "@/lib/contexts/bottom-nav-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bloomsline - Therapeutic Content Hub for Mental Health Practitioners",
  description: "Organize, create, and share therapeutic resources with ease. The comprehensive content hub designed for therapists, psychologists, and mental health professionals.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <PostHogProvider>
          <ThemeProvider>
            <LanguageProvider>
              <BottomNavProvider>
                <QueryProvider>{children}</QueryProvider>
              </BottomNavProvider>
              <FeedbackWrapper />
              <CookieConsent />
              <Toaster position="top-center" richColors />
            </LanguageProvider>
          </ThemeProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
