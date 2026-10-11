import { NextResponse } from "next/server";

import { companyHasPaidBackup } from "@/lib/billing/subscription";
import { resolveCompanyDomain } from "@/lib/workspace/company";
import { requireWorkspace } from "@/lib/workspace/auth-api";
import { getSupabaseOrNull } from "@/lib/workspace/db";

export async function GET() {
  const auth = await requireWorkspace();
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  const supabase = await getSupabaseOrNull();
  const domain = await resolveCompanyDomain(session.companyId, session.email);

  if (!supabase) {
    return NextResponse.json({ active: false, domain, plan: "trial" });
  }

  const { data: co } = await supabase
    .from("companies")
    .select("subscription_status, plan_name, storage_limit_gb")
    .eq("id", session.companyId)
    .maybeSingle();

  const active = await companyHasPaidBackup(supabase, session.companyId, domain);

  return NextResponse.json({
    active,
    domain,
    plan: co?.plan_name || "starter",
    subscriptionStatus: co?.subscription_status || "trial",
    storageLimitGb: Number(co?.storage_limit_gb ?? 100),
  });
}
