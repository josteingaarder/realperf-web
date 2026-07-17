import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.realperf.ai"),
  title: {
    default: "RealPerf.ai",
    template: "%s | RealPerf.ai",
  },
  description: "AI accelerator database for comparing cloud and edge chips with specs, benchmarks, pricing, and saved collections.",
  applicationName: "RealPerf.ai",
  icons: {
    icon: "/icon",
    apple: "/apple-icon",
  },
  keywords: [
    "AI chip",
    "GPU benchmark",
    "AI accelerator",
    "cloud chips",
    "edge AI",
    "hardware comparison",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
