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
import { PostHogIdentify } from "@/lib/analytics/posthog-identify";
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
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
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
          <PostHogIdentify />
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
              <Toaster
                position="bottom-right"
                duration={3000}
                closeButton
                toastOptions={{
                  style: {
                    background: '#1a1a1a',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '14px',
                    fontSize: '14px',
                    padding: '16px 20px',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
                    minWidth: '320px',
                  },
                  classNames: {
                    success: '!bg-[#4A9A86] !text-white',
                    error: '!bg-[#ef4444] !text-white',
                    info: '!bg-[#3b82f6] !text-white',
                    warning: '!bg-[#f59e0b] !text-white',
                  },
                  actionButtonStyle: {
                    background: 'rgba(255,255,255,0.2)',
                    color: '#fff',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '600',
                    padding: '6px 14px',
                    border: '1px solid rgba(255,255,255,0.3)',
                  },
                  cancelButtonStyle: {
                    background: 'transparent',
                    color: 'rgba(255,255,255,0.7)',
                    fontSize: '13px',
                  },
                }}
              />
            </LanguageProvider>
          </ThemeProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
