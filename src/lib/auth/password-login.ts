import { compare } from "bcryptjs";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isServiceRoleKey } from "@/lib/supabase/role";
import { resolveDashboardRole } from "@/lib/workspace/dashboard-role";
import { resolveCompanyIdForEmail } from "@/lib/workspace/resolve-company";
import { DEMO_COMPANY_ID } from "@/lib/workspace/demo-data";
import {
  WS_COMPANY_COOKIE,
  WS_EMAIL_COOKIE,
  WS_IS_OWNER_COOKIE,
  WS_ROLE_COOKIE,
  WS_SAAS_ROLE_COOKIE,
  workspaceCookieOptions,
} from "@/lib/workspace/session";

type AuthUserRow = {
  id: string;
  email?: string | null;
  email_confirmed_at?: string | null;
};

type PublicUserRow = {
  id?: string;
  email?: string | null;
  password_hash?: string | null;
};

function supabaseUrl() {
  return (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
}

function anonKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
}

/** Case-insensitive exact match. ilike treats _ as a wildcard, so filter in JS. */
function sameEmail(value: string | null | undefined, email: string) {
  return String(value || "").trim().toLowerCase() === email;
}

async function findAuthUser(email: string): Promise<AuthUserRow | null> {
  const url = supabaseUrl();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url || !key || !isServiceRoleKey(key)) return null;

  const res = await fetch(`${url}/auth/v1/admin/users?filter=${encodeURIComponent(email)}`, {
    headers: {
      Authorization: `Bearer ${key}`,
      apikey: key,
    },
    cache: "no-store",
  });
  if (!res.ok) {
    console.error("[login] auth.users lookup failed", res.status);
    return null;
  }
  const body = (await res.json()) as { users?: AuthUserRow[] };
  return (body.users || []).find((row) => sameEmail(row.email, email)) || null;
}

async function findPublicUser(admin: SupabaseClient, email: string): Promise<PublicUserRow | null> {
  const { data, error } = await admin.from("users").select("id, email, password_hash").ilike("email", email);
  if (error || !data) return null;
  return (data as PublicUserRow[]).find((row) => sameEmail(row.email, email)) || null;
}

async function passwordMatchesHash(password: string, hash: string | null | undefined) {
  if (!hash) return false;
  try {
    return await compare(password, hash);
  } catch {
    return false;
  }
}

async function signInWithPassword(email: string, password: string) {
  const url = supabaseUrl();
  const key = anonKey();
  if (!url || !key) {
    return { session: null as { access_token?: string; refresh_token?: string; expires_in?: number } | null, error: "Supabase auth is not configured" };
  }
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return {
    session: data.session,
    error: error?.message || null,
  };
}

function cookieOptions() {
  return {
    ...workspaceCookieOptions(),
    secure: process.env.NODE_ENV === "production",
  };
}

export async function handlePasswordLogin(req: Request) {
  try {
    const body = await req.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required", code: "MISSING_FIELDS" }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const authUser = await findAuthUser(email);
    const publicUser = admin ? await findPublicUser(admin, email) : null;

    const hashOk = await passwordMatchesHash(password, publicUser?.password_hash);
    let signed = await signInWithPassword(email, password);
    if (signed.error && /email not confirmed/i.test(signed.error) && authUser && admin) {
      await admin.auth.admin.updateUserById(authUser.id, { email_confirm: true });
      signed = await signInWithPassword(email, password);
    }

    const session = signed.session;
    const passwordOk = hashOk || (!signed.error && !!session);
    if (!passwordOk) {
      if (!authUser && !publicUser) {
        return NextResponse.json({ error: "User not found", code: "USER_NOT_FOUND" }, { status: 404 });
      }
      const code = signed.error || "INVALID_PASSWORD";
      console.error("[login] password check failed", email, code);
      return NextResponse.json({ error: "Wrong password", code }, { status: 401 });
    }

    const canonical = (authUser?.email || publicUser?.email || email).trim().toLowerCase();
    let companyId = DEMO_COMPANY_ID;
    try {
      companyId = await resolveCompanyIdForEmail(canonical);
    } catch (error) {
      console.error("[login] company lookup", error instanceof Error ? error.message : error);
    }

    const dashboard = await resolveDashboardRole(admin, canonical);
    const isOwner = dashboard.role === "admin";
    const opts = cookieOptions();
    const res = NextResponse.json({
      success: true,
      email: canonical,
      redirectTo: dashboard.target,
    });

    res.cookies.set(WS_EMAIL_COOKIE, canonical, opts);
    res.cookies.set(WS_COMPANY_COOKIE, companyId, opts);
    res.cookies.set(WS_ROLE_COOKIE, isOwner ? "admin" : "member", opts);
    res.cookies.set(WS_SAAS_ROLE_COOKIE, isOwner ? "company_owner" : "employee", opts);
    res.cookies.set(WS_IS_OWNER_COOKIE, isOwner ? "1" : "0", opts);
    res.cookies.set("user_role", dashboard.role, { ...opts, httpOnly: false });

    if (session?.access_token) {
      res.cookies.set("sb-access-token", session.access_token, {
        ...opts,
        maxAge: session.expires_in || 60 * 60,
      });
    }
    if (session?.refresh_token) {
      res.cookies.set("sb-refresh-token", session.refresh_token, opts);
    }

    return res;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    console.error("[api/auth/login]", message);
    return NextResponse.json({ error: "Server error", code: message }, { status: 500 });
  }
}
