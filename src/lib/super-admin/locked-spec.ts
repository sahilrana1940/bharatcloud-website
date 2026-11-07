import { SUPER_ADMIN_OWNER } from "@/lib/constants";

export const OWNER_EMAIL = SUPER_ADMIN_OWNER;
export const OWNER_BADGE = "OWNER";
export const WEBSITE = "bharatcloud.store";

export const BANK_UPI_ID = "9469276461@idfcfirst";
export const BANK_UPI_LABEL = "Pay via Direct Bank UPI";
export const BANK_UPI_METHOD = `Bank UPI - ${BANK_UPI_ID}`;
export const RAZORPAY_METHOD = "Razorpay";

export const UPI_DEEP_LINK =
  "upi://pay?pa=9469276461@idfcfirst&pn=BharatCloud&cu=INR";

export const UPI_QR_URL =
  "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi://pay?pa=9469276461@idfcfirst%26pn=BharatCloud%26cu=INR";

export const PLAN_STORAGE_GB: Record<string, number> = {
  starter: 100,
  growth: 500,
  enterprise: 2048,
  scale: 2048,
  business: 2048,
};

export function storageGbForPlan(plan: string | null | undefined) {
  const key = String(plan || "starter").trim().toLowerCase();
  return PLAN_STORAGE_GB[key] ?? 100;
}

export function paymentMethodLabel(raw: string | null | undefined) {
  const value = String(raw || "").toLowerCase();
  if (value.includes("razor")) return RAZORPAY_METHOD;
  return BANK_UPI_METHOD;
}
