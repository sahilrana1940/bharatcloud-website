export type SaasPlanId = "free" | "starter" | "growth" | "enterprise";

export const GB = 1024 ** 3;

export const SAAS_PLANS = {
  free: {
    id: "free" as const,
    name: "Free trial",
    priceInr: 0,
    maxUsers: 3,
    storageGb: 10,
    storageBytes: 10 * GB,
    cta: "Start Free Trial",
  },
  starter: {
    id: "starter" as const,
    name: "Starter",
    priceInr: 999,
    maxUsers: 10,
    storageGb: 100,
    storageBytes: 100 * GB,
    cta: "Get Starter",
  },
  growth: {
    id: "growth" as const,
    name: "Growth",
    priceInr: 2999,
    maxUsers: 50,
    storageGb: 500,
    storageBytes: 500 * GB,
    popular: true,
    cta: "Get Growth",
  },
  enterprise: {
    id: "enterprise" as const,
    name: "Enterprise",
    priceInr: null,
    maxUsers: null,
    storageGb: 2048,
    storageBytes: 2048 * GB,
    cta: "Contact sales",
  },
};

export const BRAND_ORANGE = "#ff6a00";

export function formatStorageGb(bytes: number): string {
  const gb = bytes / GB;
  if (gb < 1) return `${Math.round(bytes / (1024 ** 2))} MB`;
  return `${Math.round(gb * 10) / 10} GB`;
}

export function planLabel(plan: string): string {
  const p = SAAS_PLANS[plan as SaasPlanId];
  return p?.name ?? plan;
}
