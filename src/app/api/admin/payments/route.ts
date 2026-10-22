import { NextResponse } from "next/server";
import { getSupabaseOrNull } from "@/lib/workspace/db";
import { getSessionRole } from "@/lib/auth";
import { isSuperAdminEmail } from "@/lib/brand";
import { getBillingPlan, planFromAmount } from "@/lib/billing/plans";

export async function GET() {
  const role = await getSessionRole();
  if (!role?.email || !isSuperAdminEmail(role.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    return NextResponse.json({ error: "DB not configured" }, { status: 503 });
  }

  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ payments: data || [] });
}

export async function PATCH(req: Request) {
  const role = await getSessionRole();
  if (!role?.email || !isSuperAdminEmail(role.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    return NextResponse.json({ error: "DB not configured" }, { status: 503 });
  }

  try {
    const payment = (await req.json()) as any;

    // Plan nikalo amount se
    const planId = planFromAmount(Number(payment.amount)).id;
    const plan = getBillingPlan(planId) as any;

    const companyId = (payment as { company_id?: string }).company_id;

    // FIX: storageGb -> storage (yehi line error de rahi thi)
    const companyUpdate = {
      subscription_status: "active",
      plan_name: plan.id,
      storage_limit_gb: plan.storage ?? plan.storageGb ?? plan.storage_limit_gb ?? 100,
    };

    let companyError = null;

    if (companyId) {
      const res = await supabase.from("companies").update(companyUpdate).eq("id", companyId);
      companyError = res.error;
    } else {
      const res = await supabase
        .from("companies")
        .update(companyUpdate)
        .eq("domain", payment.company_domain);
      companyError = res.error;
    }

    if (companyError) {
      return NextResponse.json({ error: companyError.message }, { status: 500 });
    }

    // Payment ko verified mark karo
    if (payment.id) {
      await supabase.from("payments").update({ status: "verified" }).eq("id", payment.id);
    }

    return NextResponse.json({ ok: true, plan: plan.id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    return NextResponse.json({ error: "DB not configured" }, { status: 503 });
  }

  try {
    const body = await req.json();
    const { error } = await supabase.from("payments").insert({
      company_domain: body.company_domain,
      company_id: body.company_id,
      amount: body.amount,
      utr: body.utr,
      status: "pending",
      created_at: new Date().toISOString(),
    });

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}