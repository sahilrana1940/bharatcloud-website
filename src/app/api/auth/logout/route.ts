import { NextResponse } from "next/server";

import {
  B2B_EMAIL_COOKIE,
  B2B_SESSION_COOKIE,
  SUPER_ADMIN_COOKIE,
} from "@/lib/b2b/session";
import {
  WS_COMPANY_COOKIE,
  WS_EMAIL_COOKIE,
  WS_IS_OWNER_COOKIE,
  WS_ROLE_COOKIE,
  WS_SAAS_ROLE_COOKIE,
} from "@/lib/workspace/session";

const CLEAR = { path: "/", maxAge: 0 };

export async function POST(req: Request) {
  const url = new URL(req.url);
  const res = NextResponse.redirect(new URL("/login", url.origin));
  for (const name of [
    WS_COMPANY_COOKIE,
    WS_EMAIL_COOKIE,
    WS_ROLE_COOKIE,
    WS_SAAS_ROLE_COOKIE,
    WS_IS_OWNER_COOKIE,
    B2B_SESSION_COOKIE,
    B2B_EMAIL_COOKIE,
    SUPER_ADMIN_COOKIE,
    "bc_vault_unlocked",
  ]) {
    res.cookies.set(name, "", CLEAR);
  }
  return res;
}

export async function GET(req: Request) {
  return POST(req);
}
