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
import { DEMO_COMPANY_ID } from "@/lib/workspace/demo-data";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const { email, password } = await req.json();
  const ownerEmail = String(email || "").trim().toLowerCase();
  const pass = String(password || "");

  if (!ownerEmail.includes("@") || pass.length < 6) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  let orgId: string | null = null;

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
    const { data, error } = await supabase
      .from("organizations")
      .select("id, status")
      .eq("owner_email", ownerEmail)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }
    if (data.status === "blocked") {
      return NextResponse.json({ error: "Company blocked" }, { status: 403 });
    }
    orgId = data.id;
  }

  const res = NextResponse.json({ ok: true, orgId });
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
  res.cookies.set(WS_COMPANY_COOKIE, orgId || DEMO_COMPANY_ID, wsOpts);
  res.cookies.set(WS_EMAIL_COOKIE, ownerEmail, wsOpts);
  res.cookies.set(
    WS_ROLE_COOKIE,
    ownerEmail.startsWith("admin@") ? "admin" : "member",
    wsOpts,
  );
  return res;
}
