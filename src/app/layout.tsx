import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { BharatCloudFooter } from "@/components/BharatCloudFooter";
import { BRAND_DOMAIN, BRAND_TAGLINE } from "@/lib/brand";
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
  title: `${BRAND_TAGLINE}`,
  description:
    "Apna Business Cloud, India me safe. Team backup and vault for Indian companies — Bharat Tijori.",
  metadataBase: new URL(`https://www.${BRAND_DOMAIN}`),
  openGraph: {
    title: BRAND_TAGLINE,
    siteName: BRAND_TAGLINE,
    url: `https://www.${BRAND_DOMAIN}`,
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
        <div className="flex min-h-screen flex-col">
          <div className="flex-1">{children}</div>
          <BharatCloudFooter />
        </div>
      </body>
    </html>
  );
}
