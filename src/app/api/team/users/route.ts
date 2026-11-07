import { NextRequest, NextResponse } from "next/server";

import { loadCompanyAdminStats } from "@/lib/company-admin/stats";
import { requireWorkspace } from "@/lib/workspace/auth-api";
import { syncCompanyDirectory } from "@/lib/workspace/company-directory";
import { DEMO_USERS } from "@/lib/workspace/demo-data";
import { getSupabaseOrNull } from "@/lib/workspace/db";
import { isWorkspaceOwner } from "@/lib/workspace/nav";
import { resolveCompanyDomain } from "@/lib/workspace/company";
import { loadTeamRoster, type TeamRole } from "@/lib/workspace/team-roster";
import type { SaasRole } from "@/lib/workspace/session";

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
    const users = mapDemoUsers();
    return NextResponse.json({
      users,
      stats: { members: users.length, storageUsedGb: 0, storageLimitGb: 100, activeBackups: 0 },
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

  const stats = await loadCompanyAdminStats(supabase, session.companyId, session.email).catch(() => null);
  const companyId = stats?.companyId || session.companyId;
  const domain = stats?.domain || (await resolveCompanyDomain(session.companyId, session.email)) || "";
  const adminEmail = (stats?.adminEmail || session.email).toLowerCase();

  await ensureOwnerInTeam(supabase, companyId, adminEmail, ownerView);

  let users = await loadTeamRoster(supabase, {
    companyId,
    domain,
    adminEmail,
    sessionEmail: session.email,
  });

  if (!ownerView) {
    users = users.filter((user) => user.email === session.email.toLowerCase());
  }

  const storageUsedGb = users.reduce((sum, user) => sum + Number(user.storage_used_gb || 0), 0);

  return NextResponse.json({
    users,
    stats: {
      members: users.length,
      storageUsedGb: Math.max(storageUsedGb, stats?.storageGb || 0),
      storageLimitGb: stats?.limitGb || 100,
      activeBackups: stats?.activeBackups || users.filter((user) => user.is_backup_enabled).length,
    },
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

  const stats = await loadCompanyAdminStats(supabase, session.companyId, session.email).catch(() => null);
  const companyId = stats?.companyId || session.companyId;
  const domain = stats?.domain || (await resolveCompanyDomain(session.companyId, session.email)) || email.split("@")[1] || "";

  const saved = await upsertMember(supabase, {
    company_id: companyId,
    email,
    role: "member",
    saas_role: "employee",
    is_company_owner: false,
    is_backup_enabled: true,
    display_name: email.split("@")[0],
    drive_used_gb: 0,
    drive_limit_gb: 100,
    drive_sync_status: "idle",
  });
  if (saved) return NextResponse.json({ error: saved }, { status: 500 });

  await supabase.from("team_members").upsert(
    {
      email,
      company_domain: domain,
      company_id: companyId,
      role: "member",
      status: "active",
    },
    { onConflict: "email" },
  );

  const adminEmail = (stats?.adminEmail || session.email).toLowerCase();
  const { data: orgRows } = await supabase.from("organizations").select("id, owner_email").ilike("owner_email", adminEmail);
  const org = (orgRows || []).find((row) => String(row.owner_email || "").toLowerCase() === adminEmail);
  if (org?.id) {
    await supabase.from("org_members").upsert(
      { org_id: org.id, user_email: email, role: "member" },
      { onConflict: "org_id,user_email" },
    );
  }

  const emailSent = await sendTeamInvite(email, session.email, domain);

  return NextResponse.json({ ok: true, email, invited: true, emailSent });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireWorkspace(true);
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;
  if (!isOwnerSession(session)) {
    return NextResponse.json({ error: "Owner only" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  const role = body.role === "admin" ? "admin" : "member";
  if (!email.includes("@")) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  const supabase = await getSupabaseOrNull();
  if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  const stats = await loadCompanyAdminStats(supabase, session.companyId, session.email).catch(() => null);
  const adminEmail = (stats?.adminEmail || session.email).toLowerCase();
  if (email === adminEmail) {
    return NextResponse.json({ error: "The owner role stays with the company owner" }, { status: 400 });
  }

  const companyId = stats?.companyId || session.companyId;
  const saved = await upsertMember(supabase, {
    company_id: companyId,
    email,
    role,
    saas_role: "employee",
    is_company_owner: false,
    is_backup_enabled: true,
  });
  if (saved) return NextResponse.json({ error: saved }, { status: 500 });

  await supabase.from("org_members").update({ role }).eq("user_email", email);
  await supabase.from("team_members").update({ role }).eq("email", email);

  return NextResponse.json({ ok: true, email, role: role as TeamRole });
}

export async function DELETE(req: NextRequest) {
  const auth = await requireWorkspace(true);
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;
  if (!isOwnerSession(session)) {
    return NextResponse.json({ error: "Owner only" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  if (!email.includes("@")) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  const supabase = await getSupabaseOrNull();
  if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  const stats = await loadCompanyAdminStats(supabase, session.companyId, session.email).catch(() => null);
  const adminEmail = (stats?.adminEmail || session.email).toLowerCase();
  if (email === adminEmail) {
    return NextResponse.json({ error: "The owner cannot be removed" }, { status: 400 });
  }

  const companyId = stats?.companyId || session.companyId;
  const { error } = await supabase.from("company_users").delete().eq("company_id", companyId).eq("email", email);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from("org_members").delete().eq("user_email", email);
  await supabase.from("organization_members").delete().eq("email", email);
  await supabase.from("team_members").delete().eq("email", email);

  return NextResponse.json({ ok: true, email });
}

function isOwnerSession(session: { role: string; saasRole?: SaasRole; isCompanyOwner?: boolean }) {
  return isWorkspaceOwner({
    role: session.role,
    saasRole: session.saasRole,
    isCompanyOwner: session.isCompanyOwner,
  });
}

async function sendTeamInvite(email: string, invitedBy: string, domain: string) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.log(`[team-invite] no email key email=${email} invitedBy=${invitedBy}`);
    return false;
  }
  const from = process.env.RESEND_FROM_EMAIL?.trim() || "BharatCloud <onboarding@resend.dev>";
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [email],
        subject: "You're invited to BharatCloud",
        text: `${invitedBy} invited you to the ${domain || "company"} workspace on BharatCloud.\n\nSign in at https://www.bharatcloud.store/login`,
      }),
    });
    if (!res.ok) {
      const detail = await res.text();
      console.log(`[team-invite] email failed email=${email} detail=${detail.slice(0, 180)}`);
      return false;
    }
    return true;
  } catch (error) {
    console.log(`[team-invite] skipped email=${email} reason=${error instanceof Error ? error.message : "failed"}`);
    return false;
  } finally {
    clearTimeout(timer);
  }
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
