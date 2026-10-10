import { NextResponse } from "next/server";

import {
  workspaceCookieOptions,
  WS_COMPANY_COOKIE,
  WS_EMAIL_COOKIE,
  WS_ROLE_COOKIE,
} from "@/lib/workspace/session";
import { attachSaasRoleCookies, defaultDashboardForRole, getUserRole } from "@/lib/auth";
import { DEMO_COMPANY_ID } from "@/lib/workspace/demo-data";

/** Demo workspace login when Google env is not set */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const email = (url.searchParams.get("email") || "admin@rjadam.com").toLowerCase();
  const role = email.startsWith("admin@") ? "admin" : "member";
  const saas = await getUserRole(email);
  const res = NextResponse.redirect(
    new URL(defaultDashboardForRole(saas), url.origin),
  );
  const opts = workspaceCookieOptions();
  res.cookies.set(WS_COMPANY_COOKIE, DEMO_COMPANY_ID, opts);
  res.cookies.set(WS_EMAIL_COOKIE, email, opts);
  res.cookies.set(WS_ROLE_COOKIE, role, opts);
  attachSaasRoleCookies(res, saas);
  return res;
}
