import { NextResponse } from "next/server";

import { companyHasPaidBackup } from "@/lib/billing/subscription";
import { requireWorkspace } from "@/lib/workspace/auth-api";
import { getSupabaseOrNull } from "@/lib/workspace/db";

export async function GET() {
  const auth = await requireWorkspace();
  if (auth instanceof NextResponse) return auth;
  const { tenant } = auth;
  if (!tenant) {
    return NextResponse.json({ error: "Tenant required" }, { status: 403 });
  }

  const supabase = await getSupabaseOrNull();

  if (!supabase) {
    return NextResponse.json({
      active: false,
      companyId: tenant.companyId,
      domain: tenant.company.domain,
      plan: "trial",
    });
  }

  const active = await companyHasPaidBackup(
    supabase,
    tenant.companyId,
    tenant.company.domain,
  );

  return NextResponse.json({
    active,
    companyId: tenant.companyId,
    domain: tenant.company.domain,
    plan: tenant.company.plan_name || "starter",
    subscriptionStatus: tenant.company.subscription_status || "trial",
    storageLimitGb: tenant.company.storage_limit_gb,
  });
}
