import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { BharatCloudFooter } from "@/components/BharatCloudFooter";
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
  title: "BharatCloud.store — Business cloud for India",
  description:
    "Apna Business Cloud, India me safe. Team storage and admin for Indian companies.",
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
