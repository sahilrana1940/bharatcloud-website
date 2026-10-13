/** Real UPI collect is off until BILLING_UPI_LIVE=1 and a payee VPA is configured. */
export function isBillingUpiLive(): boolean {
  if (process.env.BILLING_UPI_LIVE !== "1") return false;
  const vpa = process.env.NEXT_PUBLIC_UPI_ID?.trim();
  return Boolean(vpa);
}

export function billingUpiPayee(): { upiId: string; payeeName: string } {
  return {
    upiId: process.env.NEXT_PUBLIC_UPI_ID?.trim() || "demo@upi",
    payeeName: process.env.NEXT_PUBLIC_UPI_PAYEE_NAME?.trim() || "BharatCloud Demo",
  };
}

export function shouldAutoApprovePayments(): boolean {
  return process.env.PAYMENT_AUTO_APPROVE === "1";
}
