import { NextResponse } from "next/server";

import { denyUnlessSuperAdmin } from "@/lib/super-admin/guard";
import { storageGbForPlan } from "@/lib/super-admin/locked-spec";
import { getSupabaseOrNull } from "@/lib/workspace/db";

export async function POST(req: Request) {
  const auth = await denyUnlessSuperAdmin();
  if (auth.response) return auth.response;

  const supabase = await getSupabaseOrNull();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });

  const body = (await req.json().catch(() => ({}))) as {
    paymentId?: string;
    companyId?: string;
    companyEmail?: string;
    plan?: string;
  };

  const plan = body.plan || "starter";
  const storageLimit = storageGbForPlan(plan);
  const expiry = new Date();
  expiry.setFullYear(expiry.getFullYear() + 1);
  const memberUpdate = {
    subscription_status: "active",
    storage_limit: storageLimit,
    expiry_date: expiry.toISOString(),
  };

  let memberError = "";
  if (body.companyId) {
    const byCompany = await supabase.from("members").update(memberUpdate).eq("company_id", body.companyId);
    memberError = byCompany.error?.message || "";
  }
  if (memberError && body.companyEmail) {
    const byEmail = await supabase.from("members").update(memberUpdate).eq("email", body.companyEmail);
    memberError = byEmail.error?.message || "";
  }

  if (body.companyId) {
    await supabase
      .from("companies")
      .update({
        subscription_status: "active",
        plan_name: plan,
        storage_limit_gb: storageLimit,
      })
      .eq("id", body.companyId);
  }

  if (body.paymentId) {
    await supabase.from("payments").update({ status: "verified" }).eq("id", body.paymentId);
  }

  return NextResponse.json({
    ok: true,
    storageLimit,
    expiry: expiry.toISOString(),
    memberWarning: memberError || null,
  });
}
