import { NextResponse } from "next/server";

import { isBillingUpiLive, shouldAutoApprovePayments } from "@/lib/billing/upi-live";

/** Public billing UX flags (no secrets). */
export async function GET() {
  const upiLive = isBillingUpiLive();
  return NextResponse.json({
    upiLive,
    /** When false: show demo UPI UI; customer taps "I have paid" → pending → super admin approves. */
    simulateUpiFlow: !upiLive,
    autoApprovePayments: shouldAutoApprovePayments(),
  });
}
