import { emailDomain } from "@/lib/google/client";
import { getTenantHandoffStaff } from "@/lib/tenant-profile";

import { getSupabaseOrNull } from "./db";

export type CompanyRow = {
  id: string;
  domain: string;
  admin_email: string;
};

export function isCompanyOwnerEmail(email: string, adminEmail: string): boolean {
  return email.trim().toLowerCase() === adminEmail.trim().toLowerCase();
}

/** One tenant per email domain — staff @company.domain join the existing row. */
export function canAutoJoinCompany(email: string, company: CompanyRow): boolean {
  const normalized = email.trim().toLowerCase();
  if (isCompanyOwnerEmail(normalized, company.admin_email)) return true;

  const domain = emailDomain(normalized);
  if (domain !== company.domain.toLowerCase()) return false;

  const linked = getTenantHandoffStaff(company.domain).map((e) => e.toLowerCase());
  if (linked.length > 0) {
    return linked.includes(normalized);
  }

  return true;
}

export async function findCompanyByDomain(domain: string): Promise<CompanyRow | null> {
  const supabase = await getSupabaseOrNull();
  if (!supabase || !domain) return null;

  const { data } = await supabase
    .from("companies")
    .select("id, domain, admin_email")
    .eq("domain", domain.toLowerCase())
    .maybeSingle();

  if (!data?.id) return null;
  return {
    id: data.id as string,
    domain: data.domain as string,
    admin_email: data.admin_email as string,
  };
}

/** Pre-create `company_users` for configured handoff emails (owner team list). */
export async function provisionLinkedStaff(companyId: string, domain: string): Promise<void> {
  const supabase = await getSupabaseOrNull();
  const emails = getTenantHandoffStaff(domain);
  if (!supabase || !emails.length) return;

  for (const email of emails) {
    const normalized = email.trim().toLowerCase();
    await supabase.from("company_users").upsert(
      {
        company_id: companyId,
        email: normalized,
        role: "member",
        saas_role: "employee",
        is_company_owner: false,
        is_backup_enabled: true,
      },
      { onConflict: "company_id,email" },
    );
  }
}
