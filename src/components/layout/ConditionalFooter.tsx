"use client";

import { usePathname } from "next/navigation";

import { BharatCloudFooter } from "@/components/BharatCloudFooter";

export function ConditionalFooter() {
  const pathname = usePathname();
  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/settings")
  ) {
    return null;
  }
  return <BharatCloudFooter />;
}
