import { createHash } from "crypto";

import { emailDomain } from "@/lib/google/client";
import { getTenantHandoffStaff } from "@/lib/tenant-profile";

import { upsertProfileInvite } from "@/lib/workspace/workspace-profiles";

import { getSupabaseOrNull } from "./db";

export function normalizeDomain(domain: string) {
  return domain.trim().toLowerCase().replace(/^www\./, "");
}

export function emailMatchesDomain(email: string, domain: string) {
  return emailDomain(email.toLowerCase()) === normalizeDomain(domain);
}

/** Upsert directory + handoff suggestions + anyone already on @domain in company_users. */
export async function syncCompanyDirectory(companyId: string, domain: string) {
  const supabase = await getSupabaseOrNull();
  if (!supabase) return { synced: 0 };

  const d = normalizeDomain(domain);
  let synced = 0;

  const handoff = getTenantHandoffStaff(d);
  for (const email of handoff) {
    if (!emailMatchesDomain(email, d)) continue;
    await supabase.from("company_directory_emails").upsert(
      {
        company_id: companyId,
        email: email.toLowerCase(),
        source: "handoff",
        backup_enabled: true,
      },
      { onConflict: "company_id,email" },
    );
    await supabase.from("company_users").upsert(
      {
        company_id: companyId,
        email: email.toLowerCase(),
        role: "member",
        saas_role: "employee",
        is_company_owner: false,
        is_backup_enabled: true,
      },
      { onConflict: "company_id,email" },
    );
    await upsertProfileInvite(supabase, { companyId, email });
    synced += 1;
  }

  const { data: directory } = await supabase
    .from("company_directory_emails")
    .select("email, backup_enabled")
    .eq("company_id", companyId);

  for (const row of directory || []) {
    const email = (row.email as string).toLowerCase();
    if (!emailMatchesDomain(email, d)) continue;
    await supabase.from("company_users").upsert(
      {
        company_id: companyId,
        email,
        role: "member",
        saas_role: "employee",
        is_company_owner: false,
        is_backup_enabled: Boolean(row.backup_enabled),
      },
      { onConflict: "company_id,email" },
    );
    await upsertProfileInvite(supabase, { companyId, email });
    synced += 1;
  }

  return { synced };
}

export async function listDiscoveredEmails(companyId: string, domain: string) {
  const supabase = await getSupabaseOrNull();
  const d = normalizeDomain(domain);
  if (!supabase) return [];

  await syncCompanyDirectory(companyId, d);

  const { data: users } = await supabase
    .from("company_users")
    .select("email, role, saas_role, is_backup_enabled, is_company_owner")
    .eq("company_id", companyId)
    .order("email");

  return (users || []).filter((u) => emailMatchesDomain(u.email as string, d));
}

export function sha256Buffer(buf: Buffer) {
  return createHash("sha256").update(buf).digest("hex");
}
