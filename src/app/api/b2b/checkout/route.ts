import { NextResponse } from "next/server";

import { SAAS_PLANS, type SaasPlanId } from "@/lib/b2b/plans";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { companyPrefix, ensureFolder, getS3Client } from "@/lib/s3/client";

export async function POST(req: Request) {
  const { plan, companyName, ownerEmail } = await req.json();
  const planId = plan as SaasPlanId;
  const selected = SAAS_PLANS[planId];
  if (!selected || planId === "free" || planId === "enterprise") {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const orderId = `order_${Date.now()}`;
  const razorpayKey = process.env.RAZORPAY_KEY;

  const supabase = getSupabaseAdmin();
  let companyId = `cmp_${Date.now()}`;

  if (supabase) {
    const { data, error } = await supabase
      .from("organizations")
      .insert({
        name: companyName || "New Company",
        owner_email: ownerEmail || `owner-${Date.now()}@example.com`,
        plan: planId,
        storage_limit: selected.storageBytes,
        storage_used: 0,
        status: "active",
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
    checkoutUrl: `/login`,
  });
}
