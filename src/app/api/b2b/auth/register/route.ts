import { NextResponse } from "next/server";

import { demoMembers, demoOrganizations } from "@/lib/b2b/demo-orgs";
import { GB } from "@/lib/b2b/plans";
import {
  B2B_EMAIL_COOKIE,
  B2B_SESSION_COOKIE,
} from "@/lib/b2b/session";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const { companyName, email, password } = await req.json();
  const name = String(companyName || "").trim();
  const ownerEmail = String(email || "").trim().toLowerCase();
  const pass = String(password || "");

  if (!name || !ownerEmail.includes("@")) {
    return NextResponse.json(
      { error: "Company name and valid email required" },
      { status: 400 },
    );
  }
  if (pass.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters" },
      { status: 400 },
    );
  }

  const supabase = getSupabaseAdmin();
  let orgId: string;

  if (!supabase) {
    if (demoOrganizations.some((o) => o.owner_email === ownerEmail)) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }
    orgId = `demo-org-${Date.now()}`;
    demoOrganizations.push({
      id: orgId,
      name,
      owner_email: ownerEmail,
      plan: "free",
      storage_limit: 10 * GB,
      storage_used: 0,
      status: "active",
      created_at: new Date().toISOString(),
    });
    demoMembers.push({
      id: `demo-m-${Date.now()}`,
      org_id: orgId,
      user_email: ownerEmail,
      role: "admin",
      joined_at: new Date().toISOString(),
    });
  } else {
    const { data, error } = await supabase
      .from("organizations")
      .insert({
        name,
        owner_email: ownerEmail,
        plan: "free",
        storage_limit: 10 * GB,
        storage_used: 0,
        status: "active",
      })
      .select("id")
      .single();

    if (error) {
      const msg =
        error.code === "23505"
          ? "Email already registered"
          : error.message;
      return NextResponse.json({ error: msg }, { status: 409 });
    }
    orgId = data.id;

    await supabase.from("org_members").insert({
      org_id: orgId,
      user_email: ownerEmail,
      role: "admin",
    });
  }

  const res = NextResponse.json({ ok: true, orgId });
  res.cookies.set(B2B_SESSION_COOKIE, orgId, {
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
