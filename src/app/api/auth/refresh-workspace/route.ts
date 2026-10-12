import { NextResponse } from "next/server";

import { attachSaasRoleCookies, getUserRole } from "@/lib/auth";
import {
  WS_COMPANY_COOKIE,
  WS_EMAIL_COOKIE,
  WS_ROLE_COOKIE,
  workspaceCookieOptions,
  getWorkspaceSession,
} from "@/lib/workspace/session";
import { resolveCompanyIdForEmail } from "@/lib/workspace/resolve-company";

/** Repair workspace role cookies from DB (e.g. info@ shown as employee). */
export async function POST() {
  const session = await getWorkspaceSession();
  if (!session?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const saas = await getUserRole(session.email);
  const companyId = await resolveCompanyIdForEmail(session.email);
  const workspaceAdmin =
    saas.is_company_owner ||
    saas.role === "company_owner" ||
    saas.role === "super_admin";

  const res = NextResponse.json({
    ok: true,
    role: saas.role,
    isCompanyOwner: saas.is_company_owner,
    companyId,
  });
  const opts = workspaceCookieOptions();
  res.cookies.set(WS_COMPANY_COOKIE, companyId, opts);
  res.cookies.set(WS_EMAIL_COOKIE, session.email.toLowerCase(), opts);
  res.cookies.set(WS_ROLE_COOKIE, workspaceAdmin ? "admin" : "member", opts);
  attachSaasRoleCookies(res, saas);
  return res;
}
