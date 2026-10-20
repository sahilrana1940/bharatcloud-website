import { billingUpiPayee, isBillingUpiLive } from "@/lib/billing/upi-live";

/** Seat add-ons. GST is 0 — yearly plans are inclusive. */
export const ADMIN = 199;
export const EMP = 49;
export const EXTRA = 99;
export const GST = 0;

export type BillingPlanId = "starter" | "growth" | "scale" | "enterprise" | "standard" | "business";

export type BillingPlan = {
  id: BillingPlanId;
  name: string;
  price: number;
  users: string;
  storage: string;
  storageGb: number;
  tag: string;
};

export const BILLING_PLANS: BillingPlan[] = [
  {
    id: "starter",
    name: "STARTER",
    price: 5999,
    users: "5 Users (Manual Approval)",
    storage: "100GB Total Storage",
    storageGb: 100,
    tag: "",
  },
  {
    id: "growth",
    name: "GROWTH",
    price: 24999,
    users: "25 Users (Auto)",
    storage: "500GB Total Storage",
    storageGb: 500,
    tag: "MOST POPULAR",
  },
  {
    id: "scale",
    name: "ENTERPRISE",
    price: 39999,
    users: "Unlimited (Auto)",
    storage: "2TB Total Storage",
    storageGb: 2048,
    tag: "",
  },
];

export function getBillingPlan(id: string | undefined): BillingPlan {
  const key =
    id === "standard" || id === "growth"
      ? "growth"
      : id === "business" || id === "enterprise" || id === "scale"
        ? "scale"
        : id;
  const found = BILLING_PLANS.find((p) => p.id === key);
  return found ?? BILLING_PLANS[0];
}

export function planFromAmount(amount: number): BillingPlan {
  const exact = BILLING_PLANS.find((p) => p.price === amount);
  return exact ?? getBillingPlan("starter");
}

/** UPI deep link (server). In demo mode uses a non-collecting placeholder VPA. */
export function getUpiLink(amount: number, plan: string): string {
  const { upiId, payeeName } = billingUpiPayee();
  const am = isBillingUpiLive() ? amount : 1;
  const tn = isBillingUpiLive()
    ? `Bharat Cloud ${plan}`
    : `DEMO BharatCloud ${plan} (no real charge)`;
  return `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${am}&cu=INR&tn=${encodeURIComponent(tn)}`;
}
