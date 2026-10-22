import { NextResponse } from "next/server";

import { isSuperAdminEmail } from "@/lib/brand";
import { getSessionRole } from "@/lib/auth";
import { getSupabaseOrNull } from "@/lib/workspace/db";

const COMPANY_UPDATE = {
  subscription_status: "active",
  plan_name: "business",
  storage_limit_gb: 100,
};

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

  const body = (await req.json().catch(() => ({}))) as {
    paymentId?: string;
    id?: string;
    action?: string;
    company_id?: string;
    company_domain?: string;
  };

  if (body.action === "reject") {
    const paymentId = body.paymentId || body.id;
    if (paymentId) {
      await supabase.from("payments").update({ status: "rejected" }).eq("id", paymentId);
    }
    return NextResponse.json({ ok: true });
  }

  let companyId = body.company_id;
  let domain = body.company_domain;
  const paymentId = body.paymentId || body.id;

  if (paymentId && !companyId && !domain) {
    const { data } = await supabase
      .from("payments")
      .select("company_id, company_domain")
      .eq("id", paymentId)
      .maybeSingle();
    companyId = data?.company_id;
    domain = data?.company_domain;
  }

  const update = supabase.from("companies").update(COMPANY_UPDATE);
  const result = companyId
    ? await update.eq("id", companyId)
    : domain
      ? await update.eq("domain", domain)
      : { error: { message: "company_id required" } };

  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }

  if (paymentId) {
    await supabase.from("payments").update({ status: "verified" }).eq("id", paymentId);
  }

  return NextResponse.json({ ok: true, plan: COMPANY_UPDATE.plan_name });
}
