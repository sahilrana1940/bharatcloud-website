import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "BharatCloud.store — Secure Cloud Storage for Teams in India",
  description:
    "Enterprise-grade cloud storage with data residency in India, encryption, and 99.9% uptime SLA.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} antialiased font-[family-name:var(--font-geist-sans)]`}>
        {children}
      </body>
    </html>
  );
}
