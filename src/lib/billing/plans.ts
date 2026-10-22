import { billingUpiNote, buildUpiPayLink } from "@/lib/billing/upi";

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
  storage: string;
  users: string;
  tag?: string;
  trialDays: number;
  maxIds: number;
}

export const BILLING_PLANS: BillingPlan[] = [
  { id: "starter", name: "Starter", price: 5999, storage: "100GB", users: "Upto 5 IDs", trialDays: 30, maxIds: 5 },
  { id: "growth", name: "Growth", price: 24999, storage: "500GB", users: "Upto 25 IDs", tag: "MOST POPULAR", trialDays: 30, maxIds: 25 },
  { id: "scale", name: "Scale", price: 39999, storage: "2TB", users: "Unlimited IDs", trialDays: 30, maxIds: 0 },
];

export function getBillingPlan(id: string | undefined): BillingPlan {
  const key =
    id === "standard" || id === "growth"
      ? "growth"
      : id === "business" || id === "enterprise" || id === "scale"
        ? "scale"
        : "starter";
  if (id === "starter" || id === "growth" || id === "scale") {
    return BILLING_PLANS.find((plan) => plan.id === id) ?? BILLING_PLANS[0];
  }
  return BILLING_PLANS.find((plan) => plan.id === key) ?? BILLING_PLANS[0];
}

export function planFromAmount(amount: number): BillingPlan {
  return BILLING_PLANS.find((plan) => plan.price === amount) ?? getBillingPlan("starter");
}

export function getUpiLink(amount: number, planName: string) {
  return buildUpiPayLink(amount, billingUpiNote(planName, amount));
}

export function calculateMrr(userCount: number) {
  if (userCount <= 0) return 0;
  const admin = 199;
  const upto5 = Math.min(Math.max(userCount - 1, 0), 4) * 49;
  const beyond = Math.max(userCount - 5, 0) * 99;
  return admin + upto5 + beyond;
}