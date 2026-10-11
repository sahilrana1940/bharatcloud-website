import { NextResponse } from "next/server";

import { createOAuth2Client, emailDomain } from "@/lib/google/client";
import { verifyGoogleOAuthState } from "@/lib/google/oauth-state";
import { saveGoogleOAuthTokens } from "@/lib/google/save-tokens";
import {
  workspaceCookieOptions,
  WS_COMPANY_COOKIE,
  WS_EMAIL_COOKIE,
  WS_ROLE_COOKIE,
} from "@/lib/workspace/session";
import { attachSaasRoleCookies, defaultDashboardForRole, getUserRole } from "@/lib/auth";
import { getSupabaseOrNull } from "@/lib/workspace/db";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const stateRaw = url.searchParams.get("state");
  if (!code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }

  const oauth2 = createOAuth2Client();
  if (!oauth2) {
    return NextResponse.redirect(new URL("/api/auth/google/demo", url.origin));
  }

  const { tokens } = await oauth2.getToken(code);
  oauth2.setCredentials(tokens);
  const ticket = await fetch(
    `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokens.access_token}`,
  );
  const profile = await ticket.json();
  const email = String(profile.email || "").toLowerCase();
  const domain = emailDomain(email);
  if (!email || !domain) {
    return NextResponse.json({ error: "Invalid Google profile" }, { status: 400 });
  }

  const linkState = stateRaw ? verifyGoogleOAuthState(stateRaw) : null;
  const supabase = await getSupabaseOrNull();
  let companyId: string;
  let role: "admin" | "member" = "member";
  let redirectPath: string;

  if (linkState) {
    if (email !== linkState.email) {
      return NextResponse.json(
        {
          error: `Google account must be ${linkState.email}. You signed in as ${email}.`,
        },
        { status: 403 },
      );
    }
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }
    companyId = linkState.companyId;
    redirectPath = linkState.returnTo;
    const { data: member } = await supabase
      .from("company_users")
      .select("role")
      .eq("company_id", companyId)
      .eq("email", email)
      .maybeSingle();
    role = (member?.role as "admin" | "member") || "member";
    await saveGoogleOAuthTokens(supabase, { companyId, email, tokens });
  } else if (!supabase) {
    companyId = `co-${domain}`;
    role = email.startsWith("admin@") ? "admin" : "member";
    redirectPath = defaultDashboardForRole(await getUserRole(email));
  } else {
    const { data: existing } = await supabase
      .from("companies")
      .select("id, admin_email")
      .eq("domain", domain)
      .maybeSingle();

    if (!existing) {
      const { data: created, error } = await supabase
        .from("companies")
        .insert({
          domain,
          admin_email: email,
          plan_name: "starter",
          storage_limit_gb: 100,
        })
        .select("id")
        .single();
      if (error || !created) {
        return NextResponse.json({ error: error?.message }, { status: 500 });
      }
      companyId = created.id;
      role = "admin";
      await supabase.from("company_settings").insert({ company_id: companyId });
      await supabase.from("company_users").insert({
        company_id: companyId,
        email,
        role: "admin",
        saas_role: "company_owner",
        is_company_owner: true,
      });
    } else {
      companyId = existing.id;
      role = existing.admin_email === email ? "admin" : "member";
      const isOwner = existing.admin_email === email;
      await supabase.from("company_users").upsert(
        {
          company_id: companyId,
          email,
          role,
          saas_role: isOwner ? "company_owner" : "employee",
          is_company_owner: isOwner,
        },
        { onConflict: "company_id,email" },
      );
    }

    await saveGoogleOAuthTokens(supabase, { companyId, email, tokens });
    redirectPath = defaultDashboardForRole(await getUserRole(email));
  }

  const saas = await getUserRole(email);
  const res = NextResponse.redirect(new URL(redirectPath, url.origin));
  const opts = workspaceCookieOptions();
  res.cookies.set(WS_COMPANY_COOKIE, companyId, opts);
  res.cookies.set(WS_EMAIL_COOKIE, email, opts);
  res.cookies.set(WS_ROLE_COOKIE, role, opts);
  attachSaasRoleCookies(res, saas);
  return res;
}
