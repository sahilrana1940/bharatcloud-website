import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

import { getSupabaseOrNull } from "@/lib/workspace/db";

/** Razorpay webhook — activates `companies.subscription_status` after payment link paid. */
export async function POST(req: Request) {
  const secret =
    process.env.RAZORPAY_WEBHOOK_SECRET?.trim() ||
    process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature") || "";

  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (!signature || sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let payload: {
    event?: string;
    payload?: {
      payment_link?: { entity?: { notes?: Record<string, string>; id?: string } };
      payment?: { entity?: { notes?: Record<string, string> } };
    };
  };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const event = payload.event || "";
  const notes =
    payload.payload?.payment_link?.entity?.notes ||
    payload.payload?.payment?.entity?.notes ||
    {};

  const companyId = notes.company_id;
  const plan = notes.plan || "pro";

  if (
    !companyId ||
    !["payment_link.paid", "payment.captured", "order.paid"].includes(event)
  ) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    return NextResponse.json({ ok: true, demo: true });
  }

  await supabase
    .from("companies")
    .update({
      subscription_status: "active",
      plan_name: plan,
    })
    .eq("id", companyId);

  await supabase
    .from("payments")
    .update({ status: "paid" })
    .eq("company_id", companyId)
    .eq("status", "pending");

  return NextResponse.json({ ok: true, companyId, event });
}
