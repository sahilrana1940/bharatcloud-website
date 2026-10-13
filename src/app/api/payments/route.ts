import { NextResponse } from "next/server";

import { getBillingPlan } from "@/lib/billing/plans";
import { shouldAutoApprovePayments } from "@/lib/billing/upi-live";
import {
  demoPaymentInsert,
  demoPaymentsList,
} from "@/lib/payments/store";
import { requireWorkspace } from "@/lib/workspace/auth-api";
import { getSupabaseOrNull } from "@/lib/workspace/db";

export async function GET() {
  const auth = await requireWorkspace();
  if (auth instanceof NextResponse) return auth;
  const { session, tenant } = auth;
  const companyId = tenant?.companyId ?? session.companyId;
  const domain = tenant?.company.domain;
  const supabase = await getSupabaseOrNull();

  if (!supabase) {
    return NextResponse.json({
      payments: demoPaymentsList().filter((p) => p.company_domain === domain),
    });
  }

  const primary = await supabase
    .from("payments")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  let data = primary.data;
  if (primary.error?.message.includes("company_id") && domain) {
    const fallback = await supabase
      .from("payments")
      .select("*")
      .eq("company_domain", domain)
      .order("created_at", { ascending: false });
    data = fallback.data;
  }

  return NextResponse.json({ payments: data || [] });
}

export async function POST(req: Request) {
  const auth = await requireWorkspace();
  if (auth instanceof NextResponse) return auth;
  const { session, tenant } = auth;
  const companyId = tenant?.companyId ?? session.companyId;
  const domain = tenant?.company.domain;

  let amount = getBillingPlan("starter").price;
  let planId = "starter";
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
    const row = demoPaymentInsert(domain || "demo.example.com", amount);
    return NextResponse.json({ ok: true, payment: row });
  }

  const autoApprove =
    shouldAutoApprovePayments() ||
    (process.env.NODE_ENV === "development" && process.env.VERCEL !== "1");
  const status = autoApprove ? "approved" : "pending";

  const insertRow: Record<string, unknown> = {
    company_id: companyId,
    company_domain: domain,
    amount,
    status,
    plan_name: plan.id,
  };

  let { data, error } = await supabase
    .from("payments")
    .insert(insertRow)
    .select()
    .single();

  if (error?.message.includes("plan_name")) {
    const { plan_name: _drop, ...withoutPlan } = insertRow;
    const retry = await supabase
      .from("payments")
      .insert(withoutPlan)
      .select()
      .single();
    data = retry.data;
    error = retry.error;
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (status === "approved") {
    await supabase
      .from("companies")
      .update({
        subscription_status: "active",
        plan_name: plan.id,
        storage_limit_gb: plan.storageGb,
      })
      .eq("id", companyId);
  }

  return NextResponse.json({
    ok: true,
    payment: data,
    redirect: "/dashboard/team?paid=1",
    approved: status === "approved",
  });
}
