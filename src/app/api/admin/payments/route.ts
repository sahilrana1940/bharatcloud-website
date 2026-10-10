import { NextResponse } from "next/server";

import { isSuperAdminSession } from "@/lib/b2b/session";
import {
  demoPaymentApprove,
  demoPaymentsList,
} from "@/lib/payments/store";
import { requireWorkspace } from "@/lib/workspace/auth-api";
import { getSupabaseOrNull } from "@/lib/workspace/db";

async function canManagePayments() {
  if (await isSuperAdminSession()) return true;
  const auth = await requireWorkspace(true);
  if (auth instanceof NextResponse) return false;
  return auth.session.role === "admin";
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

  const { paymentId } = await req.json();
  if (!paymentId) {
    return NextResponse.json({ error: "paymentId required" }, { status: 400 });
  }

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
    .update({ status: "approved" })
    .eq("id", paymentId);

  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 500 });
  }

  await supabase
    .from("companies")
    .update({ subscription_status: "active", plan_name: "pro" })
    .eq("domain", payment.company_domain);

  return NextResponse.json({ ok: true });
}
