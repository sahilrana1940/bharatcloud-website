import { billingUpiPayee, isBillingUpiLive } from "@/lib/billing/upi-live";

export type BillingPlanId = "starter" | "standard" | "business";

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
    name: "Starter",
    price: 999,
    users: "5 Users",
    storage: "100GB",
    storageGb: 100,
    tag: "MOST POPULAR",
  },
  {
    id: "standard",
    name: "Standard",
    price: 2199,
    users: "10 Users",
    storage: "500GB",
    storageGb: 500,
    tag: "",
  },
  {
    id: "business",
    name: "Business",
    price: 3499,
    users: "20 Users",
    storage: "1TB",
    storageGb: 1024,
    tag: "BEST FOR BUSINESS",
  },
];

export function getBillingPlan(id: string | undefined): BillingPlan {
  const found = BILLING_PLANS.find((p) => p.id === id);
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
