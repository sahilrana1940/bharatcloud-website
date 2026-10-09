export type PlanId = "starter" | "standard" | "business";

export const GB = 1024 ** 3;
export const GST_RATE = 0.18;

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
    priceInr: 999,
    maxUsers: 5,
    storageGb: 100,
    storageBytes: 100 * GB,
    badge: "popular",
  },
  standard: {
    id: "standard",
    name: "Standard",
    priceInr: 2199,
    maxUsers: 10,
    storageGb: 500,
    storageBytes: 500 * GB,
  },
  business: {
    id: "business",
    name: "Business",
    priceInr: 3499,
    maxUsers: 20,
    storageGb: 1024,
    storageBytes: 1024 * GB,
    badge: "business",
  },
};

export function planById(id: string) {
  return PRICING_PLANS[id as PlanId] ?? null;
}

export function withGst(amount: number) {
  return Math.round(amount * (1 + GST_RATE));
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
