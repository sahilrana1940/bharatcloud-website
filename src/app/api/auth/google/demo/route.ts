import { NextResponse } from "next/server";

import { isDemoLoginEnabled, isB2cEnabled } from "@/lib/feature-flags";
import { attachSaasRoleCookies, defaultDashboardForRole, getUserRole } from "@/lib/auth";
import { isSuperAdminEmail } from "@/lib/brand";
import { B2C_PERSONAL_COMPANY_ID } from "@/lib/workspace/b2c";
import { resolveCompanyIdForEmail } from "@/lib/workspace/resolve-company";
import {
  workspaceCookieOptions,
  WS_COMPANY_COOKIE,
  WS_EMAIL_COOKIE,
  WS_ROLE_COOKIE,
} from "@/lib/workspace/session";

/** Demo workspace login — disabled in production unless ENABLE_DEMO_LOGINS=1 */
export async function GET(req: Request) {
  if (!isDemoLoginEnabled()) {
    return NextResponse.json(
      { error: "Demo login is disabled. Use Sign up or Google Workspace." },
      { status: 403 },
    );
  }

  const url = new URL(req.url);
  const email = (url.searchParams.get("email") || "company@bharatcloud.store").toLowerCase();
  const mode = url.searchParams.get("mode");

  if ((mode === "b2c" || url.searchParams.get("redirect") === "personal") && !isB2cEnabled()) {
    return NextResponse.json({ error: "Personal cloud is not available." }, { status: 403 });
  }

  const role = email.startsWith("admin@") ? "admin" : "member";
  const saas = await getUserRole(email);

  let redirectPath = defaultDashboardForRole(saas);
  let companyId = await resolveCompanyIdForEmail(email);

  if (mode === "b2c" || url.searchParams.get("redirect") === "personal") {
    companyId = B2C_PERSONAL_COMPANY_ID;
    redirectPath = "/personal";
  } else if (isSuperAdminEmail(email)) {
    redirectPath = "/admin/super";
  } else if (url.searchParams.get("redirect")) {
    redirectPath = url.searchParams.get("redirect")!;
  }

  const res = NextResponse.redirect(new URL(redirectPath, url.origin));
  const opts = workspaceCookieOptions();
  res.cookies.set(WS_COMPANY_COOKIE, companyId, opts);
  res.cookies.set(WS_EMAIL_COOKIE, email, opts);
  res.cookies.set(WS_ROLE_COOKIE, role, opts);
  attachSaasRoleCookies(res, saas);
  return res;
}
