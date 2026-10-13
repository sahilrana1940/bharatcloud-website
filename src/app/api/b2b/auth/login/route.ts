import { NextResponse } from "next/server";

import { demoOrganizations } from "@/lib/b2b/demo-orgs";
import {
  B2B_EMAIL_COOKIE,
  B2B_SESSION_COOKIE,
} from "@/lib/b2b/session";
import {
  workspaceCookieOptions,
  WS_COMPANY_COOKIE,
  WS_EMAIL_COOKIE,
  WS_ROLE_COOKIE,
} from "@/lib/workspace/session";
import { attachSaasRoleCookies, defaultDashboardForRole, getUserRole } from "@/lib/auth";
import {
  assertSuperAdminEmail,
  verifySuperAdminPassword,
} from "@/lib/b2b/super-admin-auth";
import { SUPER_ADMIN_COOKIE } from "@/lib/b2b/session";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import {
  PLATFORM_OPERATOR_COMPANY_ID,
  PLATFORM_OPERATOR_ORG_ID,
} from "@/lib/platform/operator";
import { resolveCompanyIdForEmail } from "@/lib/workspace/resolve-company";
import { touchProfileLogin } from "@/lib/workspace/workspace-profiles";

export async function POST(req: Request) {
  const { email, password } = await req.json();
  const ownerEmail = String(email || "").trim().toLowerCase();
  const pass = String(password || "");

  if (!ownerEmail.includes("@") || pass.length < 6) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  let orgId: string | null = null;
  const platformSuperAdmin = assertSuperAdminEmail(ownerEmail);

  if (platformSuperAdmin && !verifySuperAdminPassword(pass)) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  if (platformSuperAdmin) {
    orgId = PLATFORM_OPERATOR_ORG_ID;
  }

  if (!orgId && !platformSuperAdmin) {
    if (!supabase) {
      const org = demoOrganizations.find((o) => o.owner_email === ownerEmail);
      if (!org) {
        return NextResponse.json({ error: "Account not found" }, { status: 404 });
      }
      if (org.status === "blocked") {
        return NextResponse.json({ error: "Company blocked" }, { status: 403 });
      }
      orgId = org.id;
    } else {
      const { data: asOwner } = await supabase
        .from("organizations")
        .select("id, status")
        .eq("owner_email", ownerEmail)
        .maybeSingle();

      if (asOwner) {
        if (asOwner.status === "blocked") {
          return NextResponse.json({ error: "Company blocked" }, { status: 403 });
        }
        orgId = asOwner.id;
      } else {
        const { data: member } = await supabase
          .from("company_users")
          .select("company_id")
          .eq("email", ownerEmail)
          .maybeSingle();

        if (!member?.company_id) {
          return NextResponse.json({ error: "Account not found" }, { status: 404 });
        }

        const { data: company } = await supabase
          .from("companies")
          .select("admin_email")
          .eq("id", member.company_id)
          .maybeSingle();

        const orgOwner = company?.admin_email?.toLowerCase();
        if (!orgOwner) {
          return NextResponse.json({ error: "Account not found" }, { status: 404 });
        }

        const { data: orgForCompany, error } = await supabase
          .from("organizations")
          .select("id, status")
          .eq("owner_email", orgOwner)
          .maybeSingle();

        if (error || !orgForCompany) {
          return NextResponse.json({ error: "Account not found" }, { status: 404 });
        }
        if (orgForCompany.status === "blocked") {
          return NextResponse.json({ error: "Company blocked" }, { status: 403 });
        }
        orgId = orgForCompany.id;
      }
    }
  }

  if (!orgId) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  const workspaceCompanyId = platformSuperAdmin
    ? PLATFORM_OPERATOR_COMPANY_ID
    : await resolveCompanyIdForEmail(ownerEmail);
  if (supabase && !platformSuperAdmin) {
    await touchProfileLogin(supabase, ownerEmail, workspaceCompanyId);
  }
  const saas = await getUserRole(ownerEmail);

  const res = NextResponse.json({
    ok: true,
    orgId,
    companyId: workspaceCompanyId,
    redirectTo: defaultDashboardForRole(saas),
    saasRole: saas.role,
  });
  res.cookies.set(B2B_SESSION_COOKIE, orgId!, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  res.cookies.set(B2B_EMAIL_COOKIE, ownerEmail, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  const wsOpts = workspaceCookieOptions();
  res.cookies.set(WS_COMPANY_COOKIE, workspaceCompanyId, wsOpts);
  res.cookies.set(WS_EMAIL_COOKIE, ownerEmail, wsOpts);
  const workspaceAdmin =
    !platformSuperAdmin &&
    (saas.is_company_owner ||
      saas.role === "company_owner" ||
      ownerEmail.startsWith("admin@"));
  res.cookies.set(WS_ROLE_COOKIE, workspaceAdmin ? "admin" : "member", wsOpts);
  if (platformSuperAdmin) {
    res.cookies.set(SUPER_ADMIN_COOKIE, "1", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }
  attachSaasRoleCookies(res, saas);
  return res;
}
