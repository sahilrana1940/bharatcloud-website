/** Super-admin hosting & SaaS bill tracker (edit amounts/dates for your real invoices). */

export type CostLine = {
  vendor: string;
  purpose: string;
  amountInr: number;
  /** Day of month payment is usually due (1–28) */
  dueDayOfMonth: number;
  billingUrl?: string;
};

export const SUPER_ADMIN_PLATFORM_EMAILS = [
  "admin@bharatcloud.store",
  "sahilrana1940@gmail.com",
] as const;

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
