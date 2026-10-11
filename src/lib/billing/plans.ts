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

/** UPI deep link (client or server — uses NEXT_PUBLIC_UPI_*). */
export function getUpiLink(amount: number, plan: string): string {
  const upiId = process.env.NEXT_PUBLIC_UPI_ID || "9469276461@idfcfirst";
  const name = process.env.NEXT_PUBLIC_UPI_PAYEE_NAME || "Sahil Rana";
  return `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR&tn=${encodeURIComponent(`Bharat Cloud ${plan}`)}`;
}
