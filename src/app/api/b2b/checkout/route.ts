import { NextResponse } from "next/server";

import { PRICING_PLANS, type PlanId, withGst } from "@/lib/b2b/plans";

export async function POST(req: Request) {
  const { plan } = await req.json();
  const planId = plan as PlanId;
  const selected = PRICING_PLANS[planId];
  if (!selected) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const orderId = `order_${Date.now()}`;
  const razorpayKey =
    process.env.NEXT_PUBLIC_RAZORPAY_KEY || process.env.RAZORPAY_KEY;
  const total = withGst(selected.priceInr);

  return NextResponse.json({
    orderId,
    razorpayOrderId: orderId,
    amountInr: total,
    plan: planId,
    razorpayKeyConfigured: Boolean(razorpayKey),
    note:
      "Test mode: use demo success or create Razorpay orders server-side for live payments.",
  });
}
