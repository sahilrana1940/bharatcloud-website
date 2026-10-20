import type { SupabaseClient } from "@supabase/supabase-js";

import { resolveArchiveCompanyId } from "@/lib/archive/resolve-archive-company";
import { orgEmailBackupTotals } from "@/lib/email/e2e-gmail-backup";
import { emailDomain } from "@/lib/google/client";
import { isCompanyOwnerEmail } from "@/lib/workspace/company-membership";
import { normalizeDomain, syncCompanyDirectory } from "@/lib/workspace/company-directory";
import { WORKSPACE_PROFILES_TABLE } from "@/lib/workspace/workspace-profiles";

export type CompanyAdminStats = {
  companyId: string;
  domain: string;
  adminEmail: string;
  storageGb: number;
  limitGb: number;
  members: number;
  activeBackups: number;
  profilesRepaired: number;
  jobs: Array<{
    owner_email: string;
    status: string;
    files_done: number;
    files_total: number;
    updated_at: string;
  }>;
  emailBackupRuns: number;
  emailBackupEmails: number;
  emailBackupStorageMb: number;
};

async function resolveCompany(
  supabase: SupabaseClient,
  companyId: string,
  ownerEmail: string,
) {
  const normalized = ownerEmail.trim().toLowerCase();

  const { data: byId } = await supabase
    .from("companies")
    .select("id, domain, admin_email, storage_limit_gb")
    .eq("id", companyId)
    .maybeSingle();

  if (byId?.id) return byId;

  const { data: byAdmin } = await supabase
    .from("companies")
    .select("id, domain, admin_email, storage_limit_gb")
    .eq("admin_email", normalized)
    .maybeSingle();

  return byAdmin;
}

/** Link profiles (and company_users) for owner + same email domain as the tenant. */
export async function repairProfilesForCompany(
  supabase: SupabaseClient,
  company: { id: string; domain: string; admin_email: string },
): Promise<number> {
  const companyId = company.id;
  const domain = normalizeDomain(company.domain);
  const adminEmail = company.admin_email.trim().toLowerCase();
  let repaired = 0;

  const ensureProfile = async (email: string) => {
    const e = email.trim().toLowerCase();
    if (!e.includes("@")) return;
    const { data: row } = await supabase
      .from(WORKSPACE_PROFILES_TABLE)
      .select("email, company_id")
      .eq("email", e)
      .maybeSingle();

    if (!row) {
      await supabase.from(WORKSPACE_PROFILES_TABLE).upsert(
        { email: e, company_id: companyId },
        { onConflict: "email" },
      );
      repaired += 1;
    } else if (!row.company_id) {
      await supabase.from(WORKSPACE_PROFILES_TABLE).update({ company_id: companyId }).eq("email", e);
      repaired += 1;
    } else if (row.company_id !== companyId && emailDomain(e) === domain) {
      await supabase.from(WORKSPACE_PROFILES_TABLE).update({ company_id: companyId }).eq("email", e);
      repaired += 1;
    }
  };

  await ensureProfile(adminEmail);

  const { data: orphanProfiles } = await supabase
    .from(WORKSPACE_PROFILES_TABLE)
    .select("email, company_id")
    .is("company_id", null);

  for (const p of orphanProfiles || []) {
    const e = String(p.email || "").toLowerCase();
    if (emailDomain(e) === domain) {
      await ensureProfile(e);
    }
  }

  const { data: domainProfiles } = await supabase
    .from(WORKSPACE_PROFILES_TABLE)
    .select("email")
    .ilike("email", `%@${domain}`);

  for (const p of domainProfiles || []) {
    await ensureProfile(String(p.email));
  }

  await syncCompanyDirectory(companyId, domain);

  for (const email of [adminEmail, ...(domainProfiles || []).map((p) => String(p.email))]) {
    const e = email.toLowerCase();
    if (emailDomain(e) !== domain) continue;
    const isOwner = isCompanyOwnerEmail(e, adminEmail);
    await supabase.from("company_users").upsert(
      {
        company_id: companyId,
        email: e,
        role: isOwner ? "admin" : "member",
        saas_role: isOwner ? "company_owner" : "employee",
        is_company_owner: isOwner,
        is_backup_enabled: true,
      },
      { onConflict: "company_id,email" },
    );
  }

  return repaired;
}

function queryUnavailable(message: string | undefined) {
  return Boolean(message && /does not exist|schema cache|column/i.test(message));
}

/** personal_users for this tenant. Prefer company_id; live rows are keyed by email domain. */
export async function listPersonalUsersForCompany(
  supabase: SupabaseClient,
  companyId: string,
  domain: string,
) {
  const byCompany = await supabase
    .from("personal_users")
    .select("email, storage_used, plan")
    .eq("company_id", companyId);

  if (!byCompany.error) {
    return (byCompany.data || []) as Array<{ email: string; storage_used?: number; plan?: string }>;
  }

  const all = await supabase.from("personal_users").select("email, storage_used, plan");
  const host = domain.trim().toLowerCase();
  return ((all.data || []) as Array<{ email: string; storage_used?: number; plan?: string }>).filter((row) => {
    const email = String(row.email || "").toLowerCase();
    return email.endsWith(`@${host}`);
  });
}

