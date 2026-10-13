import { NextResponse } from "next/server";

import { isPaymentBypassEnabled } from "@/lib/billing/payment-bypass";
import { isBillingUpiLive } from "@/lib/billing/upi-live";
import {
  createRazorpayPaymentLink,
  WORKSPACE_PLANS,
  type WorkspacePlanId,
} from "@/lib/razorpay/payment-link";
import { requireWorkspace } from "@/lib/workspace/auth-api";
import { getSupabaseOrNull } from "@/lib/workspace/db";

export async function POST(req: Request) {
  const auth = await requireWorkspace();
  if (auth instanceof NextResponse) return auth;
  const { session, tenant } = auth;

  let body: { company_email?: string; plan?: string } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const companyEmail = (body.company_email || session.email).trim().toLowerCase();
  if (companyEmail !== session.email.toLowerCase()) {
    return NextResponse.json(
      { error: "company_email must match your logged-in workspace email" },
      { status: 403 },
    );
  }

  const planKey = (body.plan || "starter").toLowerCase() as WorkspacePlanId;
  const plan = WORKSPACE_PLANS[planKey];
  if (!plan) {
    return NextResponse.json(
      { error: "Invalid plan. Use starter, standard, or business." },
      { status: 400 },
    );
  }

  const companyId = tenant?.companyId ?? session.companyId;
  const domain = tenant?.company.domain;
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(
    /\/$/,
    "",
  );

  if (await isPaymentBypassEnabled()) {
    const supabase = await getSupabaseOrNull();
    if (supabase) {
      await supabase
        .from("companies")
        .update({ subscription_status: "active", plan_name: plan.planName })
        .eq("id", companyId);
    }
    return NextResponse.json({
      ok: true,
      bypass: true,
      message: "PAYMENT_BYPASS enabled — Pro unlocked without Razorpay",
      redirect: `${appUrl}/dashboard/team?paid=1`,
    });
  }

  const supabase = await getSupabaseOrNull();
  if (supabase) {
    const { data: co } = await supabase
      .from("companies")
      .select("subscription_status, plan_name")
      .eq("id", companyId)
      .maybeSingle();

    if (co?.subscription_status === "active") {
      return NextResponse.json(
        { error: "Subscription already active", alreadyActive: true },
        { status: 409 },
      );
    }
  }

  const razorpayConfigured = Boolean(
    process.env.RAZORPAY_KEY_ID?.trim() && process.env.RAZORPAY_KEY_SECRET?.trim(),
  );
  if (!razorpayConfigured || !isBillingUpiLive()) {
    return NextResponse.json({
      ok: true,
      useBillingPage: true,
      redirect: `${appUrl}/dashboard/billing`,
      message: "UPI billing + super admin approval (Razorpay disabled for today)",
    });
  }

  try {
    const link = await createRazorpayPaymentLink({
      amountPaise: plan.amountPaise,
      description: plan.label,
      customerEmail: companyEmail,
      notes: {
        company_id: companyId,
        company_domain: domain || "",
        plan: plan.planName,
        workspace_email: companyEmail,
      },
      callbackUrl: `${appUrl}/dashboard/team?paid=1&razorpay=1`,
    });

    if (supabase) {
      await supabase.from("payments").insert({
        company_id: companyId,
        company_domain: domain || companyEmail.split("@")[1] || "unknown",
        amount: Math.round(plan.amountPaise / 100),
        status: "pending",
      });
    }

    return NextResponse.json({
      ok: true,
      url: link.short_url,
      paymentLinkId: link.id,
      plan: plan.planName,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Payment link error";
    console.error("[create-payment-link]", msg);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
