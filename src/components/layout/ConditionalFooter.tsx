"use client";

import { usePathname } from "next/navigation";

import { BharatCloudFooter } from "@/components/BharatCloudFooter";

const HIDE_PREFIXES = [
  "/dashboard",
  "/admin",
  "/settings",
  "/login",
  "/signup",
  "/recover",
  "/checkout",
];

export function ConditionalFooter() {
  const pathname = usePathname();
  if (HIDE_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return null;
  }
  return <BharatCloudFooter />;
}