async function countTeamMembers(supabase: SupabaseClient, companyId: string, domain: string) {
  const byCompany = await supabase
    .from("team_members")
    .select("*", { count: "exact", head: true })
    .eq("company_id", companyId);
  if (!byCompany.error) return byCompany.count || 0;

  const byDomain = await supabase
    .from("team_members")
    .select("*", { count: "exact", head: true })
    .eq("company_domain", domain);
  if (!byDomain.error) return byDomain.count || 0;
  return 0;
}

async function loadBackupActivity(
  supabase: SupabaseClient,
  companyId: string,
): Promise<{
  activeBackups: number;
  jobs: CompanyAdminStats["jobs"];
  emailCount: number;
}> {
  const active = await supabase
    .from("backup_jobs")
    .select("*", { count: "exact", head: true })
    .eq("company_id", companyId)
    .in("status", ["queued", "running", "active"]);

  if (!active.error) {
    const { data: jobs } = await supabase
      .from("backup_jobs")
      .select("owner_email, status, files_done, files_total, updated_at")
      .eq("company_id", companyId)
      .order("updated_at", { ascending: false })
      .limit(8);
    const listed = (jobs || []) as CompanyAdminStats["jobs"];
    return {
      activeBackups: active.count || listed.length,
      jobs: listed,
      emailCount: listed.length,
    };
  }

  if (!queryUnavailable(active.error.message)) {
    return { activeBackups: 0, jobs: [], emailCount: 0 };
  }

  const legacy = await supabase
    .from("company_backup_jobs")
    .select("*", { count: "exact", head: true })
    .eq("company_id", companyId)
    .in("status", ["queued", "running"]);

  if (!legacy.error) {
    const { data: jobs } = await supabase
      .from("company_backup_jobs")
      .select("owner_email, status, files_done, files_total, updated_at")
      .eq("company_id", companyId)
      .order("updated_at", { ascending: false })
      .limit(8);
    return {
      activeBackups: legacy.count || 0,
      jobs: (jobs || []) as CompanyAdminStats["jobs"],
      emailCount: 0,
    };
  }

  const { count } = await supabase
    .from("email_backups")
    .select("*", { count: "exact", head: true })
    .eq("company_id", companyId);

  const { data: mails } = await supabase
    .from("email_backups")
    .select("owner_email, date")
    .eq("company_id", companyId)
    .order("date", { ascending: false })
    .limit(8);

  const jobs = (mails || []).map((row) => ({
    owner_email: String(row.owner_email || ""),
    status: "backed up",
    files_done: 1,
    files_total: 1,
    updated_at: String(row.date || new Date().toISOString()),
  }));

  return {
    activeBackups: count || jobs.length,
    jobs,
    emailCount: count || 0,
  };
}

export async function loadCompanyAdminStats(
  supabase: SupabaseClient,
  companyId: string,
  ownerEmail: string,
): Promise<CompanyAdminStats | null> {
  const company = await resolveCompany(supabase, companyId, ownerEmail);
  if (!company?.id) return null;

  const archiveId = await resolveArchiveCompanyId(supabase, company.id as string, ownerEmail);
  const archiveCompany =
    archiveId === company.id ? company : (await resolveCompany(supabase, archiveId, ownerEmail)) || company;

  const profilesRepaired = await repairProfilesForCompany(supabase, {
    id: archiveCompany.id as string,
    domain: archiveCompany.domain as string,
    admin_email: archiveCompany.admin_email as string,
  });

  const resolvedId = archiveCompany.id as string;
  const domain = String(archiveCompany.domain || "");

  const personalUsers = await listPersonalUsersForCompany(supabase, resolvedId, domain);
  const teamMembers = await countTeamMembers(supabase, resolvedId, domain);
  const members = personalUsers.length || teamMembers;

  const usedBytes = personalUsers.reduce((sum, row) => sum + Number(row.storage_used || 0), 0);
  const { data: driveUsers } = await supabase
    .from("company_users")
    .select("drive_used_gb")
    .eq("company_id", resolvedId);
  const driveGb = (driveUsers || []).reduce((sum, row) => sum + Number(row.drive_used_gb || 0), 0);
  const storageGb = Math.max(driveGb, usedBytes / 1024 ** 3);
  const limitGb = Number(archiveCompany.storage_limit_gb || company.storage_limit_gb || 100);

  const activity = await loadBackupActivity(supabase, resolvedId);
  const emailTotals = await orgEmailBackupTotals(supabase, resolvedId);
  const emailBackupEmails = emailTotals.totalEmails || activity.emailCount;

  return {
    companyId: resolvedId,
    domain,
    adminEmail: (archiveCompany.admin_email as string) || ownerEmail,
    storageGb,
    limitGb,
    members,
    activeBackups: activity.activeBackups,
    profilesRepaired,
    jobs: activity.jobs,
    emailBackupRuns: emailTotals.runCount || (activity.emailCount ? 1 : 0),
    emailBackupEmails,
    emailBackupStorageMb: emailTotals.totalMb || storageGb * 1024,
  };
}
