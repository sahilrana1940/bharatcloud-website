import { NextResponse } from "next/server";

import { attachSaasRoleCookies, defaultDashboardForRole, getUserRole } from "@/lib/auth";
import { isSuperAdminEmail } from "@/lib/brand";
import { B2C_PERSONAL_COMPANY_ID } from "@/lib/workspace/b2c";
import { DEMO_COMPANY_ID } from "@/lib/workspace/demo-data";
import {
  workspaceCookieOptions,
  WS_COMPANY_COOKIE,
  WS_EMAIL_COOKIE,
  WS_ROLE_COOKIE,
} from "@/lib/workspace/session";

/** Demo workspace login when Google env is not set */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const email = (url.searchParams.get("email") || "admin@rjadam.com").toLowerCase();
  const mode = url.searchParams.get("mode");
  const role = email.startsWith("admin@") ? "admin" : "member";
  const saas = await getUserRole(email);

  let redirectPath = defaultDashboardForRole(saas);
  let companyId = DEMO_COMPANY_ID;

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
