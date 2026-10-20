import { NextRequest, NextResponse } from "next/server";

import { isS3Configured } from "@/lib/s3/config";
import { requireWorkspace } from "@/lib/workspace/auth-api";
import { syncCompanyDirectory } from "@/lib/workspace/company-directory";
import { DEMO_USERS } from "@/lib/workspace/demo-data";
import { getSupabaseOrNull } from "@/lib/workspace/db";
import { isWorkspaceOwner } from "@/lib/workspace/nav";
import { resolveCompanyDomain } from "@/lib/workspace/company";

function mapDemoUsers() {
  return DEMO_USERS.map((u) => ({
    ...u,
    name: u.email.split("@")[0],
    storage_used_gb: u.drive_used_gb,
    drive_sync_status: "idle",
    email_sync_status: "idle",
    email_sync_progress: null,
  }));
}

async function ensureOwnerInTeam(
  supabase: NonNullable<Awaited<ReturnType<typeof getSupabaseOrNull>>>,
  companyId: string,
  email: string,
  ownerView: boolean,
) {
  if (!ownerView) return;
  const normalized = email.toLowerCase();
  const { count } = await supabase
    .from("company_users")
    .select("*", { count: "exact", head: true })
    .eq("company_id", companyId);

  if ((count || 0) > 0) return;

  const domain = await resolveCompanyDomain(companyId, normalized);
  await syncCompanyDirectory(companyId, domain);
  await supabase.from("company_users").upsert(
    {
      company_id: companyId,
      email: normalized,
      role: "admin",
      saas_role: "company_owner",
      is_company_owner: true,
      is_backup_enabled: true,
      display_name: normalized.split("@")[0],
    },
    { onConflict: "company_id,email" },
  );
}

export async function GET() {
  const auth = await requireWorkspace();
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    return NextResponse.json({
      users: mapDemoUsers(),
      archivePending: !isS3Configured(),
      session: {
        email: session.email,
        role: session.role,
        companyId: session.companyId,
      },
    });
  }

  const ownerView = isWorkspaceOwner({
    role: session.role,
    saasRole: session.saasRole,
    isCompanyOwner: session.isCompanyOwner,
  });

  await ensureOwnerInTeam(supabase, session.companyId, session.email, ownerView);

  const domain = await resolveCompanyDomain(session.companyId, session.email);
  const { data: domainTeam } = domain
    ? await supabase.from("team_members").select("email, role, status, company_domain").eq("company_domain", domain)
    : { data: [] as Array<{ email: string; role?: string; status?: string }> };

  const { data, error } = await supabase
    .from("company_users")
    .select("*")
    .eq("company_id", session.companyId)
    .order("email");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let users = (data || []).map((u) => ({
    ...u,
    name: u.display_name || u.email.split("@")[0],
    storage_used_gb: u.drive_used_gb,
  }));

  const seen = new Set(users.map((u) => String(u.email || "").toLowerCase()));
  for (const row of domainTeam || []) {
    const email = String(row.email || "").toLowerCase();
    if (!email || seen.has(email)) continue;
    seen.add(email);
    users.push({
      id: email,
      email,
      name: email.split("@")[0],
      role: row.role || "member",
      drive_used_gb: 0,
      storage_used_gb: 0,
      drive_sync_status: row.status || "idle",
      is_backup_enabled: true,
    });
  }

  if (!ownerView) {
    users = users.filter((u) => u.email?.toLowerCase() === session.email.toLowerCase());
  }

  if (!users.length && ownerView) {
    await ensureOwnerInTeam(supabase, session.companyId, session.email, true);
    const { data: retry } = await supabase
      .from("company_users")
      .select("*")
      .eq("company_id", session.companyId)
      .order("email");
    users = (retry || []).map((u) => ({
      ...u,
      name: u.display_name || u.email.split("@")[0],
      storage_used_gb: u.drive_used_gb,
    }));
  }

  return NextResponse.json({
    users,
    archivePending: !isS3Configured(),
    session,
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireWorkspace(true);
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  if (
    !isWorkspaceOwner({
      role: session.role,
      saasRole: session.saasRole,
      isCompanyOwner: session.isCompanyOwner,
    })
  ) {
    return NextResponse.json({ error: "Owner only" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  if (!email.includes("@")) {
    return NextResponse.json({ error: "Enter a team email" }, { status: 400 });
  }

  const supabase = await getSupabaseOrNull();
  if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  const domain = await resolveCompanyDomain(session.companyId, session.email);
  const host = email.split("@")[1] || "";
  if (domain && host !== domain) {
    return NextResponse.json({ error: `Email must be @${domain}` }, { status: 400 });
  }

  const saved = await upsertMember(supabase, {
    company_id: session.companyId,
    email,
    role: "member",
    saas_role: "employee",
    is_company_owner: false,
    is_backup_enabled: true,
    display_name: email.split("@")[0],
    drive_used_gb: 0,
    drive_limit_gb: 100,
  });
  if (saved) return NextResponse.json({ error: saved }, { status: 500 });

  await supabase.from("team_members").upsert(
    {
      email,
      company_domain: domain || host,
      role: "member",
      status: "active",
    },
    { onConflict: "email" },
  );

  return NextResponse.json({ ok: true, email, backup: true });
}

async function upsertMember(
  supabase: NonNullable<Awaited<ReturnType<typeof getSupabaseOrNull>>>,
  row: Record<string, unknown>,
) {
  const payload = { ...row };
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const { error } = await supabase.from("company_users").upsert(payload, { onConflict: "company_id,email" });
    if (!error) return null;
    const missing = error.message.match(/Could not find the '([^']+)' column/i);
    if (!missing) return error.message;
    delete payload[missing[1]];
  }
  return "Could not add team member";
}
