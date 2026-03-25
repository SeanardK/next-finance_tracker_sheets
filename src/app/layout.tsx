import { ClerkProvider } from "@clerk/nextjs";
import { ColorSchemeScript } from "@mantine/core";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegistration } from "../components/ServiceWorkerRegistration";
import { Providers } from "../provider/main";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Finance Tracker – Personal Finance with Google Sheets",
    template: "%s | Finance Tracker",
  },
  description:
    "Track your personal finances across multiple accounts stored in Google Sheets. Powered by Clerk auth.",
  openGraph: {
    type: "website",
    siteName: "Finance Tracker",
    title: "Finance Tracker – Personal Finance with Google Sheets",
    description: "Multi-user finance tracker backed by Google Sheets.",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Finance Tracker",
    description: "Multi-user finance tracker backed by Google Sheets.",
    images: ["/og-image.png"],
  },
  manifest: "/manifest.json",
};

export const mantineHtmlProps = {
  suppressHydrationWarning: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
        {...mantineHtmlProps}
      >
        <head>
          <ColorSchemeScript localStorageKey="fintrack-color-scheme" />
          <meta name="theme-color" content="#7950f2" />
        </head>
        <body className="min-h-full flex flex-col">
          <ServiceWorkerRegistration />
          <Providers>{children}</Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
