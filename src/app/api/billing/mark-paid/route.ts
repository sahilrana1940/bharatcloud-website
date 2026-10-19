import { NextResponse } from "next/server";

import { getBillingPlan } from "@/lib/billing/plans";
import { shouldAutoApprovePayments } from "@/lib/billing/upi-live";
import { demoPaymentInsert } from "@/lib/payments/store";
import { requireWorkspace } from "@/lib/workspace/auth-api";
import { getSupabaseOrNull } from "@/lib/workspace/db";

export async function POST(req: Request) {
  const auth = await requireWorkspace();
  if (auth instanceof NextResponse) return auth;
  const { session, tenant } = auth;
  const companyId = tenant?.companyId ?? session.companyId;
  const domain = tenant?.company.domain || "demo.example.com";

  let planId = "starter";
  let amount = getBillingPlan("starter").price;
  try {
    const body = await req.json();
    if (body.plan) planId = String(body.plan);
    const plan = getBillingPlan(planId);
    planId = plan.id;
    amount = body.amount ? Number(body.amount) : plan.price;
  } catch {
    /* defaults */
  }
  const plan = getBillingPlan(planId);

  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    return NextResponse.json({ ok: true, payment: demoPaymentInsert(domain, amount) });
  }

  const status = shouldAutoApprovePayments() ? "approved" : "pending";
  const { data, error } = await supabase
    .from("payments")
    .insert({
      company_id: companyId,
      company_domain: domain,
      amount,
      status,
      plan_name: plan.id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, payment: data, approved: status === "approved" });
}
