import { NextResponse } from "next/server";

import { isPaymentBypassEnabled } from "@/lib/billing/payment-bypass";
import { companyHasPaidBackup } from "@/lib/billing/subscription";
import {
  billingStatusUnauthorized,
  canAccessCompany,
  readWorkspaceCookieAuth,
} from "@/lib/billing/workspace-cookies";
import { loadTenantCompany } from "@/lib/tenant";
import { getSupabaseOrNull } from "@/lib/workspace/db";

export async function GET() {
  const ws = await readWorkspaceCookieAuth();
  if (!ws) {
    return billingStatusUnauthorized();
  }

  const supabase = await getSupabaseOrNull();
  const company = await loadTenantCompany(ws.companyId);

  if (!supabase || !company) {
    return NextResponse.json({
      active: false,
      error: company ? "Database not configured" : "Company not found",
      companyId: ws.companyId,
    }, { status: company ? 503 : 404 });
  }

  const allowed = await canAccessCompany(ws.email, ws.companyId);
  if (!allowed) {
    return NextResponse.json(
      { active: false, error: "Forbidden", companyId: ws.companyId },
      { status: 403 },
    );
  }

  const bypass = isPaymentBypassEnabled();
  let active = false;

  if (bypass) {
    active = true;
  } else if (company.subscription_status === "active") {
    active = true;
  } else {
    active = await companyHasPaidBackup(supabase, ws.companyId, company.domain);
  }

  return NextResponse.json({
    active,
    paymentBypass: bypass,
    companyId: ws.companyId,
    domain: company.domain,
    plan: company.plan_name || "starter",
    subscriptionStatus: company.subscription_status || "trial",
    storageLimitGb: company.storage_limit_gb,
    email: ws.email,
  });
}
