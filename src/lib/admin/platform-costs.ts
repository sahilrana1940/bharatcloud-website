/** Super-admin hosting & SaaS bill tracker (edit amounts/dates for your real invoices). */

export type CostLine = {
  vendor: string;
  purpose: string;
  amountInr: number;
  /** Day of month payment is usually due (1–28) */
  dueDayOfMonth: number;
  billingUrl?: string;
};

import { listSuperAdminEmails } from "@/lib/brand";

export const SUPER_ADMIN_PLATFORM_EMAILS = listSuperAdminEmails();

/** Approximate monthly infra — update when you get real invoices. */
export const PLATFORM_COST_LINES: CostLine[] = [
  {
    vendor: "Vercel",
    purpose: "Next.js hosting (bharatcloud.store)",
    amountInr: 1700,
    dueDayOfMonth: 1,
    billingUrl: "https://vercel.com/dashboard",
  },
  {
    vendor: "Supabase",
    purpose: "Postgres + auth + API",
    amountInr: 2000,
    dueDayOfMonth: 5,
    billingUrl: "https://supabase.com/dashboard",
  },
  {
    vendor: "Wasabi",
    purpose: "S3 archive bucket (drive backups)",
    amountInr: 800,
    dueDayOfMonth: 10,
    billingUrl: "https://console.wasabisys.com",
  },
  {
    vendor: "Hostinger / domain",
    purpose: "Domain + DNS (bharatcloud.store)",
    amountInr: 900,
    dueDayOfMonth: 15,
  },
  {
    vendor: "Google Cloud",
    purpose: "OAuth / Drive API (low usage)",
    amountInr: 0,
    dueDayOfMonth: 28,
  },
  {
    vendor: "Razorpay",
    purpose: "Payment gateway (per transaction, not fixed)",
    amountInr: 0,
    dueDayOfMonth: 1,
  },
];

export function nextDueDate(dueDayOfMonth: number, from = new Date()): Date {
  const day = Math.min(28, Math.max(1, dueDayOfMonth));
  const d = new Date(from.getFullYear(), from.getMonth(), day);
  if (d < from) {
    return new Date(from.getFullYear(), from.getMonth() + 1, day);
  }
  return d;
}

export function monthlyTotalInr(): number {
  return PLATFORM_COST_LINES.reduce((s, l) => s + l.amountInr, 0);
}

/** E2E Mumbai object storage. Bill is usage × rate, not a flat line. */
export const E2E_RATES = {
  hotPerGb: 20,
  coldPerGb: 6,
  hotShare: 0.2,
  coldShare: 0.8,
  hostingInr: 1700,
  previousBillInr: 3700,
} as const;

/** hot GB = total × 0.2 at Rs 20, cold GB = total × 0.8 at Rs 6. */
export function calculateBill(totalGB: number): number {
  const gb = Number.isFinite(totalGB) ? Math.max(0, totalGB) : 0;
  const hot = gb * E2E_RATES.hotShare;
  const cold = gb * E2E_RATES.coldShare;
  return hot * E2E_RATES.hotPerGb + cold * E2E_RATES.coldPerGb;
}

export function platformTotalInr(storageGb: number): number {
  return E2E_RATES.hostingInr + calculateBill(storageGb);
}
