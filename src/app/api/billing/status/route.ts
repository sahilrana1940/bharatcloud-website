import { NextResponse } from "next/server";

import {
  isPaymentBypassEnabled,
  PAYMENT_BYPASS_COOKIE,
  readPaymentBypassFlag,
} from "@/lib/billing/payment-bypass";
import { isDemoBillingDomain } from "@/lib/billing/demo-domain";
import { companyHasPaidBackup } from "@/lib/billing/subscription";
import { isSuperAdminEmail } from "@/lib/brand";
import { getSessionRole } from "@/lib/auth";
import {
  attachWorkspaceCompanyCookie,
  billingStatusUnauthorized,
  canAccessCompany,
  readWorkspaceAuthRepaired,
} from "@/lib/billing/workspace-cookies";
import { loadTenantCompany } from "@/lib/tenant";
import { getSupabaseOrNull } from "@/lib/workspace/db";
import { workspaceCookieOptions } from "@/lib/workspace/session";

export async function GET() {
  const repairedAuth = await readWorkspaceAuthRepaired();
  if (!repairedAuth) {
    return billingStatusUnauthorized();
  }
  const { auth: ws, repaired } = repairedAuth;

  const supabase = await getSupabaseOrNull();
  const company = await loadTenantCompany(ws.companyId);

  if (!supabase || !company) {
    return NextResponse.json(
      {
        active: false,
        error: company ? "Database not configured" : "Company not found",
        companyId: ws.companyId,
      },
      { status: company ? 503 : 404 },
    );
  }

  const allowed = await canAccessCompany(ws.email, ws.companyId);
  if (!allowed) {
    return NextResponse.json(
      {
        active: false,
        error: "Forbidden",
        companyId: ws.companyId,
        hint: "POST /api/auth/refresh-workspace then logout/login. Ensure company_users row exists for your email.",
      },
      { status: 403 },
    );
  }

  const bypass = await isPaymentBypassEnabled();
  let active = false;

  const demoDomain = isDemoBillingDomain(company.domain);

  if (bypass) {
    active = true;
  } else if (company.subscription_status === "active") {
    active = true;
  } else if (demoDomain) {
    active = true;
  } else {
    active = await companyHasPaidBackup(supabase, ws.companyId, company.domain);
  }

  const bypassFlag = await readPaymentBypassFlag();

  const res = NextResponse.json({
    active,
    bypass: bypassFlag,
    paymentBypass: bypass,
    companyId: ws.companyId,
    domain: company.domain,
    plan: company.plan_name || "starter",
    subscriptionStatus: company.subscription_status || "trial",
    demoBilling: demoDomain,
    storageLimitGb: company.storage_limit_gb,
    email: ws.email,
    cookieRepaired: repaired,
  });
  if (repaired) attachWorkspaceCompanyCookie(res, ws.companyId);
  return res;
}

export async function POST(req: Request) {
  const role = await getSessionRole();
  if (!role?.email || !isSuperAdminEmail(role.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let bypass = false;
  try {
    const body = (await req.json()) as { bypass?: boolean };
    bypass = Boolean(body.bypass);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const res = NextResponse.json({ bypass: bypass ? 1 : 0 });
  res.cookies.set(
    PAYMENT_BYPASS_COOKIE,
    bypass ? "1" : "0",
    workspaceCookieOptions(60 * 60 * 24 * 30),
  );
  return res;
}
