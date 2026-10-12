import type { SupabaseClient } from "@supabase/supabase-js";

import { emailDomain } from "@/lib/google/client";
import { isCompanyOwnerEmail } from "@/lib/workspace/company-membership";
import { normalizeDomain, syncCompanyDirectory } from "@/lib/workspace/company-directory";

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
      .from("profiles")
      .select("email, company_id")
      .eq("email", e)
      .maybeSingle();

    if (!row) {
      await supabase.from("profiles").upsert(
        { email: e, company_id: companyId },
        { onConflict: "email" },
      );
      repaired += 1;
    } else if (!row.company_id) {
      await supabase.from("profiles").update({ company_id: companyId }).eq("email", e);
      repaired += 1;
    } else if (row.company_id !== companyId && emailDomain(e) === domain) {
      await supabase.from("profiles").update({ company_id: companyId }).eq("email", e);
      repaired += 1;
    }
  };

  await ensureProfile(adminEmail);

  const { data: orphanProfiles } = await supabase
    .from("profiles")
    .select("email, company_id")
    .is("company_id", null);

  for (const p of orphanProfiles || []) {
    const e = String(p.email || "").toLowerCase();
    if (emailDomain(e) === domain) {
      await ensureProfile(e);
    }
  }

  const { data: domainProfiles } = await supabase
    .from("profiles")
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

export async function loadCompanyAdminStats(
  supabase: SupabaseClient,
  companyId: string,
  ownerEmail: string,
): Promise<CompanyAdminStats | null> {
  const company = await resolveCompany(supabase, companyId, ownerEmail);
  if (!company?.id) return null;

  const profilesRepaired = await repairProfilesForCompany(supabase, {
    id: company.id as string,
    domain: company.domain as string,
    admin_email: company.admin_email as string,
  });

  const resolvedId = company.id as string;

  const { data: users } = await supabase
    .from("company_users")
    .select("drive_used_gb")
    .eq("company_id", resolvedId);

  const storageGb = (users || []).reduce((s, u) => s + Number(u.drive_used_gb || 0), 0);
  const limitGb = Number(company.storage_limit_gb || 100);

  const { count: membersFromProfiles } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("company_id", resolvedId);

  let members = membersFromProfiles || 0;
  if (members === 0) {
    const { count: membersFromCu } = await supabase
      .from("company_users")
      .select("*", { count: "exact", head: true })
      .eq("company_id", resolvedId);
    members = membersFromCu || 0;
  }

  const { count: activeBackups } = await supabase
    .from("company_backup_jobs")
    .select("*", { count: "exact", head: true })
    .eq("company_id", resolvedId)
    .in("status", ["queued", "running"]);

  const { data: jobs } = await supabase
    .from("company_backup_jobs")
    .select("owner_email, status, files_done, files_total, updated_at")
    .eq("company_id", resolvedId)
    .order("updated_at", { ascending: false })
    .limit(8);

  return {
    companyId: resolvedId,
    domain: company.domain as string,
    adminEmail: (company.admin_email as string) || ownerEmail,
    storageGb,
    limitGb,
    members,
    activeBackups: activeBackups || 0,
    profilesRepaired,
    jobs: jobs || [],
  };
}
