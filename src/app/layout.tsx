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
import { FloatingNotesProvider } from "@/lib/floating-notes/context";
import { FloatingNotesPanel } from "@/components/notes/FloatingNotesPanel";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bloomsline — A simpler way to manage your practice.",
  description: "Sessions, progress, and resources. All in one calm, organized space built for mental health practitioners.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
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
              <QueryProvider>
                <FloatingNotesProvider>
                  {children}
                  <FloatingNotesPanel />
                </FloatingNotesProvider>
              </QueryProvider>
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
