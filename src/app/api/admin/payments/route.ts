import { NextResponse } from "next/server";

import { isPlatformAdminSession } from "@/lib/admin/access";
import { getBillingPlan, planFromAmount } from "@/lib/billing/plans";
import { getSessionRole } from "@/lib/auth";
import {
  demoPaymentApprove,
  demoPaymentsList,
} from "@/lib/payments/store";
import { getSupabaseOrNull } from "@/lib/workspace/db";

async function canManagePayments() {
  const role = await getSessionRole();
  return isPlatformAdminSession(role);
}

export async function GET() {
  if (!(await canManagePayments())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    return NextResponse.json({
      payments: demoPaymentsList().filter((p) => p.status === "pending"),
    });
  }

  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ payments: data || [] });
}

export async function PATCH(req: Request) {
  if (!(await canManagePayments())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { paymentId, action } = await req.json();
  if (!paymentId) {
    return NextResponse.json({ error: "paymentId required" }, { status: 400 });
  }
  const reject = action === "reject";

  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    const p = demoPaymentApprove(paymentId);
    if (!p) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true, payment: p });
  }

  const { data: payment, error: fetchErr } = await supabase
    .from("payments")
    .select("*")
    .eq("id", paymentId)
    .maybeSingle();

  if (fetchErr || !payment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { error: updErr } = await supabase
    .from("payments")
    .update({ status: reject ? "rejected" : "approved" })
    .eq("id", paymentId);

  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 500 });
  }

  if (reject) {
    return NextResponse.json({ ok: true, rejected: true });
  }

  const planId =
    (payment as { plan_name?: string }).plan_name ||
    planFromAmount(Number(payment.amount)).id;
  const plan = getBillingPlan(planId);

  const companyId = (payment as { company_id?: string }).company_id;
  const companyUpdate = {
    subscription_status: "active",
    plan_name: plan.id,
    storage_limit_gb: plan.storageGb,
  };
  if (companyId) {
    await supabase.from("companies").update(companyUpdate).eq("id", companyId);
  } else {
    await supabase
      .from("companies")
      .update(companyUpdate)
      .eq("domain", payment.company_domain);
  }

  return NextResponse.json({ ok: true });
}
