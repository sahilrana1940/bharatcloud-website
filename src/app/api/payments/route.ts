import { NextResponse } from "next/server";

import { getBillingPlan } from "@/lib/billing/plans";
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
    process.env.PAYMENT_AUTO_APPROVE === "1" ||
    process.env.NODE_ENV === "development";
  const status = autoApprove ? "approved" : "pending";

  const { data, error } = await supabase
    .from("payments")
    .insert({
      company_id: companyId,
      company_domain: domain,
      amount,
      status,
    })
    .select()
    .single();

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
