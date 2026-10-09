import { NextResponse } from "next/server";

import {
  workspaceCookieOptions,
  WS_COMPANY_COOKIE,
  WS_EMAIL_COOKIE,
  WS_ROLE_COOKIE,
} from "@/lib/workspace/session";
import { DEMO_COMPANY_ID } from "@/lib/workspace/demo-data";

/** Demo workspace login when Google env is not set */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const email = url.searchParams.get("email") || "admin@rjadam.com";
  const role = email.startsWith("admin@") ? "admin" : "member";
  const res = NextResponse.redirect(new URL("/dashboard/drive", url.origin));
  const opts = workspaceCookieOptions();
  res.cookies.set(WS_COMPANY_COOKIE, DEMO_COMPANY_ID, opts);
  res.cookies.set(WS_EMAIL_COOKIE, email, opts);
  res.cookies.set(WS_ROLE_COOKIE, role, opts);
  return res;
}
