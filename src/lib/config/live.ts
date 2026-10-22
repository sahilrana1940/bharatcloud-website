import { envFlagOn } from "@/lib/billing/upi";

/** Production billing UI — hide rehearsal scan / FAILED banners. Set NEXT_PUBLIC_LIVE=1 on Hostinger. */
export function isAppLive(): boolean {
  return (
    envFlagOn(process.env.NEXT_PUBLIC_LIVE) ||
    envFlagOn(process.env.LIVE) ||
    envFlagOn(process.env.NEXT_PUBLIC_BILLING_UPI_LIVE) ||
    envFlagOn(process.env.BILLING_UPI_LIVE)
  );
}

export function coveragePercent(activeIds: number, planLimit: number): number {
  if (planLimit <= 0) return 100;
  if (activeIds <= planLimit) return 100;
  return Math.min(100, Math.round((planLimit / activeIds) * 100));
}
