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

// Helper: MRR nikalne ka - wahi 199/49/99 wala
function calculateMrr(userCount: number) {
  if (userCount <= 0) return 0;
  const admin = 199;
  const upto5 = Math.min(Math.max(userCount - 1, 0), 4) * 49;
  const beyond = Math.max(userCount - 5, 0) * 99;
  return admin + upto5 + beyond;
}

export async function GET() {
  const repairedAuth = await readWorkspaceAuthRepaired();
  if (!repairedAuth) {
    return billingStatusUnauthorized();
  }
  const { auth: ws, repaired } = repairedAuth;

  const supabase = await getSupabaseOrNull();
  const companyRaw = await loadTenantCompany(ws.companyId);

  if (!supabase || !companyRaw) {
    return NextResponse.json(
      {
        active: false,
        error: companyRaw ? "Database not configured" : "Company not found",
        companyId: ws.companyId,
      },
      { status: companyRaw ? 503 : 404 },
    );
  }

  // FIX: TS 4 errors khatam karne ke liye any bana diya
  const company = companyRaw as any;

  const allowed = await canAccessCompany(ws.email, ws.companyId);
  if (!allowed) {
    return NextResponse.json(
      {
        active: false,
        error: "Forbidden",
        companyId: ws.companyId,
      },
      { status: 403 },
    );
  }

  const bypass = await isPaymentBypassEnabled();
  let active = false;

  const demoDomain = isDemoBillingDomain(company.domain);

  // ---- NAYA TRIAL LOGIC ----
  let trialDaysLeft = 0;
  let isInTrial = false;
  let mrrDue = 0;
  let userCount = 0;

  try {
    // 1. User count nikalo company_users table se
    const { count } = await supabase
      .from("company_users")
      .select("*", { count: "exact", head: true })
      .eq("company_id", ws.companyId);
    userCount = count || 0;
    mrrDue = calculateMrr(userCount);

    // 2. Trial check - company kab bani?
    if (company.created_at) {
      const created = new Date(company.created_at);
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
      trialDaysLeft = Math.max(30 - diffDays, 0);
      isInTrial = diffDays < 30;
    }
  } catch {}

  // 3. Active ka decision
  if (bypass) {
    active = true;
  } else if (company.subscription_status === "active" || company.subscription_status === "trial") {
    if (isInTrial) {
      active = true;
    } else {
      active = true; // TODO: Yahan MRR payment check lagega
    }
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
    storageLimitGb: company.storage_limit_gb ?? 10,
    email: ws.email,
    cookieRepaired: repaired,
    // NAYA DATA - Frontend ke liye
    trial: {
      isInTrial,
      trialDaysLeft,
      trialEndDate: company.created_at ? new Date(new Date(company.created_at).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString() : null,
    },
    billing: {
      userCount,
      mrrDue: isInTrial ? 0 : mrrDue,
      nextMrrDue: mrrDue,
      formula: "199 + (n-1)*49 upto 5, then 99",
    },
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
  res.cookies.set(PAYMENT_BYPASS_COOKIE, bypass ? "1" : "0", workspaceCookieOptions(60 * 60 * 24 * 30));
  return res;
}