import { NextResponse } from "next/server";

import { demoOrganizations } from "@/lib/b2b/demo-orgs";
import {
  B2B_EMAIL_COOKIE,
  B2B_SESSION_COOKIE,
} from "@/lib/b2b/session";
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
  return res;
}
