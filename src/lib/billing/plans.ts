import { billingUpiPayee, isBillingUpiLive } from "@/lib/billing/upi-live";

export type BillingPlanId = "starter" | "growth" | "scale" | "standard" | "business";

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
    users: "5 Users",
    storage: "100GB per ID",
    storageGb: 100,
    tag: "",
  },
  {
    id: "growth",
    name: "GROWTH",
    price: 12999,
    users: "20 Users",
    storage: "200GB per ID",
    storageGb: 200,
    tag: "MOST POPULAR",
  },
  {
    id: "scale",
    name: "SCALE",
    price: 14999,
    users: "50 Users",
    storage: "500GB per ID",
    storageGb: 500,
    tag: "BEST FOR BUSINESS",
  },
];

export function getBillingPlan(id: string | undefined): BillingPlan {
  const key = id === "standard" ? "growth" : id === "business" ? "scale" : id;
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
