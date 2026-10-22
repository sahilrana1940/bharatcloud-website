import { billingUpiName, billingUpiVpa, envFlagOn } from "@/lib/billing/upi";

/** Real UPI collect. Accepts BILLING_UPI_LIVE=true or 1. */
export function isBillingUpiLive(): boolean {
  return envFlagOn(process.env.BILLING_UPI_LIVE) || envFlagOn(process.env.NEXT_PUBLIC_BILLING_UPI_LIVE);
}

export function billingUpiPayee(): { upiId: string; payeeName: string } {
  return {
    upiId: billingUpiVpa(),
    payeeName: billingUpiName(),
  };
}

export function shouldAutoApprovePayments(): boolean {
  return process.env.PAYMENT_AUTO_APPROVE === "1";
}
