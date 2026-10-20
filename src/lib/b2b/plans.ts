import { ADMIN, EMP, EXTRA, GST } from "@/lib/billing/plans";

export type PlanId = "starter" | "growth" | "enterprise" | "standard" | "business";

export const GB = 1024 ** 3;
export { ADMIN, EMP, EXTRA, GST };
export const GST_RATE = GST;

export const PRICING_PLANS: Record<
  PlanId,
  {
    id: PlanId;
    name: string;
    priceInr: number;
    maxUsers: number;
    storageGb: number;
    storageBytes: number;
    badge?: "popular" | "business";
  }
> = {
  starter: {
    id: "starter",
    name: "Starter",
    priceInr: 5999,
    maxUsers: 5,
    storageGb: 100,
    storageBytes: 100 * GB,
  },
  growth: {
    id: "growth",
    name: "Growth",
    priceInr: 24999,
    maxUsers: 25,
    storageGb: 500,
    storageBytes: 500 * GB,
    badge: "popular",
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    priceInr: 39999,
    maxUsers: 0,
    storageGb: 2048,
    storageBytes: 2048 * GB,
  },
  standard: {
    id: "standard",
    name: "Growth",
    priceInr: 24999,
    maxUsers: 25,
    storageGb: 500,
    storageBytes: 500 * GB,
    badge: "popular",
  },
  business: {
    id: "business",
    name: "Enterprise",
    priceInr: 39999,
    maxUsers: 0,
    storageGb: 2048,
    storageBytes: 2048 * GB,
  },
};

export function planById(id: string) {
  return PRICING_PLANS[id as PlanId] ?? null;
}

export function withGst(amount: number) {
  return Math.round(amount * (1 + GST));
}

export function gstAmount(amount: number) {
  return Math.round(amount * GST_RATE);
}

/** @deprecated use PRICING_PLANS */
export const SAAS_PLANS = PRICING_PLANS;
export type SaasPlanId = PlanId;
export const BRAND_ORANGE = "#ff6a00";

export function formatStorageGb(bytes: number): string {
  const gb = bytes / GB;
  if (gb < 1) return `${Math.round(bytes / 1024 ** 2)} MB`;
  return `${Math.round(gb * 10) / 10} GB`;
}

export function planLabel(plan: string): string {
  const p = PRICING_PLANS[plan as PlanId];
  return p?.name ?? plan;
}
