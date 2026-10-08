import { NextResponse } from "next/server";

import { B2B_PLANS, type B2BPlanId } from "@/lib/b2b/plans";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { ensureFolder, getS3Client, companyPrefix } from "@/lib/s3/client";

export async function POST(req: Request) {
  const { plan, companyName } = await req.json();
  const planId = plan as B2BPlanId;
  const selected = B2B_PLANS[planId];
  if (!selected) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const orderId = `order_${Date.now()}`;
  const razorpayKey = process.env.RAZORPAY_KEY;

  const supabase = getSupabaseAdmin();
  let companyId = `cmp_${Date.now()}`;

  if (supabase) {
    const { data, error } = await supabase
      .from("b2b_companies")
      .insert({
        name: companyName || "New Company",
        plan: planId,
        storage_limit_gb: selected.storageGb,
        razorpay_subscription_id: orderId,
      })
      .select("id")
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    companyId = data.id;
  }

  const s3 = getS3Client();
  if (s3) {
    await ensureFolder(s3, companyPrefix(companyId));
  }

  return NextResponse.json({
    orderId,
    amountInr: selected.priceInr,
    gstNote: "+ GST",
    razorpayKeyConfigured: Boolean(razorpayKey),
    companyId,
    checkoutUrl: `/b2b/login?company=${companyId}`,
  });
}
